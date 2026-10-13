// 謎題介面 (DOM)：數字密碼鎖與物件排列，鍵盤與觸控皆可操作
import { h } from './util.js';
import { Input } from './input.js';
import { audio } from './audio.js';

export class Puzzle {
    constructor(ui) {
        this.ui = ui;
        this.isOpen = false;
    }

    /**
     * 數字密碼鎖。答對 resolve(true)，離開 resolve(false)；答錯會提示並讓玩家重試。
     */
    code({ answer, title = '密碼鎖', hint = '' }) {
        return new Promise((resolve) => {
            const length = answer.length;
            let value = '';
            const display = h('div', { class: 'code-display' });
            const msg = h('div', { class: 'puzzle-msg' });
            const render = () => {
                display.replaceChildren(...Array.from({ length }, (_, i) => h('span', {}, value[i] || '')));
            };
            const press = (d) => {
                if (value.length >= length) return;
                value += d;
                audio.playSE('select', { vol: 0.5 });
                msg.textContent = '';
                render();
            };
            const clear = () => { value = value.slice(0, -1); msg.textContent = ''; render(); };
            const submit = () => {
                if (value.length < length) return;
                if (value === answer) {
                    audio.playSE('ok');
                    finish(true);
                } else {
                    audio.playSE('ng');
                    msg.textContent = '密碼錯誤';
                    msg.classList.add('bad');
                    value = '';
                    render();
                }
            };

            const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => h('button', { type: 'button', onclick: () => press(String(d)) }, d));
            keys.push(
                h('button', { type: 'button', onclick: clear }, '⌫'),
                h('button', { type: 'button', onclick: () => press('0') }, '0'),
                h('button', { type: 'button', onclick: submit }, '確認'),
            );
            const leave = h('button', { class: 'btn', type: 'button', onclick: () => finish(false) }, '離開');

            const panel = h('div', { class: 'panel' },
                h('h2', {}, title),
                hint ? h('div', { class: 'hint' }, hint) : null,
                display, h('div', { class: 'keypad' }, keys), msg,
                h('div', { class: 'row-btns' }, leave));
            const overlay = h('div', { class: 'overlay' }, panel);
            this.ui.append(overlay);
            this.isOpen = true;
            render();

            const unhook = Input.push((name) => {
                if (name.startsWith('digit:')) press(name.slice(6));
                else if (name === 'backspace') clear();
                else if (name === 'ok') submit();
                else if (name === 'cancel') finish(false);
                return true;
            });

            const self = this;
            function finish(result) {
                unhook();
                overlay.remove();
                self.isOpen = false;
                resolve(result);
            }
        });
    }

    /**
     * 物件排列：每個格子可循環切換物件，排成 answer 的順序後按確認。
     * items = [{ id, label }]；label 可為 emoji 或短文字。
     */
    arrange({ items, slots, answer, title = '排列', hint = '', start = [] }) {
        return new Promise((resolve) => {
            const state = Array.from({ length: slots }, (_, i) => (start[i] != null ? start[i] : 0));
            let focus = 0;
            const msg = h('div', { class: 'puzzle-msg' });
            const row = h('div', { class: 'slots' });
            const render = () => {
                row.replaceChildren(...state.map((idx, i) => h('button', {
                    type: 'button',
                    class: i === focus ? 'focus' : '',
                    onclick: () => { focus = i; cycle(1); },
                }, items[idx].label)));
            };
            const cycle = (d) => {
                state[focus] = (state[focus] + d + items.length) % items.length;
                audio.playSE('select', { vol: 0.5 });
                msg.textContent = '';
                render();
            };
            const submit = () => {
                if (state.every((idx, i) => items[idx].id === answer[i])) {
                    audio.playSE('ok');
                    finish(true);
                } else {
                    audio.playSE('ng');
                    msg.textContent = '好像不對…';
                    msg.classList.add('bad');
                }
            };
            const ok = h('button', { class: 'btn', type: 'button', onclick: submit }, '確定');
            const leave = h('button', { class: 'btn', type: 'button', onclick: () => finish(false) }, '離開');
            const panel = h('div', { class: 'panel' },
                h('h2', {}, title),
                hint ? h('div', { class: 'hint' }, hint) : null,
                row, msg, h('div', { class: 'row-btns' }, ok, leave),
                h('div', { class: 'hint' }, '點格子切換，左右選格子，上下切換物件'));
            const overlay = h('div', { class: 'overlay' }, panel);
            this.ui.append(overlay);
            this.isOpen = true;
            render();

            const unhook = Input.push((name) => {
                if (name === 'left') { focus = (focus - 1 + slots) % slots; render(); }
                else if (name === 'right') { focus = (focus + 1) % slots; render(); }
                else if (name === 'up') cycle(-1);
                else if (name === 'down') cycle(1);
                else if (name === 'ok') submit();
                else if (name === 'cancel') finish(false);
                return true;
            });

            const self = this;
            function finish(result) {
                unhook();
                overlay.remove();
                self.isOpen = false;
                resolve(result);
            }
        });
    }
}
