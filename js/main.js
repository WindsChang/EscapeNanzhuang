// 進入點：載入素材 -> 標題畫面 -> 遊戲主迴圈
import { initInput, onFirstGesture } from './engine/input.js';
import { loadAll } from './engine/assets.js';
import { buildAtlas } from './engine/sprites.js';
import { audio } from './engine/audio.js';
import { settings } from './engine/save.js';
import { Game } from './engine/game.js';
import { Title } from './engine/title.js';
import { NEW_GAME_CHAPTER } from './content/chapters/index.js';
import { h } from './engine/util.js';

const canvas = document.getElementById('screen');
const ui = document.getElementById('ui');
const root = document.documentElement;

// ---------- 版面：依視窗大小決定每個遊戲像素的螢幕大小 ----------
function layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const portrait = vh > vw;
    document.body.classList.toggle('portrait', portrait);
    document.body.classList.toggle('landscape', !portrait);
    const touch = document.body.classList.contains('is-touch');
    const availH = touch && portrait ? Math.max(240, vh - 230) : vh;
    let u = Math.min(vw / 320, availH / 240);
    u = u >= 2 ? Math.floor(u) : Math.max(0.5, Math.floor(u * 8) / 8);
    root.style.setProperty('--u', u + 'px');
}

async function boot() {
    initInput();
    layout();
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', () => setTimeout(layout, 200));

    // 第一次使用者手勢：解鎖音訊
    onFirstGesture(() => {
        audio.unlock();
        const s = settings.get();
        audio.setSettings({ bgm: s.bgm, se: s.se });
    });
    const s0 = settings.get();
    audio.setSettings({ bgm: s0.bgm, se: s0.se });

    // 載入畫面
    const bar = h('i');
    const loading = h('div', { class: 'loading' }, h('div', {}, '載入中…'), h('div', { class: 'bar' }, bar));
    ui.append(loading);
    await loadAll((p) => { bar.style.width = Math.round(p * 100) + '%'; });
    buildAtlas();
    loading.remove();

    const game = new Game({ canvas, ui });
    const title = new Title(ui, {
        onNew: async () => {
            title.hide();
            audio.stopBGM(0.4);
            await game.startChapter(NEW_GAME_CHAPTER, { reset: true });
        },
        onLoad: (data) => {
            title.hide();
            audio.stopBGM(0.4);
            game.loadSnapshot(data);
        },
    });
    game.onTitle = () => title.show({ skipTap: true });
    title.show();

    if (new URLSearchParams(location.search).has('debug')) {
        const { initDebug } = await import('./engine/debug.js');
        initDebug(game, ui, { hideTitle: () => title.hide() });
    }

    let last = performance.now();
    const frame = (now) => {
        const dt = (now - last) / 1000;
        last = now;
        game.update(dt);
        game.draw();
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}

boot().catch((err) => {
    console.error(err);
    ui.append(h('div', { class: 'loading' }, '載入失敗，請重新整理頁面。'));
});
