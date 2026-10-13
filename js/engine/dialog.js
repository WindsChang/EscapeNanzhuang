// DOM 對話框：說話者名稱 + 頭像、逐字顯示、快轉、前進、選項
import { h } from './util.js';
import { Input } from './input.js';
import { speaker } from '../content/characters.js';
import { getImage } from './assets.js';
import { placeholderPortrait } from './sprites.js';
import { audio } from './audio.js';

const BASE_CPS = 32; // 每秒顯示字數 (文字速度倍率 = 1)

function portraitCanvas(sp) {
    const c = document.createElement('canvas');
    c.className = 'portrait';
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const img = sp.portrait ? getImage('portrait:' + sp.id) : null;
    if (img) {
        // 等比例縮放置中，不變形
        const s = Math.min(64 / img.width, 64 / img.height);
        g.fillStyle = '#3b3560';
        g.fillRect(0, 0, 64, 64);
        g.drawImage(img, (64 - img.width * s) / 2, (64 - img.height * s) / 2, img.width * s, img.height * s);
    } else if (sp.look) {
        g.drawImage(placeholderPortrait(sp.look, 64), 0, 0);
    } else {
        return null;
    }
    return c;
}

export class Dialog {
    constructor(ui, getTextSpeed) {
        this.ui = ui;
        this.getTextSpeed = getTextSpeed;
        this.el = null;
        this.isOpen = false;
    }

    /** 顯示一段 (或多段) 文字，玩家按確認後 resolve */
    async say(who, text, { narration = false } = {}) {
        const pages = Array.isArray(text) ? text : [text];
        for (const page of pages) await this.page(who, page, { narration });
    }

    page(who, text, { narration = false, choices = null } = {}) {
        return new Promise((resolve) => {
            const sp = narration ? speaker('narrator') : speaker(who);
            const portrait = narration ? null : portraitCanvas(sp);
            const body = h('div', { class: 'body' },
                h('div', { class: 'name' }, sp.name || ''),
                h('div', { class: 'text' }));
            const textEl = body.querySelector('.text');
            const more = h('div', { class: 'more' }, '▼');
            more.hidden = true;
            const el = h('div', { class: 'dialog' + (narration || !sp.name ? ' narration' : '') }, portrait, body, more);
            this.close();
            this.ui.append(el);
            this.el = el;
            this.isOpen = true;

            let shown = 0;
            let done = false;
            let timer = null;
            let choiceIndex = 0;
            let choiceEls = [];
            const chars = [...text];
            const cps = BASE_CPS * (this.getTextSpeed ? this.getTextSpeed() : 1);

            const finishTyping = () => {
                clearInterval(timer);
                shown = chars.length;
                textEl.textContent = text;
                done = true;
                if (choices) renderChoices();
                else more.hidden = false;
            };

            const renderChoices = () => {
                const box = h('div', { class: 'choices' });
                choiceEls = choices.map((label, i) => h('button', {
                    class: 'choice',
                    type: 'button',
                    onclick: (e) => { e.stopPropagation(); pick(i); },
                }, label));
                choiceEls.forEach((b) => box.append(b));
                body.append(box);
                focus(0);
            };

            const focus = (i) => {
                choiceIndex = (i + choices.length) % choices.length;
                choiceEls.forEach((b, k) => b.classList.toggle('focus', k === choiceIndex));
                audio.playSE('select', { vol: 0.5 });
            };

            const end = (value) => {
                clearInterval(timer);
                unhook();
                el.remove();
                if (this.el === el) { this.el = null; this.isOpen = false; }
                resolve(value);
            };

            const pick = (i) => { audio.playSE('ok', { vol: 0.6 }); end(i); };

            const unhook = Input.push((name) => {
                if (name === 'ok') {
                    if (!done) finishTyping();
                    else if (choices) pick(choiceIndex);
                    else end(undefined);
                } else if (choices && done) {
                    if (name === 'up') focus(choiceIndex - 1);
                    else if (name === 'down') focus(choiceIndex + 1);
                }
                return true;
            });

            el.addEventListener('pointerdown', (e) => {
                if (e.target.closest('.choice')) return;
                if (!done) finishTyping();
                else if (!choices) end(undefined);
            });

            if (!text) { finishTyping(); return; }
            timer = setInterval(() => {
                shown = Math.min(chars.length, shown + Math.max(1, Math.round(cps / 60 * 3)));
                textEl.textContent = chars.slice(0, shown).join('');
                if (shown % 2 === 0) audio.playSE('blip');
                if (shown >= chars.length) finishTyping();
            }, 50);
        });
    }

    /** 顯示選項，回傳被選的索引。text 為選項上方的提示文字 */
    choice(options, { who = 'narrator', text = '' } = {}) {
        return this.page(who, text, { narration: who === 'narrator', choices: options });
    }

    close() {
        if (this.el) { this.el.remove(); this.el = null; }
        this.isOpen = false;
    }
}
