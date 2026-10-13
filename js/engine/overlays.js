// 全畫面的演出：標題卡、蛋糕吹蠟燭、慶生照片輪播、片尾祝福名單
import { h } from './util.js';
import { Input } from './input.js';
import { audio } from './audio.js';
import userConfig from '../../assets/user/config.js';
import { CHARACTERS } from '../content/characters.js';
import { getImage } from './assets.js';
import { placeholderPortrait } from './sprites.js';

/** 等待 sec 秒或玩家按確認 / 點擊 (minSec 內不接受跳過，避免誤觸) */
function waitAdvance(el, sec, minSec = 0.5) {
    return new Promise((resolve) => {
        let done = false;
        const t0 = performance.now();
        const finish = () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            unhook();
            resolve();
        };
        const tryAdvance = () => { if ((performance.now() - t0) / 1000 >= minSec) finish(); };
        const timer = sec > 0 ? setTimeout(finish, sec * 1000) : null;
        const unhook = Input.push((name) => { if (name === 'ok') tryAdvance(); return true; });
        el.addEventListener('pointerdown', tryAdvance);
    });
}

/** 黑底白字的標題卡，例如「Day 1　抵達旅館」 */
export async function card(ui, text, sub = '', { sec = 2.6 } = {}) {
    const el = h('div', { class: 'overlay scene card' }, h('div', { class: 'card-main' }, text), sub ? h('div', { class: 'card-sub' }, sub) : null);
    ui.append(el);
    await waitAdvance(el, sec);
    el.remove();
}

/** 蛋糕與蠟燭：點擊或按確認吹熄 */
export async function cake(ui) {
    const flames = h('div', { class: 'cake-flames' }, '🔥 🔥 🔥');
    const hint = h('div', { class: 'cake-hint' }, '點擊畫面或按空白鍵，吹熄蠟燭！');
    const el = h('div', { class: 'overlay scene cake-scene' }, flames, h('div', { class: 'cake-body' }, '🎂'), hint);
    ui.append(el);
    await waitAdvance(el, 0, 0.4);
    audio.playSE('pop');
    flames.textContent = '💨';
    hint.textContent = '呼～～～';
    await new Promise((r) => setTimeout(r, 1300));
    el.remove();
}

/** 慶生照片輪播；沒有任何照片時顯示「生日快樂」文字畫面 */
export async function photos(ui) {
    const list = userConfig.photos.map((_, i) => getImage('photo:' + i)).filter(Boolean);
    if (!list.length) {
        const el = h('div', { class: 'overlay scene card' },
            h('div', { class: 'card-main' }, '生日快樂！'), h('div', { class: 'card-sub' }, '🎂 🎉 🎈'));
        ui.append(el);
        await waitAdvance(el, 5, 1);
        el.remove();
        return;
    }
    const el = h('div', { class: 'overlay scene photo-scene' });
    ui.append(el);
    for (let i = 0; i < list.length; i++) {
        const img = h('img', { class: 'photo', src: list[i].src, alt: '' });
        el.replaceChildren(img, h('div', { class: 'photo-count' }, `${i + 1} / ${list.length}`));
        await waitAdvance(el, 5, 0.8);
    }
    el.remove();
}

function portraitFor(id) {
    const c = CHARACTERS[id];
    const wrap = document.createElement('canvas');
    wrap.width = 64;
    wrap.height = 64;
    wrap.className = 'credit-portrait';
    const g = wrap.getContext('2d');
    g.imageSmoothingEnabled = false;
    const img = c && c.portrait ? getImage('portrait:' + id) : null;
    if (img) {
        const s = Math.min(64 / img.width, 64 / img.height);
        g.fillStyle = '#3b3560';
        g.fillRect(0, 0, 64, 64);
        g.drawImage(img, (64 - img.width * s) / 2, (64 - img.height * s) / 2, img.width * s, img.height * s);
    } else if (c && c.look) {
        g.drawImage(placeholderPortrait(c.look, 64), 0, 0);
    }
    return wrap;
}

/** 片尾：每位同行者的名字與一句祝福，接著是素材致謝與結語 */
export async function credits(ui) {
    const el = h('div', { class: 'overlay scene credits-scene' });
    ui.append(el);
    const pages = [];
    pages.push(h('div', { class: 'credit-page' }, h('div', { class: 'card-main' }, '給壽星的祝福'), h('div', { class: 'card-sub' }, '一起旅行的大家')));
    for (const b of userConfig.blessings) {
        const c = CHARACTERS[b.who];
        pages.push(h('div', { class: 'credit-page' },
            portraitFor(b.who),
            h('div', { class: 'credit-name' }, c ? c.name : b.who),
            h('div', { class: 'credit-text' }, b.text)));
    }
    pages.push(h('div', { class: 'credit-page small' },
        h('div', { class: 'credit-name' }, '素材致謝'),
        h('div', { class: 'credit-text' }, 'Kenney (kenney.nl)：Tiny Town、Tiny Dungeon、RPG Audio、Interface Sounds (CC0)')));
    pages.push(h('div', { class: 'credit-page' },
        h('div', { class: 'card-main' }, '生日快樂！'),
        h('div', { class: 'card-sub' }, '謝謝你玩到最後 🎂')));
    for (const p of pages) {
        el.replaceChildren(p);
        await waitAdvance(el, 5.5, 0.8);
    }
    el.remove();
}
