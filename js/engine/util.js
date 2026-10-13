// 共用常數與小工具

export const TILE = 16;
export const VIEW_W = 320;
export const VIEW_H = 240;
export const COLS = VIEW_W / TILE;
export const ROWS = VIEW_H / TILE;

export const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};

export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);

/** 建立 DOM 元素：h('div', { class: 'x', onclick }, child...) */
export function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
        if (v === false || v == null) continue;
        if (k === 'class') el.className = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'text') el.textContent = v;
        else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
        if (c == null || c === false) continue;
        el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
}

/** 方向字串 (從 a 看向 b 的主要方向) */
export function facingTo(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
}

/** 可重複使用的小型事件匯流排 */
export class Emitter {
    constructor() { this.map = new Map(); }
    on(name, fn) {
        if (!this.map.has(name)) this.map.set(name, new Set());
        this.map.get(name).add(fn);
        return () => this.map.get(name).delete(fn);
    }
    emit(name, ...args) {
        for (const fn of [...(this.map.get(name) || [])]) fn(...args);
    }
}
