// 純邏輯測試 (不需要瀏覽器)：node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { difficultyFor, FAINT_THRESHOLDS } from '../js/engine/difficulty.js';
import { findPath } from '../js/engine/pathfind.js';
import * as Save from '../js/engine/save.js';
import { compileTrack } from '../js/engine/audio.js';
import { MUSIC } from '../js/content/music.js';

function fakeStorage(failWrites = false) {
    const m = new Map();
    return {
        getItem: (k) => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => { if (failWrites) throw new Error('quota'); m.set(k, String(v)); },
        removeItem: (k) => m.delete(k),
        _m: m,
    };
}

test('難度補償：依嚇暈次數逐級降低難度', () => {
    assert.deepEqual(FAINT_THRESHOLDS, [3, 5, 8]);
    assert.equal(difficultyFor(0).level, 0);
    assert.equal(difficultyFor(2).speed, 1);
    assert.equal(difficultyFor(3).level, 1);
    assert.ok(difficultyFor(3).speed < 1);
    assert.equal(difficultyFor(3).hint, false);
    assert.equal(difficultyFor(5).hint, true);
    assert.ok(difficultyFor(8).speed < difficultyFor(5).speed);
    assert.ok(difficultyFor(8).chase < 1);
    assert.equal(difficultyFor(99).level, 3);
});

test('尋路：繞過障礙物並回傳最短路徑', () => {
    const walls = new Set(['2,0', '2,1', '2,2']); // 直牆，缺口在 y=3
    const passable = (x, y) => !walls.has(`${x},${y}`);
    const path = findPath(5, 5, passable, { x: 0, y: 0 }, { x: 4, y: 0 });
    assert.ok(path && path.length > 4);
    assert.deepEqual(path[path.length - 1], { x: 4, y: 0 });
    assert.ok(path.every((p) => passable(p.x, p.y)));
    // 完全封死
    const blocked = (x) => x !== 2;
    assert.equal(findPath(5, 5, blocked, { x: 0, y: 0 }, { x: 4, y: 0 }), null);
    // 目標格不可通行時仍可抵達 (主角所在格)
    assert.deepEqual(findPath(3, 1, (x) => x !== 2, { x: 0, y: 0 }, { x: 2, y: 0 }).pop(), { x: 2, y: 0 });
});

test('存檔：寫入後可讀回，且保留 meta (嚇暈次數) 與設定', () => {
    globalThis.localStorage = fakeStorage();
    Save._resetStorageCheck();
    assert.equal(Save.readSlot(1).status, 'empty');
    const persisted = Save.writeSlot(1, { mapId: 'm', x: 3, y: 4, items: ['a'], flags: { f: 1 }, chapter: 'c' });
    assert.equal(persisted, true);
    const r = Save.readSlot(1);
    assert.equal(r.status, 'ok');
    assert.deepEqual(r.data.items, ['a']);
    Save.meta.set({ faints: 4 });
    assert.equal(Save.meta.get().faints, 4);
    Save.settings.set({ bgm: 0 });
    assert.equal(Save.settings.get().bgm, 0);
    assert.equal(Save.settings.get().se, 0.8);
});

test('存檔：損毀或版本不符的資料視為無法讀取，不會丟例外', () => {
    const st = fakeStorage();
    globalThis.localStorage = st;
    Save._resetStorageCheck();
    st.setItem('escape-nanzhuang:slot:2', '{broken json');
    assert.equal(Save.readSlot(2).status, 'broken');
    st.setItem('escape-nanzhuang:slot:3', JSON.stringify({ version: 999, mapId: 'x' }));
    assert.equal(Save.readSlot(3).status, 'broken');
    assert.doesNotThrow(() => Save.listSlots());
});

test('存檔：覆蓋與最近手動存檔', () => {
    globalThis.localStorage = fakeStorage();
    Save._resetStorageCheck();
    Save.writeSlot(1, { mapId: 'a', savedAt: 100 });
    Save.writeSlot(2, { mapId: 'b', savedAt: 300 });
    Save.writeSlot(Save.AUTO, { mapId: 'auto', savedAt: 999 });
    assert.equal(Save.latestManual().slot, 2); // 自動存檔不算手動
    Save.writeSlot(1, { mapId: 'c', savedAt: 500 });
    assert.equal(Save.latestManual().slot, 1);
    assert.equal(Save.readSlot(1).data.mapId, 'c');
});

test('存檔：localStorage 不可用時退回記憶體，遊戲仍可讀寫', () => {
    globalThis.localStorage = fakeStorage(true);
    Save._resetStorageCheck();
    assert.equal(Save.isPersistent(), false);
    const persisted = Save.writeSlot(1, { mapId: 'm' });
    assert.equal(persisted, false);
    assert.equal(Save.readSlot(1).status, 'ok');
    assert.doesNotThrow(() => Save.meta.set({ faints: 1 }));
    delete globalThis.localStorage;
    Save._resetStorageCheck();
    assert.equal(Save.isPersistent(), false);
    assert.doesNotThrow(() => Save.writeSlot(1, { mapId: 'x' }));
});

test('背景音樂樂譜：每首都能編譯，且有音符', () => {
    for (const [name, def] of Object.entries(MUSIC)) {
        const c = compileTrack(def);
        assert.ok(c.total >= 16, name + ' 長度');
        assert.ok(c.events.size > 0, name + ' 事件');
        assert.ok(c.stepSec > 0.02 && c.stepSec < 0.3, name + ' 速度');
    }
});
