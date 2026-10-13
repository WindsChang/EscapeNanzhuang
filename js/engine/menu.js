// 遊戲中選單 (DOM)：道具、存檔、讀檔、設定、回到標題
import { h } from './util.js';
import { Input } from './input.js';
import { audio } from './audio.js';
import { itemDef } from '../content/items.js';
import { iconCanvas } from './sprites.js';
import { listSlots, AUTO, writeSlot, isPersistent } from './save.js';

const TEXT_SPEEDS = [{ label: '慢', v: 0.6 }, { label: '普通', v: 1 }, { label: '快', v: 1.8 }];

function fmtTime(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export class Menu {
    /**
     * hooks = {
     *   status(): string, items(): string[], objective(): string,
     *   canSave(): { ok, reason }, snapshot(): object,
     *   load(data): void, toTitle(): void, settings: { get(), set(patch) }
     * }
     */
    constructor(ui, hooks) {
        this.ui = ui;
        this.hooks = hooks;
        this.isOpen = false;
        this.screen = null;
        this.notice = '';
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.overlay = h('div', { class: 'overlay' });
        this.ui.append(this.overlay);
        this.unhook = Input.push((name) => { this.onInput(name); return true; });
        audio.playSE('select', { vol: 0.6 });
        this.main();
    }

    close() {
        if (!this.isOpen) return;
        this.unhook();
        this.overlay.remove();
        this.isOpen = false;
        this.screen = null;
        audio.playSE('back', { vol: 0.6 });
    }

    // ---------- 通用清單畫面 ----------

    show(screen) {
        this.screen = { focus: 0, ...screen };
        const rows = this.screen.rows || [];
        const firstEnabled = rows.findIndex((r) => !r.disabled && r.focusable !== false);
        this.screen.focus = Math.max(0, firstEnabled);
        this.render();
    }

    render() {
        const s = this.screen;
        const list = h('div', { class: 'list' });
        s.rows.forEach((row, i) => {
            const cls = (row.cls || 'menu-item') + (i === s.focus ? ' focus' : '') + (row.disabled ? ' disabled' : '');
            if (row.custom) {
                const el = row.custom(i === s.focus);
                el.addEventListener('click', () => { s.focus = i; this.activate(); });
                list.append(el);
            } else {
                list.append(h('button', {
                    type: 'button', class: cls,
                    onclick: () => { if (!row.disabled) { s.focus = i; this.activate(); } },
                }, row.label, row.sub ? h('small', {}, row.sub) : null));
            }
        });
        const panel = h('div', { class: 'panel' },
            h('h2', {}, s.title),
            s.intro ? h('div', { class: 'hint' }, s.intro) : null,
            list,
            this.notice ? h('div', { class: 'notice' }, this.notice) : null,
            s.status ? h('div', { class: 'status' }, s.status) : null);
        this.overlay.replaceChildren(panel);
    }

    move(delta) {
        const s = this.screen;
        const n = s.rows.length;
        if (!n) return;
        for (let k = 1; k <= n; k++) {
            const i = (s.focus + delta * k + n * 4) % n;
            if (!s.rows[i].disabled && s.rows[i].focusable !== false) { s.focus = i; break; }
        }
        audio.playSE('select', { vol: 0.5 });
        this.render();
    }

    activate() {
        const row = this.screen.rows[this.screen.focus];
        if (!row || row.disabled || !row.onSelect) return;
        audio.playSE('ok', { vol: 0.6 });
        this.notice = '';
        row.onSelect();
    }

    onInput(name) {
        const s = this.screen;
        if (!s) return;
        if (name === 'up') this.move(-1);
        else if (name === 'down') this.move(1);
        else if (name === 'ok') this.activate();
        else if (name === 'cancel') { this.notice = ''; (s.onCancel || (() => this.close()))(); }
        else if (name === 'left' || name === 'right') {
            const row = s.rows[s.focus];
            if (row && row.adjust) { row.adjust(name === 'left' ? -1 : 1); this.render(); }
        }
    }

    // ---------- 各畫面 ----------

    main() {
        this.show({
            title: '選單',
            status: this.hooks.status(),
            onCancel: () => this.close(),
            rows: [
                { label: '道具', onSelect: () => this.items() },
                { label: '存檔', onSelect: () => this.saveScreen() },
                { label: '讀檔', onSelect: () => this.loadScreen() },
                { label: '設定', onSelect: () => this.settingsScreen() },
                { label: '回到標題', onSelect: () => this.confirm('回到標題畫面？未存檔的進度會遺失。', () => { this.close(); this.hooks.toTitle(); }, () => this.main()) },
                { label: '關閉', onSelect: () => this.close() },
            ],
        });
    }

    items() {
        const ids = this.hooks.items();
        const rows = ids.length
            ? ids.map((id) => {
                const def = itemDef(id);
                return {
                    focusable: true,
                    custom: (focus) => h('div', { class: 'menu-item item-row' + (focus ? ' focus' : '') },
                        iconCanvas(def.icon || { emoji: '❓' }, 32),
                        h('div', {}, h('div', {}, def.name), h('div', { class: 'desc' }, def.desc))),
                };
            })
            : [{ label: '什麼都沒有', disabled: true, focusable: false }];
        const objective = this.hooks.objective();
        this.show({
            title: '道具',
            rows,
            intro: objective ? '目前目標：' + objective : '',
            onCancel: () => this.main(),
        });
    }

    slotRows(mode) {
        return listSlots().filter((s) => mode === 'load' || s.slot !== AUTO).map((s) => {
            const name = s.slot === AUTO ? '自動存檔' : `欄位 ${s.slot}`;
            let sub = '（空）';
            if (s.status === 'ok') sub = `${s.data.label || s.data.mapId}　${fmtTime(s.data.savedAt)}`;
            else if (s.status === 'broken') sub = '（無法讀取）';
            return {
                cls: 'slot',
                label: name,
                sub,
                disabled: mode === 'load' && s.status !== 'ok',
                slot: s,
                onSelect: () => (mode === 'save' ? this.doSave(s) : this.confirm(`讀取「${name}」？未存檔的進度會遺失。`, () => { this.close(); this.hooks.load(s.data); }, () => this.loadScreen())),
            };
        });
    }

    saveScreen() {
        const can = this.hooks.canSave();
        if (!can.ok) {
            this.notice = can.reason;
            audio.playSE('ng');
            this.main();
            return;
        }
        this.show({ title: '存檔', rows: this.slotRows('save'), onCancel: () => this.main() });
    }

    doSave(s) {
        const name = `欄位 ${s.slot}`;
        const write = () => {
            const persisted = writeSlot(s.slot, this.hooks.snapshot());
            this.notice = persisted || isPersistent() ? '已存檔。' : '已存檔，但這個瀏覽器無法永久保存，關閉頁面後會消失。';
            this.saveScreen();
        };
        if (s.status === 'empty') write();
        else this.confirm(`覆蓋「${name}」的存檔？`, write, () => this.saveScreen());
    }

    loadScreen() {
        this.show({ title: '讀檔', rows: this.slotRows('load'), onCancel: () => this.main() });
    }

    confirm(text, onYes, onNo) {
        this.show({
            title: '確認',
            intro: text,
            rows: [
                { label: '是', onSelect: onYes },
                { label: '否', onSelect: onNo },
            ],
            onCancel: onNo,
        });
        this.screen.focus = 1; // 預設停在「否」
        this.render();
    }

    settingsScreen() {
        const cfg = this.hooks.settings;
        const slider = (label, key) => ({
            custom: (focus) => {
                const v = Math.round(cfg.get()[key] * 100);
                const input = h('input', { type: 'range', min: 0, max: 100, step: 10, value: v });
                input.addEventListener('input', () => { cfg.set({ [key]: Number(input.value) / 100 }); this.syncAudio(); val.textContent = input.value; });
                const val = h('span', { class: 'val' }, String(v));
                return h('div', { class: 'setting' + (focus ? ' focus' : '') }, h('label', {}, label), input, val);
            },
            adjust: (d) => { cfg.set({ [key]: Math.min(1, Math.max(0, Math.round((cfg.get()[key] + d * 0.1) * 10) / 10)) }); this.syncAudio(); },
            onSelect: () => {},
        });
        const textSpeed = {
            custom: (focus) => {
                const cur = cfg.get().textSpeed;
                const idx = TEXT_SPEEDS.reduce((best, t, i) => (Math.abs(t.v - cur) < Math.abs(TEXT_SPEEDS[best].v - cur) ? i : best), 1);
                return h('div', { class: 'setting' + (focus ? ' focus' : '') },
                    h('label', {}, '文字速度'),
                    ...TEXT_SPEEDS.map((t, i) => h('button', {
                        type: 'button', class: 'btn' + (i === idx ? ' focus' : ''),
                        onclick: () => { cfg.set({ textSpeed: t.v }); this.render(); },
                    }, t.label)));
            },
            adjust: (d) => {
                const cur = cfg.get().textSpeed;
                const idx = TEXT_SPEEDS.reduce((best, t, i) => (Math.abs(t.v - cur) < Math.abs(TEXT_SPEEDS[best].v - cur) ? i : best), 1);
                cfg.set({ textSpeed: TEXT_SPEEDS[Math.min(2, Math.max(0, idx + d))].v });
            },
            onSelect: () => {},
        };
        this.show({
            title: '設定',
            intro: '左右鍵調整數值',
            rows: [slider('音樂音量', 'bgm'), slider('音效音量', 'se'), textSpeed, { label: '返回', onSelect: () => this.main() }],
            onCancel: () => this.main(),
        });
    }

    syncAudio() {
        const s = this.hooks.settings.get();
        audio.setSettings({ bgm: s.bgm, se: s.se });
    }
}
