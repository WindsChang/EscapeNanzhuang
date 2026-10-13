// 會移動的角色 (主角、可走動的 NPC)：以格子為單位移動，畫面上平滑補間
import { TILE, DIRS } from './util.js';
import { charSheet, drawChar16 } from './sprites.js';

export class Actor {
    constructor({ id, x, y, dir = 'down', look, speed = 4.6, solid = true }) {
        this.id = id;
        this.x = x; // 邏輯格 (移動中為出發格)
        this.y = y;
        this.tx = x; // 目標格
        this.ty = y;
        this.t = 1; // 0..1 移動進度
        this.moving = false;
        this.dir = dir;
        this.speed = speed; // 格/秒
        this.slow = 1; // 地形造成的減速倍率
        this.solid = solid;
        this.stepParity = 0;
        this.hidden = false;
        this.look = look;
        this.sheet = look ? charSheet(id, look) : null;
        this.onStep = null; // (actor) => void，每走完一格呼叫
    }

    get px() { return (this.moving ? this.x + (this.tx - this.x) * this.t : this.x) * TILE; }
    get py() { return (this.moving ? this.y + (this.ty - this.y) * this.t : this.y) * TILE; }

    /** 目前所在的格 (移動超過一半就算到了下一格) */
    get tileX() { return this.moving && this.t >= 0.5 ? this.tx : this.x; }
    get tileY() { return this.moving && this.t >= 0.5 ? this.ty : this.y; }

    teleport(x, y, dir) {
        this.x = this.tx = x;
        this.y = this.ty = y;
        this.t = 1;
        this.moving = false;
        if (dir) this.dir = dir;
    }

    /** 開始朝某方向走一格；被擋住時只轉向並回傳 false */
    start(dir, canEnter) {
        this.dir = dir;
        const d = DIRS[dir];
        const nx = this.x + d.x;
        const ny = this.y + d.y;
        if (!canEnter(nx, ny, this)) return false;
        this.tx = nx;
        this.ty = ny;
        this.t = 0;
        this.moving = true;
        this.stepParity ^= 1;
        return true;
    }

    /**
     * 更新移動。want 為目前想走的方向 (或 null)，每走完一格會再看一次 want，
     * 所以按住方向鍵時可以不停頓地連續移動。
     */
    update(dt, want, canEnter) {
        let left = dt;
        let guard = 0;
        while (left > 0 && guard++ < 8) {
            if (!this.moving) {
                const w = typeof want === 'function' ? want(this) : want;
                if (!w || !this.start(w, canEnter)) return;
            }
            const rate = this.speed * this.slow;
            const need = (1 - this.t) / rate;
            const step = Math.min(left, need);
            this.t += step * rate;
            left -= step;
            if (this.t >= 1 - 1e-6) {
                this.x = this.tx;
                this.y = this.ty;
                this.t = 1;
                this.moving = false;
                if (this.onStep) this.onStep(this);
                if (this.stopRequested) { this.stopRequested = false; return; }
            }
        }
    }

    draw(ctx, camX, camY) {
        if (this.hidden || !this.sheet) return;
        const frame = this.moving ? (this.stepParity ? 1 : 2) : 0;
        drawChar16(ctx, this.sheet, this.dir, frame, this.px - camX, this.py - camY);
    }
}
