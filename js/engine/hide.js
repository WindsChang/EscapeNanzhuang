// 躲藏機制：棉被 (紅疹量表)、隔簾 / 窗簾 / 床底 (一般躲藏點)、假裝成公仔 (不能亂動)
import { Input, showBlinkButton } from './input.js';
import { audio } from './audio.js';
import { OPPOSITE } from './util.js';

const TOO_CLOSE = 2; // 老鬼離主角這麼近 (格) 時不能躲
const DEFAULTS = {
    futon: { itchRate: 1 / 13, searchTime: 4 }, // 約 13 秒量表滿 (老鬼搜尋 4 秒、離開約 4 秒)
    curtain: { searchTime: 4.5 },
    bed: { searchTime: 4.5 },
    window: { searchTime: 4.5 },
    pose: { searchTime: 5, blinkLimit: 3 },
};

export class HideController {
    constructor(game) {
        this.game = game;
        this.state = null; // { entity, type, front, itch, blinks, opts }
        this.cooldown = 0;
    }

    get active() { return !!this.state; }
    get type() { return this.state ? this.state.type : null; }
    get itch() { return this.state ? this.state.itch : 0; }

    /** 嘗試躲進某個躲藏點，回傳 { ok, msg } */
    tryEnter(entity) {
        const g = this.game;
        if (this.state) return { ok: false };
        if (this.cooldown > 0) return { ok: false, msg: '' };
        const type = entity.hide?.type || 'curtain';
        const opts = { ...DEFAULTS[type], ...(entity.hide || {}) };
        const gh = g.ghost;
        if (gh.active && gh.mode === 'chase' && gh.grace <= 0 && gh.distanceToPlayer() <= TOO_CLOSE) {
            return { ok: false, msg: '太近了，會被發現！' };
        }
        const front = { x: g.player.x, y: g.player.y };
        this.state = { entity, type, front, itch: 0, blinks: 0, opts };
        g.player.teleport(entity.x, entity.y, g.player.dir);
        g.player.hidden = type !== 'pose';
        if (type === 'pose') g.player.dir = 'down';
        audio.playSE('cloth', { vol: 0.8 });
        if (type === 'pose') showBlinkButton(true);
        if (gh.active) gh.onPlayerHid(front, opts.searchTime);
        return { ok: true };
    }

    /** reason: 'self' 主動離開 | 'itch' 癢到跳出來 | 'moved' 亂動被識破 | 'blink' 眨太多次 */
    leave(reason = 'self') {
        const st = this.state;
        if (!st) return;
        const g = this.game;
        const face = OPPOSITE[g.player.dir] || 'down';
        g.player.teleport(st.front.x, st.front.y, face === g.player.dir ? 'down' : face);
        // 面向躲藏點的反方向 (離開的方向)
        g.player.dir = st.front.y > st.entity.y ? 'down' : st.front.y < st.entity.y ? 'up' : st.front.x > st.entity.x ? 'right' : 'left';
        g.player.hidden = false;
        this.state = null;
        this.cooldown = 1.2;
        showBlinkButton(false);
        if (reason === 'itch') {
            g.floatText('好癢!!!');
            g.shake(0.4, 2);
            audio.playSE('itch');
        } else if (reason === 'moved') {
            g.floatText('被發現了！');
            audio.playSE('sting', { vol: 0.7 });
        } else if (reason === 'blink') {
            g.floatText('眨太多次了！');
            audio.playSE('sting', { vol: 0.7 });
        }
        if (g.ghost.active) g.ghost.onPlayerExposed(reason === 'moved' || reason === 'blink');
    }

    /** 場景切換或重來時強制清除 (不觸發任何效果) */
    reset() {
        this.state = null;
        this.cooldown = 0;
        showBlinkButton(false);
        if (this.game.player) this.game.player.hidden = false;
    }

    blink() {
        const st = this.state;
        if (!st || st.type !== 'pose') return;
        st.blinks++;
        this.game.floatText(`眨眼 ${st.blinks}/${st.opts.blinkLimit}`);
        if (st.blinks > st.opts.blinkLimit) this.leave('blink');
    }

    update(dt) {
        if (this.cooldown > 0) this.cooldown -= dt;
        const st = this.state;
        if (!st) return;
        if (st.type === 'futon') {
            const wasBelow = st.itch < 0.75;
            st.itch = Math.min(1, st.itch + st.opts.itchRate * dt);
            if (wasBelow && st.itch >= 0.75) audio.playSE('itch', { vol: 0.6 });
            if (st.itch >= 1) this.leave('itch');
        } else if (st.type === 'pose') {
            if (Input.dir) this.leave('moved'); // 偽裝成公仔時，任何移動輸入都會被識破
        }
    }
}
