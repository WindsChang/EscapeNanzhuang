// 存檔：localStorage，失敗時退回記憶體 (遊戲仍可玩，但提示無法永久保存)

export const SAVE_VERSION = 1;
const PREFIX = 'escape-nanzhuang:';
export const SLOTS = [1, 2, 3];
export const AUTO = 'auto';

const memory = new Map();
let storageChecked = false;
let storage = null;

function getStorage() {
    if (storageChecked) return storage;
    storageChecked = true;
    try {
        const s = globalThis.localStorage;
        const probe = PREFIX + 'probe';
        s.setItem(probe, '1');
        s.removeItem(probe);
        storage = s;
    } catch {
        storage = null;
    }
    return storage;
}

/** 測試用：重設儲存空間偵測 */
export function _resetStorageCheck() {
    storageChecked = false;
    storage = null;
    memory.clear();
}

export function isPersistent() {
    return getStorage() !== null;
}

function rawGet(key) {
    const s = getStorage();
    if (s) {
        try { return s.getItem(PREFIX + key); } catch { /* 退回記憶體 */ }
    }
    return memory.has(key) ? memory.get(key) : null;
}

function rawSet(key, value) {
    const s = getStorage();
    if (s) {
        try { s.setItem(PREFIX + key, value); return true; } catch { /* 退回記憶體 */ }
    }
    memory.set(key, value);
    return false;
}

function rawRemove(key) {
    const s = getStorage();
    if (s) { try { s.removeItem(PREFIX + key); } catch { /* ignore */ } }
    memory.delete(key);
}

/** 讀取欄位：{ status: 'empty' | 'ok' | 'broken', data } */
export function readSlot(slot) {
    const raw = rawGet('slot:' + slot);
    if (raw == null) return { status: 'empty', data: null };
    try {
        const data = JSON.parse(raw);
        if (!data || data.version !== SAVE_VERSION || typeof data.mapId !== 'string') return { status: 'broken', data: null };
        return { status: 'ok', data };
    } catch {
        return { status: 'broken', data: null };
    }
}

/** 寫入欄位，回傳是否真的存進瀏覽器 (false = 只存在記憶體) */
export function writeSlot(slot, snapshot) {
    const data = { ...snapshot, version: SAVE_VERSION, savedAt: snapshot.savedAt || Date.now() };
    return rawSet('slot:' + slot, JSON.stringify(data));
}

export function clearSlot(slot) {
    rawRemove('slot:' + slot);
}

/** 列出所有欄位 (含自動存檔) */
export function listSlots() {
    return [AUTO, ...SLOTS].map((slot) => ({ slot, ...readSlot(slot) }));
}

/** 最近一次手動存檔 (用於嚇暈後重來)，沒有則回傳 null */
export function latestManual() {
    let best = null;
    for (const slot of SLOTS) {
        const r = readSlot(slot);
        if (r.status === 'ok' && (!best || r.data.savedAt > best.data.savedAt)) best = { slot, data: r.data };
    }
    return best;
}

export function hasAnySave() {
    return listSlots().some((s) => s.status === 'ok');
}

// ---------- meta (累計嚇暈次數、是否通關) 與設定 ----------

const META_DEFAULT = { faints: 0, cleared: false };
const SETTINGS_DEFAULT = { bgm: 0.6, se: 0.8, textSpeed: 1 };

function readJson(key, fallback) {
    try {
        const raw = rawGet(key);
        return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
    } catch {
        return { ...fallback };
    }
}

export const meta = {
    get() { return readJson('meta', META_DEFAULT); },
    set(patch) { const m = { ...this.get(), ...patch }; rawSet('meta', JSON.stringify(m)); return m; },
};

export const settings = {
    get() { return readJson('settings', SETTINGS_DEFAULT); },
    set(patch) { const s = { ...this.get(), ...patch }; rawSet('settings', JSON.stringify(s)); return s; },
};
