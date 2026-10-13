// 標題畫面 (DOM)：第一次點擊同時作為音訊解鎖手勢；之後顯示 開始遊戲 / 讀取存檔 / (通關後) 重看結局
import { h } from './util.js';
import { Input } from './input.js';
import { audio } from './audio.js';
import { listSlots, AUTO, hasAnySave, meta } from './save.js';

function fmtTime(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export class Title {
    /** hooks = { onNew(), onLoad(data), onEnding?() } */
    constructor(ui, hooks) {
        this.ui = ui;
        this.hooks = hooks;
        this.el = null;
        this.unhook = null;
        this.rows = [];
        this.focus = 0;
    }

    show({ skipTap = false } = {}) {
        this.hide();
        this.el = h('div', { class: 'title' });
        this.ui.append(this.el);
        audio.playBGM('title');
        this.unhook = Input.push((name) => { this.onInput(name); return true; });
        this.el.addEventListener('pointerdown', () => { if (this.stage === 'tap') this.menu(); });
        if (skipTap) this.menu();
        else this.tap();
    }

    hide() {
        if (this.unhook) this.unhook();
        this.unhook = null;
        if (this.el) this.el.remove();
        this.el = null;
    }

    header() {
        return [
            h('h1', {}, '逃出南庄'),
            h('div', { class: 'sub' }, '—— 老一歲的自己 ——'),
        ];
    }

    tap() {
        this.stage = 'tap';
        this.el.replaceChildren(...this.header(), h('div', { class: 'tap' }, '點擊畫面或按任意鍵開始'));
    }

    menu() {
        this.stage = 'menu';
        const rows = [{ label: '開始遊戲', onSelect: () => this.hooks.onNew() }];
        rows.push({ label: '讀取存檔', disabled: !hasAnySave(), onSelect: () => this.loadList() });
        if (meta.get().cleared && this.hooks.onEnding) rows.push({ label: '重看結局', onSelect: () => this.hooks.onEnding() });
        this.setRows(rows, '點選或用方向鍵與確認鍵操作');
    }

    loadList() {
        this.stage = 'load';
        const rows = listSlots().map((s) => {
            const name = s.slot === AUTO ? '自動存檔' : `欄位 ${s.slot}`;
            let sub = '（空）';
            if (s.status === 'ok') sub = `${s.data.label || s.data.mapId}　${fmtTime(s.data.savedAt)}`;
            else if (s.status === 'broken') sub = '（無法讀取）';
            return { label: name, sub, cls: 'slot', disabled: s.status !== 'ok', onSelect: () => this.hooks.onLoad(s.data) };
        });
        rows.push({ label: '返回', onSelect: () => this.menu() });
        this.setRows(rows, '');
    }

    setRows(rows, note) {
        this.rows = rows;
        const first = rows.findIndex((r) => !r.disabled);
        this.focus = Math.max(0, first);
        this.renderRows(note);
    }

    renderRows(note) {
        this.note = note !== undefined ? note : this.note;
        const list = h('div', { class: 'list' }, this.rows.map((r, i) => h('button', {
            type: 'button',
            class: (r.cls || 'menu-item') + (i === this.focus ? ' focus' : '') + (r.disabled ? ' disabled' : ''),
            onclick: () => { if (!r.disabled) { this.focus = i; this.activate(); } },
        }, r.label, r.sub ? h('small', {}, r.sub) : null)));
        this.el.replaceChildren(...this.header(), list, this.note ? h('div', { class: 'note' }, this.note) : null);
    }

    activate() {
        const r = this.rows[this.focus];
        if (!r || r.disabled) return;
        audio.playSE('ok', { vol: 0.6 });
        r.onSelect();
    }

    onInput(name) {
        if (this.stage === 'tap') {
            if (name === 'ok' || name === 'cancel' || name.startsWith('digit') || ['up', 'down', 'left', 'right'].includes(name)) this.menu();
            return;
        }
        const n = this.rows.length;
        if (name === 'up' || name === 'down') {
            const d = name === 'up' ? -1 : 1;
            for (let k = 1; k <= n; k++) {
                const i = (this.focus + d * k + n * 4) % n;
                if (!this.rows[i].disabled) { this.focus = i; break; }
            }
            audio.playSE('select', { vol: 0.5 });
            this.renderRows();
        } else if (name === 'ok') this.activate();
        else if (name === 'cancel' && this.stage === 'load') this.menu();
    }
}
