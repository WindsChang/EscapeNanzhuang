// 遊戲核心：地圖與實體、主角控制、劇情腳本 API、追逐與嚇暈、存檔快照、HUD
import { TILE, VIEW_W, VIEW_H, DIRS, clamp, facingTo } from './util.js';
import { Input } from './input.js';
import { audio } from './audio.js';
import { GameMap } from './map.js';
import { Actor } from './actor.js';
import { Ghost } from './ghost.js';
import { HideController } from './hide.js';
import { Dialog } from './dialog.js';
import { Puzzle } from './puzzle.js';
import { Menu } from './menu.js';
import { GameState } from './state.js';
import { difficultyFor } from './difficulty.js';
import { drawTile } from './sprites.js';
import { ghostSprites } from './ghostface.js';
import { charSheet, drawChar16 } from './sprites.js';
import * as Save from './save.js';
import * as overlays from './overlays.js';
import { CHARACTERS, PLAYER_ID } from '../content/characters.js';
import { itemDef } from '../content/items.js';
import { CHAPTERS, mapDef } from '../content/chapters/index.js';

export class Game {
    constructor({ canvas, ui }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.ui = ui;
        this.state = new GameState();
        this.dialog = new Dialog(ui, () => Save.settings.get().textSpeed);
        this.puzzle = new Puzzle(ui);
        this.menu = new Menu(ui, this.menuHooks());
        this.ghost = new Ghost(this);
        this.hide = new HideController(this);

        this.mode = 'idle'; // idle (標題等) | play
        this.map = null;
        this.entities = [];
        this.player = null;
        this.npcs = new Map();
        this.cam = { x: 0, y: 0 };

        this.scriptDepth = 0;
        this.fadeAlpha = 0;
        this.fadeBusy = false;
        this.timers = []; // 以遊戲時間計算的等待
        this.waiters = []; // 輪詢條件的等待 (until)
        this.shakeT = 0;
        this.shakeAmp = 0;
        this.flashT = 0;
        this.floats = [];
        this.faintFx = null;
        this.fainting = false;
        this.invincible = false;
        this.showCoords = false;

        this.faintRestart = null; // 章節指定的固定重來點：async (g, cause) => void
        this.chase = null; // { reason }
        this.timer = null; // 限時：{ left, total, onTimeout }
        this.slowZone = false;
        this.checkpoint = null; // 沒有存檔時用來重來的記憶體快照
        this.clock = 0;
        this.onTitle = null; // 由 main.js 注入：回到標題

        Input.push((name) => this.onInput(name));
    }

    // ------------------------------------------------------------------
    // 狀態查詢
    // ------------------------------------------------------------------

    get mapId() { return this.map ? this.map.id : null; }
    get faintCount() { return Save.meta.get().faints; }
    difficulty() { return difficultyFor(this.faintCount); }
    get busy() { return this.scriptDepth > 0 || this.fadeBusy || this.fainting || this.menu.isOpen || this.puzzle.isOpen || this.dialog.isOpen; }
    get scriptActive() { return this.scriptDepth > 0; }

    saveLock() {
        if (this.chase) return '追逐中，現在沒空存檔！';
        if (this.timer) return '時間緊迫，現在沒空存檔！';
        if (this.scriptActive || this.fainting) return '現在不能存檔。';
        return null;
    }

    menuHooks() {
        return {
            status: () => {
                const ch = CHAPTERS[this.state.chapter];
                return `${ch ? ch.title : ''}　${this.map ? this.map.name : ''}　嚇暈 ${this.faintCount} 次`;
            },
            items: () => this.state.items,
            objective: () => (this.difficulty().hint ? this.state.objective : ''),
            canSave: () => { const r = this.saveLock(); return r ? { ok: false, reason: r } : { ok: true }; },
            snapshot: () => this.snapshot(),
            load: (data) => this.loadSnapshot(data),
            toTitle: () => { this.endChase('abort'); this.mode = 'idle'; this.onTitle && this.onTitle(); },
            settings: Save.settings,
        };
    }

    // ------------------------------------------------------------------
    // 章節與地圖
    // ------------------------------------------------------------------

    /**
     * 開始新遊戲或跳到某章節。
     * reset：先清空道具與旗標；preset：套用該章節預設的前置狀態 (除錯跳關用)。
     */
    async startChapter(id, { reset = false, preset = false, skipIntro = false } = {}) {
        const ch = CHAPTERS[id];
        if (!ch) throw new Error('unknown chapter ' + id);
        if (reset) this.state.reset();
        this.state.chapter = id;
        if (preset && ch.preset) {
            for (const item of ch.preset.items || []) this.state.give(item);
            Object.assign(this.state.flags, ch.preset.flags || {});
            if (ch.preset.objective) this.state.objective = ch.preset.objective;
        }
        this.mode = 'play';
        this.endChase('abort');
        this.cancelTimer();
        this.faintRestart = null;
        this.fainting = false;
        this.dialog.close();
        audio.stopBGM(0.4);
        if (ch.stub) {
            await this.stubChapter(ch);
            return;
        }
        await ch.start(this, { skipIntro });
    }

    async stubChapter(ch) {
        this.state.chapter = 'sandbox';
        await CHAPTERS.sandbox.start(this, { skipIntro: true });
        await this.runScript(() => this.narrate(`「${ch.title}」的內容還沒做好，先回到示範場景。`));
    }

    /** 載入地圖並放置主角 */
    loadMap(id, x, y, dir = 'down') {
        const def = mapDef(id);
        if (!def) throw new Error('unknown map ' + id);
        this.map = new GameMap(def);
        this.entities = (def.entities || []).map((e, i) => ({ w: 1, h: 1, ...e, _i: i, fired: false }));
        this.hide.reset();
        this.player = new Actor({ id: PLAYER_ID, x, y, dir, look: this.playerLook() });
        this.player.onStep = (a) => this.onPlayerStep(a);
        this.npcs.clear();
        for (const e of this.entities) {
            if (e.kind === 'npc' && e.char) {
                const a = new Actor({ id: e.char, x: e.x, y: e.y, dir: e.dir || 'down', look: CHARACTERS[e.char] ? CHARACTERS[e.char].look : null });
                e.actor = a;
                this.npcs.set(e.id || e.char, a);
            }
        }
        this.updateCamera(true);
        if (def.bgm && audio.currentBGM !== def.bgm && !this.chase) audio.playBGM(def.bgm);
    }

    /** 主角目前的外觀 (被蜂叮後臉腫成大頭，狀態存在旗標裡，讀檔也會還原) */
    playerLook() {
        const look = CHARACTERS[PLAYER_ID].look;
        return this.state.flag('bighead') ? { ...look, bigHead: true } : look;
    }

    setBigHead(on) {
        this.state.flag('bighead', !!on);
        if (this.player) {
            this.player.look = this.playerLook();
            this.player.sheet = charSheet(PLAYER_ID + (on ? ':big' : ''), this.player.look);
        }
    }

    entityActive(e) {
        if (e.removed) return false;
        if (e.when && !e.when(this)) return false;
        return true;
    }

    entitiesAt(x, y) {
        return this.entities.filter((e) => this.entityActive(e) && x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h);
    }

    removeEntity(idOrEntity) {
        const e = typeof idOrEntity === 'string' ? this.entities.find((x) => x.id === idOrEntity) : idOrEntity;
        if (e) e.removed = true;
    }

    // ------------------------------------------------------------------
    // 移動與碰撞
    // ------------------------------------------------------------------

    canEnter(x, y, actor) {
        if (this.map.solidTile(x, y)) return false;
        for (const e of this.entitiesAt(x, y)) {
            if (e.solid || (e.kind === 'npc' && e.actor !== actor)) return false;
        }
        return true;
    }

    ghostCanEnter(x, y) {
        if (this.map.solidTile(x, y)) return false;
        return !this.entitiesAt(x, y).some((e) => e.solid || e.kind === 'npc');
    }

    onPlayerStep(a) {
        if (this.scriptActive) return; // 腳本控制的移動不觸發出入口與觸發區
        // 地形減速 (山路陡坡)
        const g = this.map.tileName('ground', a.x, a.y);
        a.slow = g === 'slope' ? 0.55 : 1;
        audio.playSE('footstep', { vol: 0.35, rate: 0.9 + Math.random() * 0.2 });
        for (const e of this.entitiesAt(a.x, a.y)) {
            if (e.kind === 'exit') { this.useExit(e); return; }
            if (e.kind === 'trigger') this.fireTrigger(e);
        }
    }

    fireTrigger(e) {
        if (e.once !== false && e.fired) return;
        e.fired = true;
        if (e.onEnter) this.runScript(() => e.onEnter(this, e));
    }

    async useExit(e) {
        if (this.scriptActive) return;
        const need = e.requires;
        if (need && !this.state.has(need)) {
            audio.playSE('locked');
            this.player.stopRequested = true;
            await this.runScript(() => this.say('narrator', e.lockedMsg || '鎖住了，打不開。', { narration: true }));
            // 退一步，避免卡在出入口上
            const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[this.player.dir];
            if (this.player.start(back, (x, y) => this.canEnter(x, y, this.player))) { /* 走回去 */ }
            return;
        }
        await this.runScript(async () => {
            audio.playSE(e.sfx || 'door_open');
            await this.fade(true, 0.25);
            if (this.chase) this.ghost.queueFollow(e.to, e.tx, e.ty);
            this.loadMap(e.to, e.tx, e.ty, e.dir || this.player.dir);
            if (e.onUse) await e.onUse(this, e);
            await this.fade(false, 0.25);
        }, { keepGhost: false });
    }

    // ------------------------------------------------------------------
    // 輸入
    // ------------------------------------------------------------------

    onInput(name) {
        if (this.mode !== 'play' || this.busy) return;
        if (name === 'cancel') {
            if (this.hide.active && this.hide.type === 'pose') return;
            this.menu.open();
        } else if (name === 'ok') {
            if (this.hide.active) { if (this.hide.type !== 'pose') this.hide.leave('self'); return; }
            this.interact();
        } else if (name === 'blink') {
            this.hide.blink();
        } else if (['up', 'down', 'left', 'right'].includes(name) && this.hide.active && this.hide.type !== 'pose') {
            this.hide.leave('self');
        }
    }

    interact() {
        const p = this.player;
        if (p.moving) return;
        const d = DIRS[p.dir];
        const fx = p.x + d.x;
        const fy = p.y + d.y;
        const e = this.entitiesAt(fx, fy).find((en) => ['inspect', 'npc', 'hide', 'item'].includes(en.kind))
            || this.entitiesAt(p.x, p.y).find((en) => en.kind === 'inspect' && en.here);
        if (!e) return;
        if (e.kind === 'npc' && e.actor) e.actor.dir = facingTo(e.x, e.y, p.x, p.y);
        if (e.kind === 'hide') {
            // 沒有追逐時，躲藏點只是普通的物件：顯示 idle 劇情 (沒有 idle 就直接可以躲)
            if (!this.chase && e.idle) { this.runScript(() => e.idle(this, e)); return; }
            const r = this.hide.tryEnter(e);
            if (!r.ok && r.msg) this.floatText(r.msg);
            return;
        }
        if (e.onInteract) this.runScript(() => e.onInteract(this, e));
    }

    // ------------------------------------------------------------------
    // 劇情腳本 API
    // ------------------------------------------------------------------

    /** 執行一段腳本：期間玩家無法操作、老鬼暫停 */
    async runScript(fn, opts = {}) {
        this.scriptDepth++;
        Input.clear();
        try {
            return await fn(this);
        } catch (err) {
            console.error('script error', err);
        } finally {
            this.scriptDepth--;
            Input.clear();
            void opts;
        }
    }

    say(who, text, opts) { return this.dialog.say(who, text, opts); }
    narrate(text) { return this.dialog.say('narrator', text, { narration: true }); }
    choice(options, opts) { return this.dialog.choice(options, opts); }
    code(opts) { return this.puzzle.code(opts); }
    arrange(opts) { return this.puzzle.arrange(opts); }

    wait(sec) { return new Promise((resolve) => this.timers.push({ t: sec, resolve })); }

    fade(out, sec = 0.4) {
        this.fadeBusy = true;
        const from = this.fadeAlpha;
        const to = out ? 1 : 0;
        return new Promise((resolve) => {
            this.fadeAnim = { from, to, t: 0, sec: Math.max(0.01, sec), resolve };
        });
    }

    flash(sec = 0.5) { this.flashT = sec; this.flashTotal = sec; }
    shake(sec = 0.4, amp = 3) { this.shakeT = sec; this.shakeAmp = amp; }

    floatText(text, sec = 1.4) { this.floats.push({ text, t: sec, total: sec }); }

    bgm(name, opts) { audio.playBGM(name, opts); }
    se(name, opts) { audio.playSE(name, opts); }

    give(item, { silent = false } = {}) {
        if (this.state.has(item)) return;
        this.state.give(item);
        if (!silent) {
            audio.playSE('item');
            this.floatText(`取得「${itemDef(item).name}」`, 2);
        }
    }
    has(item) { return this.state.has(item); }
    take(item) { this.state.take(item); }
    flag(name, value) { return this.state.flag(name, value); }
    setObjective(text) { this.state.objective = text; }

    npc(id) { return this.npcs.get(id); }

    /**
     * 讓角色走到指定格或依方向走：steps 可為 [{x,y}...] 或 ['up','up','left'...] (每個字串走一格)。
     * 'player' 代表主角，其他字串為地圖上 NPC 的 id。
     */
    async moveActor(actor, steps, { speed } = {}) {
        const a = typeof actor === 'string' ? (actor === 'player' ? this.player : this.npc(actor)) : actor;
        if (!a) return;
        const old = a.speed;
        if (speed) a.speed = speed;
        for (const s of steps) {
            let target = s;
            if (typeof s === 'string') target = { x: a.x + DIRS[s].x, y: a.y + DIRS[s].y };
            let guard = 0;
            while ((a.x !== target.x || a.y !== target.y) && guard++ < 200) {
                const dx = Math.sign(target.x - a.x);
                const dy = dx !== 0 ? 0 : Math.sign(target.y - a.y);
                const d = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
                if (!a.start(d, () => true)) break;
                await this.until(() => !a.moving);
            }
        }
        a.speed = old;
    }

    /** 等到條件成立 (以遊戲迴圈輪詢) */
    until(pred) {
        return new Promise((resolve) => this.waiters.push({ pred, resolve }));
    }

    // ------------------------------------------------------------------
    // 限時
    // ------------------------------------------------------------------

    startTimer(seconds, onTimeout) { this.timer = { left: seconds, total: seconds, onTimeout }; }
    addTime(sec) { if (this.timer) this.timer.left = Math.max(0, this.timer.left + sec); }
    cancelTimer() { this.timer = null; }

    // ------------------------------------------------------------------
    // 場景小工具 (標題卡、蛋糕、照片、片尾)
    // ------------------------------------------------------------------

    card(text, sub = '', opts) { return overlays.card(this.ui, text, sub, opts); }
    cake() { return overlays.cake(this.ui); }
    photos() { return overlays.photos(this.ui); }
    credits() { return overlays.credits(this.ui); }

    /** 章節接續時，上一段結尾是黑畫面：載入新地圖後淡入 */
    async fadeInIfDark(sec = 0.6) {
        if (this.fadeAlpha > 0.01) await this.fade(false, sec);
    }

    /** 老鬼慢慢變透明消失 */
    async fadeOutGhost(sec = 1.5) {
        const gh = this.ghost;
        if (!gh.active) return;
        const n = Math.round(sec * 20);
        for (let i = 1; i <= n; i++) { gh.appear = 1 - i / n; await this.wait(0.05); }
        gh.despawn();
    }

    /** 立刻擺出一隻不會動的老鬼 (劇情演出用)：不開始追逐 */
    showGhost(x, y, stage) {
        const gh = this.ghost;
        gh.spawn(x, y, { stage, grace: 9999 });
        gh.appear = 1;
        return gh;
    }

    /** 讓 NPC 轉向 */
    face(id, dir) {
        const a = this.npc(id);
        if (a) a.dir = dir;
    }

    /** 把 NPC 瞬間移到某格 */
    placeNpc(id, x, y, dir) {
        const a = this.npc(id);
        if (a) a.teleport(x, y, dir);
    }

    // ------------------------------------------------------------------
    // 追逐、嚇暈
    // ------------------------------------------------------------------

    /** 讓老鬼在指定格出現並開始追逐 */
    startChase(x, y, { stage = 1, speedMul = 1, bgm = 'chase', grace, prop = null } = {}) {
        this.chase = { prevBgm: this.map.def.bgm, bgm };
        this.ghost.spawn(x, y, { stage, speedMul, grace });
        this.ghost.prop = prop;
        audio.playSE('ghost');
        audio.playBGM(bgm, { fade: 0.3 });
    }

    /** 追逐結束：reason = 'escaped' 躲過 | 'script' 劇情 | 'abort' 強制 */
    endChase(reason = 'script') {
        if (!this.chase && !this.ghost.active && !this.ghost.pending) return;
        const prev = this.chase ? this.chase.prevBgm : null;
        this.chase = null;
        this.ghost.despawn();
        if (reason !== 'abort') {
            if (reason === 'escaped') this.floatText('躲過去了…', 2);
            if (prev) audio.playBGM(prev, { fade: 0.8 });
        }
    }

    onCaught() {
        if (this.fainting || this.invincible) return;
        this.faint('ghost');
    }

    /** 嚇暈：搞笑演出 -> 計數 -> 選擇重來點 */
    async faint(cause = 'ghost') {
        if (this.fainting) return;
        this.fainting = true;
        Input.clear();
        this.hide.reset();
        const stage = this.ghost.stage;
        this.endChase('abort');
        this.cancelTimer();
        audio.stopBGM(0.2);
        if (cause === 'ghost') {
            // 老鬼的大臉放大出現
            audio.playSE('ghost');
            await this.playFx({ kind: 'jump', stage, dur: 0.9 });
        } else {
            await this.playFx({ kind: 'swell', dur: 0.9 });
        }
        audio.playSE('faint');
        this.flash(0.35);
        await this.playFx({ kind: 'dizzy', dur: 1.5 });
        const m = Save.meta.set({ faints: Save.meta.get().faints + 1 });
        await this.fade(true, 0.5);
        this.scriptDepth++;
        try {
            await this.narrate(cause === 'ghost' ? '嚇暈了……（累計 ' + m.faints + ' 次）' : '腫到暈倒了……（累計 ' + m.faints + ' 次）');
            // 章節指定了固定的重來點 (例如 Day 2 限時下山一律從山頂重新開始)
            if (this.faintRestart) {
                const restart = this.faintRestart;
                this.fainting = false;
                this.scriptDepth--;
                await restart(this, cause);
                await this.fade(false, 0.5);
                return;
            }
            const manual = Save.latestManual();
            const auto = Save.readSlot(Save.AUTO);
            const options = [];
            const actions = [];
            if (manual) { options.push(`讀取最近的存檔（欄位 ${manual.slot}）`); actions.push(() => this.loadSnapshot(manual.data)); }
            if (auto.status === 'ok') { options.push('從今天開頭重來'); actions.push(() => this.loadSnapshot(auto.data)); }
            if (!options.length) { options.push('再試一次'); actions.push(() => this.restoreCheckpoint()); }
            const idx = await this.choice(options);
            this.fainting = false;
            this.scriptDepth--;
            actions[idx]();
            await this.fade(false, 0.5);
        } catch (err) {
            console.error(err);
            this.fainting = false;
            this.scriptDepth = Math.max(0, this.scriptDepth - 1);
        }
    }

    playFx(fx) {
        return new Promise((resolve) => { this.faintFx = { ...fx, t: 0, resolve }; });
    }

    // ------------------------------------------------------------------
    // 存檔
    // ------------------------------------------------------------------

    snapshot() {
        const p = this.player;
        return {
            ...this.state.toJSON(),
            mapId: this.map.id,
            x: p.x, y: p.y, facing: p.dir,
            label: `${(CHAPTERS[this.state.chapter] || {}).title || ''} ${this.map.name}`.trim(),
            savedAt: Date.now(),
        };
    }

    autosave() {
        Save.writeSlot(Save.AUTO, this.snapshot());
        this.checkpoint = this.snapshot();
    }

    setCheckpoint() { this.checkpoint = this.snapshot(); }

    restoreCheckpoint() {
        if (this.checkpoint) this.loadSnapshot(this.checkpoint);
    }

    loadSnapshot(data) {
        this.endChase('abort');
        this.cancelTimer();
        this.faintRestart = null;
        this.dialog.close();
        this.state.load(data);
        this.mode = 'play';
        this.fainting = false;
        this.timers = [];
        this.waiters = [];
        this.loadMap(data.mapId, data.x, data.y, data.facing || 'down');
        // 章節的 onLoad 負責依旗標還原地圖變化 (例如已打開的門、已拿走的道具)
        const ch = CHAPTERS[data.chapter];
        if (ch && ch.onLoad) ch.onLoad(this);
    }

    // ------------------------------------------------------------------
    // 更新與繪製
    // ------------------------------------------------------------------

    update(dtRaw) {
        const dt = Math.min(0.05, dtRaw);
        this.clock += dt;
        this.updateTimers(dt);
        this.updateFade(dt);
        this.updateEffects(dt);
        if (this.mode !== 'play' || !this.map) return;

        const paused = this.menu.isOpen;
        if (paused) return;

        // NPC 只由腳本驅動移動，這裡只負責把移動中的動畫跑完
        for (const e of this.entities) if (e.actor && e.actor.moving) e.actor.update(dt, null, () => true);
        const canControl = !this.busy && !this.hide.active;
        const want = canControl ? Input.dir : null;
        this.player.update(dt, want, (x, y, a) => this.canEnter(x, y, a));
        this.updateWaiters();

        if (!this.scriptActive && !this.fainting) {
            this.hide.update(dt);
            this.ghost.update(dt);
            if (this.timer) {
                this.timer.left -= dt;
                if (this.timer.left <= 0) {
                    const cb = this.timer.onTimeout;
                    this.timer = null;
                    if (cb) cb(this); else this.faint('time');
                }
            }
        }
        this.updateCamera();
    }

    updateTimers(dt) {
        if (!this.timers.length) return;
        const rest = [];
        for (const t of this.timers) {
            t.t -= dt;
            if (t.t <= 0) t.resolve();
            else rest.push(t);
        }
        this.timers = rest;
    }

    updateWaiters() {
        if (!this.waiters.length) return;
        const rest = [];
        for (const w of this.waiters) {
            if (w.pred()) w.resolve();
            else rest.push(w);
        }
        this.waiters = rest;
    }

    updateFade(dt) {
        const f = this.fadeAnim;
        if (!f) return;
        f.t += dt;
        const k = clamp(f.t / f.sec, 0, 1);
        this.fadeAlpha = f.from + (f.to - f.from) * k;
        if (k >= 1) {
            this.fadeAnim = null;
            this.fadeBusy = false;
            f.resolve();
        }
    }

    updateEffects(dt) {
        if (this.shakeT > 0) this.shakeT -= dt;
        if (this.flashT > 0) this.flashT -= dt;
        for (const f of this.floats) f.t -= dt;
        this.floats = this.floats.filter((f) => f.t > 0);
        const fx = this.faintFx;
        if (fx) {
            fx.t += dt;
            if (fx.t >= fx.dur) { this.faintFx = null; fx.resolve(); }
        }
    }

    updateCamera(snap = false) {
        if (!this.map || !this.player) return;
        const mw = this.map.width * TILE;
        const mh = this.map.height * TILE;
        const tx = mw <= VIEW_W ? -(VIEW_W - mw) / 2 : clamp(this.player.px + TILE / 2 - VIEW_W / 2, 0, mw - VIEW_W);
        const ty = mh <= VIEW_H ? -(VIEW_H - mh) / 2 : clamp(this.player.py + TILE / 2 - VIEW_H / 2, 0, mh - VIEW_H);
        if (snap) { this.cam.x = tx; this.cam.y = ty; return; }
        this.cam.x = tx;
        this.cam.y = ty;
    }

    draw() {
        const ctx = this.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = this.map ? this.map.bg : '#000';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        if (this.mode !== 'play' || !this.map) return;

        let ox = 0;
        let oy = 0;
        if (this.shakeT > 0) {
            ox = Math.round((Math.random() * 2 - 1) * this.shakeAmp);
            oy = Math.round((Math.random() * 2 - 1) * this.shakeAmp);
        }
        const cx = Math.round(this.cam.x) - ox;
        const cy = Math.round(this.cam.y) - oy;

        this.map.draw(ctx, cx, cy);
        this.drawEntities(ctx, cx, cy);
        this.drawActors(ctx, cx, cy);
        if (this.map.dark) this.drawDark(ctx);
        this.drawHud(ctx);
        this.drawFx(ctx);
    }

    drawEntities(ctx, cx, cy) {
        for (const e of this.entities) {
            if (!this.entityActive(e) || !e.tile) continue;
            drawTile(ctx, e.tile, e.x * TILE - cx, e.y * TILE - cy);
        }
    }

    drawActors(ctx, cx, cy) {
        const list = [];
        for (const e of this.entities) {
            if (e.kind === 'npc' && e.actor && this.entityActive(e)) list.push({ y: e.actor.py, draw: () => e.actor.draw(ctx, cx, cy) });
        }
        const p = this.player;
        if (!p.hidden) list.push({ y: p.py, draw: () => this.drawPlayer(ctx, cx, cy) });
        if (this.ghost.active) list.push({ y: this.ghost.body.py + 1, draw: () => this.ghost.draw(ctx, cx, cy) });
        list.sort((a, b) => a.y - b.y);
        for (const l of list) l.draw();
    }

    drawPlayer(ctx, cx, cy) {
        const p = this.player;
        if (this.faintFx && this.faintFx.kind === 'dizzy') return; // 暈倒演出自己畫
        p.draw(ctx, cx, cy);
        if (this.hide.active && this.hide.type === 'pose') {
            ctx.fillStyle = 'rgba(255,255,255,0.0)';
        }
    }

    drawDark(ctx) {
        const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 40, VIEW_W / 2, VIEW_H / 2, 210);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(0,0,10,${this.map.dark})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    drawHud(ctx) {
        ctx.save();
        ctx.textBaseline = 'top';
        // 限時倒數
        if (this.timer) {
            const left = Math.max(0, this.timer.left);
            const m = Math.floor(left / 60);
            const s = Math.floor(left % 60);
            const txt = `${m}:${String(s).padStart(2, '0')}`;
            ctx.font = 'bold 18px monospace';
            const w = ctx.measureText(txt).width + 14;
            ctx.fillStyle = left < 20 && Math.floor(this.clock * 4) % 2 ? 'rgba(200,0,0,0.85)' : 'rgba(0,0,0,0.65)';
            ctx.fillRect((VIEW_W - w) / 2, 4, w, 24);
            ctx.fillStyle = '#fff';
            ctx.fillText(txt, (VIEW_W - w) / 2 + 7, 7);
        }
        // 紅疹量表
        if (this.hide.active && this.hide.type === 'futon') {
            const k = this.hide.itch;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(100, 212, 120, 18);
            ctx.fillStyle = k > 0.75 ? '#ff3a3a' : '#ff9a6a';
            ctx.fillRect(104, 216, 112 * k, 10);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(103.5, 215.5, 113, 11);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('紅疹', 70, 215);
            if (k > 0.75) {
                ctx.fillStyle = `rgba(255,0,0,${0.18 + 0.1 * Math.sin(this.clock * 18)})`;
                ctx.fillRect(0, 0, VIEW_W, VIEW_H);
            }
        }
        if (this.hide.active && this.hide.type === 'pose') {
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(90, 6, 140, 18);
            ctx.fillStyle = '#ffe36a';
            ctx.fillText(`假裝公仔：不要動！ 眨眼 ${this.hide.state.blinks}/${this.hide.state.opts.blinkLimit}`, 94, 9);
        }
        // 目標提示 (難度補償)
        if (this.difficulty().hint && this.state.objective && !this.timer) {
            ctx.font = '11px sans-serif';
            const txt = '目標：' + this.state.objective;
            const w = Math.min(VIEW_W - 8, ctx.measureText(txt).width + 12);
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(4, 4, w, 16);
            ctx.fillStyle = '#ffe9a0';
            ctx.fillText(txt, 10, 7);
        }
        // 除錯座標
        if (this.showCoords) {
            ctx.font = '9px monospace';
            const t = `${this.map.id} (${this.player.x},${this.player.y})`;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(4, VIEW_H - 14, ctx.measureText(t).width + 6, 12);
            ctx.fillStyle = '#7f7';
            ctx.fillText(t, 7, VIEW_H - 12);
        }
        // 飄字
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        this.floats.forEach((f, i) => {
            const a = clamp(f.t / 0.4, 0, 1);
            const y = 50 + i * 18 - (1 - f.t / f.total) * 12;
            ctx.globalAlpha = a;
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000';
            ctx.strokeText(f.text, VIEW_W / 2, y);
            ctx.fillStyle = '#fff3b0';
            ctx.fillText(f.text, VIEW_W / 2, y);
        });
        ctx.restore();
    }

    drawFx(ctx) {
        const fx = this.faintFx;
        if (fx) {
            const k = fx.t / fx.dur;
            if (fx.kind === 'jump') {
                // 老鬼的大臉從畫面中央放大衝出來
                const big = ghostSprites(fx.stage).big;
                const s = 0.5 + k * 2.2;
                const w = big.width * s;
                const h = big.height * s;
                ctx.fillStyle = `rgba(0,0,0,${Math.min(0.8, k * 1.5)})`;
                ctx.fillRect(0, 0, VIEW_W, VIEW_H);
                ctx.drawImage(big, (VIEW_W - w) / 2, (VIEW_H - h) / 2 + 20, w, h);
            } else if (fx.kind === 'swell') {
                ctx.fillStyle = `rgba(255,200,80,${k * 0.6})`;
                ctx.fillRect(0, 0, VIEW_W, VIEW_H);
            } else if (fx.kind === 'dizzy') {
                // 主角躺平，頭上轉圈圈的星星
                const p = this.player;
                const sx = Math.round(p.px - this.cam.x) + 8;
                const sy = Math.round(p.py - this.cam.y) + 8;
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(Math.PI / 2);
                drawChar16(ctx, p.sheet, 'down', 0, -8, -8);
                ctx.restore();
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                for (let i = 0; i < 3; i++) {
                    const a = this.clock * 6 + (i * Math.PI * 2) / 3;
                    ctx.fillStyle = '#ffe36a';
                    ctx.fillText('★', sx + Math.cos(a) * 12, sy - 14 + Math.sin(a) * 4);
                }
                ctx.textAlign = 'start';
            }
        }
        if (this.flashT > 0) {
            ctx.fillStyle = `rgba(255,255,255,${clamp(this.flashT / this.flashTotal, 0, 1)})`;
            ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        }
        if (this.fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
            ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        }
    }
}
