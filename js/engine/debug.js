// 除錯模式：只有網址帶 ?debug=1 時才會被載入 (main.js 動態 import)，一般遊玩時完全不存在
import { h } from './util.js';
import { meta } from './save.js';
import { CHAPTERS, CHAPTER_ORDER } from '../content/chapters/index.js';
import { ITEMS } from '../content/items.js';
import { difficultyFor } from './difficulty.js';

export function initDebug(game, ui, { hideTitle }) {
    const panel = h('div', { class: 'debug-panel' });
    panel.hidden = true;
    const toggle = h('button', { class: 'debug-toggle', type: 'button', title: '除錯面板', onclick: () => { panel.hidden = !panel.hidden; render(); } }, '🐞');

    const info = h('div');

    const render = () => {
        const faints = meta.get().faints;
        const d = difficultyFor(faints);
        info.textContent = `嚇暈 ${faints} 次 / 難度等級 ${d.level} (老鬼速度 x${d.speed}${d.hint ? '、顯示提示' : ''})`;
    };

    const jump = async (id) => {
        hideTitle();
        panel.hidden = true;
        await game.startChapter(id, { reset: true, preset: true });
    };

    const chapters = [...CHAPTER_ORDER, 'sandbox'].map((id) => {
        const ch = CHAPTERS[id];
        return h('button', { type: 'button', onclick: () => jump(id) }, ch.title + (ch.stub ? '（尚未實作）' : ''));
    });

    const invincible = h('input', { type: 'checkbox', onchange: (e) => { game.invincible = e.target.checked; } });
    const coords = h('input', { type: 'checkbox', onchange: (e) => { game.showCoords = e.target.checked; } });

    const itemSel = h('select', {}, Object.entries(ITEMS).map(([id, def]) => h('option', { value: id }, def.name)));
    const giveBtn = h('button', { type: 'button', onclick: () => { game.give(itemSel.value); } }, '給道具');

    const faintInput = h('input', { type: 'number', min: 0, max: 99, value: meta.get().faints, style: 'width:4em' });
    const faintBtn = h('button', { type: 'button', onclick: () => { meta.set({ faints: Number(faintInput.value) || 0 }); render(); } }, '設定嚇暈次數');

    const ghostBtn = h('button', {
        type: 'button',
        onclick: () => {
            if (game.mode !== 'play') return;
            const p = game.player;
            for (const [dx, dy] of [[4, 0], [-4, 0], [0, 4], [0, -4], [3, 3], [-3, -3]]) {
                if (game.ghostCanEnter(p.x + dx, p.y + dy)) { game.startChase(p.x + dx, p.y + dy, { stage: 1 }); return; }
            }
        },
    }, '附近叫出老鬼');
    const endBtn = h('button', { type: 'button', onclick: () => game.endChase('script') }, '結束追逐');
    const faintNow = h('button', { type: 'button', onclick: () => game.faint('ghost') }, '立刻嚇暈');

    panel.append(
        h('h3', {}, '跳到章節 (含前置狀態)'), h('div', { class: 'row' }, chapters),
        h('h3', {}, '狀態'), info,
        h('div', { class: 'row' }, h('label', {}, invincible, ' 無敵'), h('label', {}, coords, ' 顯示座標')),
        h('div', { class: 'row' }, itemSel, giveBtn),
        h('div', { class: 'row' }, faintInput, faintBtn),
        h('div', { class: 'row' }, ghostBtn, endBtn, faintNow),
    );
    ui.append(toggle, panel);
    render();
    window.__game = game; // 方便在 Console 檢查
}
