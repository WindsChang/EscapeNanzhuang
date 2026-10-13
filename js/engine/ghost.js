// 老鬼 AI：BFS 尋路追逐、跨地圖跟隨、主角躲藏時搜尋後離開
import { Actor } from './actor.js';
import { findPath } from './pathfind.js';
import { ghostSprites } from './ghostface.js';
import { TILE, DIRS } from './util.js';
import { drawTile } from './sprites.js';

const CHASE_SPEED = 3.3; // 格/秒 (主角約 4.6)
const SEE_DISTANCE = 5; // 躲藏者現身時，老鬼在這個距離內會立刻發現
const FOLLOW_DELAY = 2.0; // 跨地圖後老鬼出現的延遲 (秒)
const FOLLOW_MIN_DISTANCE = 3; // 出現時與主角至少要隔幾格，避免一出現就被抓

function dirBetween(ax, ay, bx, by) {
    if (bx > ax) return 'right';
    if (bx < ax) return 'left';
    if (by > ay) return 'down';
    if (by < ay) return 'up';
    return null;
}

export class Ghost {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.body = new Actor({ id: 'ghost', x: 0, y: 0, speed: CHASE_SPEED, solid: false });
        this.mode = 'chase'; // chase | search | leave
        this.stage = 1;
        this.grace = 0; // 出現後的緩衝時間 (不會移動、不會抓人)
        this.appear = 0;
        this.anim = 0;
        this.pending = null; // 跨地圖跟隨：{ mapId, x, y, delay }
        this.searchTarget = null;
        this.searchTimer = 0;
        this.wanderTimer = 0;
        this.leaveTarget = null;
        this.leaveTimer = 0;
        this.searchTime = 4;
        this.speedMul = 1; // 場景自訂的速度倍率 (在難度補償之外)
    }

    get tileX() { return this.body.tileX; }
    get tileY() { return this.body.tileY; }

    /** 在目前地圖的某格出現並開始追逐 */
    spawn(x, y, { stage = this.stage, speedMul = 1, grace = 0.8 } = {}) {
        this.stage = stage;
        this.speedMul = speedMul;
        this.body.teleport(x, y, 'down');
        this.active = true;
        this.mode = 'chase';
        this.grace = grace;
        this.appear = 0;
        this.pending = null;
        this.searchTarget = null;
    }

    despawn() {
        this.active = false;
        this.pending = null;
        this.searchTarget = null;
        this.prop = null;
    }

    /** 主角穿過出入口時：老鬼在延遲後從目的地的指定格出現 */
    queueFollow(mapId, x, y) {
        if (!this.active && !this.pending) return;
        const stage = this.stage;
        const speedMul = this.speedMul;
        this.active = false;
        this.pending = { mapId, x, y, delay: FOLLOW_DELAY, stage, speedMul };
    }

    /** 主角躲起來了：老鬼走到躲藏點前面搜尋 */
    onPlayerHid(frontTile, searchTime) {
        if (!this.active) return;
        this.mode = 'search';
        this.searchTarget = frontTile;
        this.searchTimer = -1; // 還沒到達
        this.searchTime = searchTime;
    }

    /** 主角現身 (主動離開、被迫跳出、被識破)；spotted = 被識破，老鬼不論距離都會發現 */
    onPlayerExposed(spotted = false) {
        if (!this.active) return;
        const d = Math.abs(this.tileX - this.game.player.x) + Math.abs(this.tileY - this.game.player.y);
        if (spotted || d <= SEE_DISTANCE || this.mode === 'chase') this.mode = 'chase';
    }

    distanceToPlayer() {
        return Math.abs(this.tileX - this.game.player.tileX) + Math.abs(this.tileY - this.game.player.tileY);
    }

    update(dt) {
        const g = this.game;
        if (this.pending) {
            this.pending.delay -= dt;
            if (this.pending.delay <= 0 && g.map.id === this.pending.mapId) {
                const p = this.pending;
                const far = Math.abs(p.x - g.player.tileX) + Math.abs(p.y - g.player.tileY) >= FOLLOW_MIN_DISTANCE;
                if (far) this.spawn(p.x, p.y, { stage: p.stage, speedMul: p.speedMul, grace: 0.6 });
            }
            return;
        }
        if (!this.active) return;
        this.anim += dt;
        this.appear = Math.min(1, this.appear + dt * 2);
        if (this.grace > 0) { this.grace -= dt; return; }

        const diff = g.difficulty();
        this.body.speed = CHASE_SPEED * diff.speed * this.speedMul * (this.mode === 'leave' ? 0.85 : 1);

        // 躲藏中的狀態機
        if (this.mode === 'search' || this.mode === 'leave') {
            if (!g.hide.active && this.distanceToPlayer() <= SEE_DISTANCE) this.mode = 'chase';
        }
        if (this.mode === 'search') this.tickSearch(dt);
        else if (this.mode === 'leave') this.tickLeave(dt);

        this.body.update(dt, () => this.decide(), (x, y) => g.ghostCanEnter(x, y));

        if (!g.hide.active && !g.invincible && this.touchesPlayer()) g.onCaught();
    }

    touchesPlayer() {
        const p = this.game.player;
        return Math.abs(this.body.px - p.px) < 10 && Math.abs(this.body.py - p.py) < 10;
    }

    tickSearch(dt) {
        const reached = this.tileX === this.searchTarget.x && this.tileY === this.searchTarget.y && !this.body.moving;
        if (this.searchTimer < 0) {
            if (reached) this.searchTimer = this.searchTime;
            return;
        }
        this.searchTimer -= dt;
        this.wanderTimer -= dt;
        if (this.searchTimer <= 0) {
            this.mode = 'leave';
            this.leaveTarget = this.pickLeaveTarget();
            this.leaveTimer = 3.5;
        }
    }

    tickLeave(dt) {
        this.leaveTimer -= dt;
        const arrived = this.leaveTarget && this.tileX === this.leaveTarget.x && this.tileY === this.leaveTarget.y;
        if (arrived || this.leaveTimer <= 0) this.game.endChase('escaped');
    }

    pickLeaveTarget() {
        const g = this.game;
        const from = { x: this.tileX, y: this.tileY };
        let best = null;
        let bestLen = -1;
        for (let i = 0; i < 14; i++) {
            const x = Math.floor(Math.random() * g.map.width);
            const y = Math.floor(Math.random() * g.map.height);
            if (!g.ghostCanEnter(x, y)) continue;
            const path = findPath(g.map.width, g.map.height, (px, py) => g.ghostCanEnter(px, py), from, { x, y });
            if (path && path.length > bestLen) { best = { x, y }; bestLen = path.length; }
        }
        return best || from;
    }

    /** 走到下一格前決定方向 */
    decide() {
        const g = this.game;
        const from = { x: this.body.x, y: this.body.y };
        let target = null;
        if (this.mode === 'chase') target = { x: g.player.tileX, y: g.player.tileY };
        else if (this.mode === 'search') {
            if (this.searchTimer >= 0 && this.wanderTimer <= 0) {
                // 在躲藏點前徘徊：隨機往旁邊走一格，或原地東張西望
                this.wanderTimer = 0.9 + Math.random() * 0.8;
                const opts = Object.keys(DIRS).filter((d) => g.ghostCanEnter(from.x + DIRS[d].x, from.y + DIRS[d].y));
                if (opts.length && Math.random() < 0.5) return opts[Math.floor(Math.random() * opts.length)];
                this.body.dir = Object.keys(DIRS)[Math.floor(Math.random() * 4)];
                return null;
            }
            if (this.searchTimer >= 0) {
                // 偏離搜尋點太遠就走回去
                const t = this.searchTarget;
                if (Math.abs(from.x - t.x) + Math.abs(from.y - t.y) <= 1) return null;
            }
            target = this.searchTarget;
        } else if (this.mode === 'leave') target = this.leaveTarget;
        if (!target) return null;
        if (from.x === target.x && from.y === target.y) return null;
        const path = findPath(g.map.width, g.map.height, (x, y) => g.ghostCanEnter(x, y), from, target);
        if (!path || !path.length) return null;
        return dirBetween(from.x, from.y, path[0].x, path[0].y);
    }

    draw(ctx, camX, camY) {
        if (!this.active) return;
        const spr = ghostSprites(this.stage).map;
        const bob = Math.sin(this.anim * 7) * 1.2;
        ctx.save();
        ctx.globalAlpha = this.appear;
        ctx.drawImage(spr, Math.round(this.body.px - camX + TILE / 2 - 16), Math.round(this.body.py - camY + TILE - 40 + bob));
        // 隨身道具 (例如醫院裡推著的點滴架)，畫在老鬼面向的另一側
        if (this.prop) {
            const side = this.body.dir === 'left' ? -14 : 14;
            drawTile(ctx, this.prop, this.body.px - camX + side, this.body.py - camY + bob * 0.5);
        }
        ctx.restore();
    }
}
