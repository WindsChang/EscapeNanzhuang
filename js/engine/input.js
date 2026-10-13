// 鍵盤 + 觸控統一成抽象指令：
//   持續狀態 held：up / down / left / right (給移動輪詢)
//   單次事件：up / down / left / right / ok / cancel / blink / digit:N (給 UI 使用，由最上層 handler 處理)

const KEY_MAP = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
    Enter: 'ok', ' ': 'ok', z: 'ok', Z: 'ok',
    Escape: 'cancel', x: 'cancel', X: 'cancel',
    b: 'blink', B: 'blink',
};

const DIR_NAMES = ['up', 'down', 'left', 'right'];

export const Input = {
    held: new Set(),
    handlers: [], // 最後一個 = 最上層
    enabled: true,
    lastDevice: 'keyboard',

    /** 推入一個事件處理者，回傳移除函式。處理者回傳 true 代表已處理。 */
    push(fn) {
        this.handlers.push(fn);
        return () => {
            const i = this.handlers.lastIndexOf(fn);
            if (i >= 0) this.handlers.splice(i, 1);
        };
    },

    dispatch(name) {
        if (!this.enabled) return;
        const top = this.handlers[this.handlers.length - 1];
        if (top) top(name);
    },

    /** 目前按住的方向 (多鍵時以最後按下的為準) */
    get dir() {
        let d = null;
        for (const k of this.held) d = k;
        return d;
    },

    press(name) {
        if (DIR_NAMES.includes(name)) {
            if (this.held.has(name)) this.held.delete(name);
            this.held.add(name); // 重新加入讓它成為「最後按下」
        }
        this.dispatch(name);
    },

    release(name) {
        this.held.delete(name);
    },

    clear() {
        this.held.clear();
    },
};

let firstGestureCb = null;
/** 註冊第一次使用者操作 (點擊/按鍵/觸控) 的回呼，用來解鎖音訊 */
export function onFirstGesture(cb) {
    firstGestureCb = cb;
}

function gesture() {
    if (firstGestureCb) {
        const cb = firstGestureCb;
        firstGestureCb = null;
        try { cb(); } catch (e) { console.warn('first gesture handler failed', e); }
    }
}

export function initInput() {
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const name = KEY_MAP[e.key];
        if (/^[0-9]$/.test(e.key)) {
            Input.lastDevice = 'keyboard';
            gesture();
            Input.dispatch('digit:' + e.key);
            return;
        }
        if (e.key === 'Backspace') { Input.dispatch('backspace'); e.preventDefault(); return; }
        if (!name) return;
        e.preventDefault();
        Input.lastDevice = 'keyboard';
        gesture();
        if (DIR_NAMES.includes(name)) {
            if (!e.repeat) Input.press(name);
            else {
                // 長按時：UI 仍可連續移動游標；若劇情腳本清掉了按鍵狀態，按住的方向在此補回
                if (!Input.held.has(name)) Input.held.add(name);
                Input.dispatch(name);
            }
        } else if (!e.repeat) {
            Input.press(name);
        }
    });

    window.addEventListener('keyup', (e) => {
        const name = KEY_MAP[e.key];
        if (name) Input.release(name);
    });

    window.addEventListener('blur', () => Input.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) Input.clear(); });

    // 第一次點擊 / 觸控也算解鎖手勢
    window.addEventListener('pointerdown', gesture, { capture: true });

    initTouchControls();
}

function initTouchControls() {
    const touch = document.getElementById('touch');
    const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || new URLSearchParams(location.search).has('touch');
    document.body.classList.toggle('is-touch', isTouch);
    touch.hidden = !isTouch;
    if (!isTouch) return;

    const repeatTimers = new Map();

    const down = (btn, name) => (e) => {
        e.preventDefault();
        Input.lastDevice = 'touch';
        btn.classList.add('pressed');
        btn.setPointerCapture?.(e.pointerId);
        Input.press(name);
        if (DIR_NAMES.includes(name)) {
            // UI 游標連續移動
            const t = setInterval(() => {
                if (!Input.held.has(name)) Input.held.add(name); // 腳本清掉按鍵後，手指還按著就補回
                Input.dispatch(name);
            }, 160);
            repeatTimers.set(btn, t);
        }
        gesture();
    };
    const up = (btn, name) => (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        Input.release(name);
        clearInterval(repeatTimers.get(btn));
        repeatTimers.delete(btn);
    };

    for (const btn of touch.querySelectorAll('[data-key]')) {
        const name = btn.dataset.key;
        btn.addEventListener('pointerdown', down(btn, name));
        btn.addEventListener('pointerup', up(btn, name));
        btn.addEventListener('pointercancel', up(btn, name));
        btn.addEventListener('lostpointercapture', up(btn, name));
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    for (const btn of touch.querySelectorAll('[data-act]')) {
        const name = btn.dataset.act;
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            Input.lastDevice = 'touch';
            btn.classList.add('pressed');
            Input.press(name);
            gesture();
        });
        const release = (e) => { e.preventDefault(); btn.classList.remove('pressed'); };
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // 防止雙擊縮放與手勢縮放
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd < 350) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });
    document.addEventListener('touchmove', (e) => { if (e.target.closest('#stage, #touch')) e.preventDefault(); }, { passive: false });
}

/** 顯示或隱藏觸控的「眨眼」按鈕 */
export function showBlinkButton(show) {
    const b = document.querySelector('#touch [data-act="blink"]');
    if (b) b.hidden = !show;
}
