// 地圖資料驗證：尺寸一致、物件座標合理、重要地點可以走到 (不需要瀏覽器)
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS } from '../js/content/chapters/index.js';
import { GameMap } from '../js/engine/map.js';
import { findPath } from '../js/engine/pathfind.js';

const allMaps = [];
for (const ch of Object.values(CHAPTERS)) for (const def of Object.values(ch.maps || {})) allMaps.push(def);

function entityTiles(e) {
    const out = [];
    for (let y = e.y; y < e.y + (e.h || 1); y++) for (let x = e.x; x < e.x + (e.w || 1); x++) out.push({ x, y });
    return out;
}

test('所有地圖的每一列寬度一致', () => {
    for (const def of allMaps) {
        const rows = def.rows || def.ground;
        const w = rows[0].length;
        rows.forEach((r, y) => assert.equal(r.length, w, `${def.id} 第 ${y} 列寬度 ${r.length} ≠ ${w}`));
    }
});

test('所有 legend 字元都有定義', () => {
    for (const def of allMaps) {
        const rows = def.rows || def.ground;
        rows.forEach((r, y) => [...r].forEach((ch, x) => {
            if (ch === ' ' || (!def.rows && ch === '.')) return;
            assert.ok(def.legend[ch] !== undefined, `${def.id} (${x},${y}) 字元 "${ch}" 沒有定義`);
        }));
    }
});

test('出入口、觸發區、物件都在地圖範圍內', () => {
    for (const def of allMaps) {
        const m = new GameMap(def);
        for (const e of def.entities || []) {
            for (const t of entityTiles(e)) assert.ok(m.inBounds(t.x, t.y), `${def.id}/${e.id || e.kind} (${t.x},${t.y}) 超出地圖`);
        }
    }
});

test('出入口與觸發區不能蓋在牆上、出入口目的地是可走的格子', () => {
    for (const def of allMaps) {
        const m = new GameMap(def);
        for (const e of def.entities || []) {
            if (e.kind === 'exit') {
                assert.ok(!m.solidTile(e.x, e.y), `${def.id}/${e.id} 出入口在不可走的格子上`);
                const dest = allMaps.find((d) => d.id === e.to);
                assert.ok(dest, `${def.id}/${e.id} 目的地 ${e.to} 不存在`);
                const dm = new GameMap(dest);
                assert.ok(!dm.solidTile(e.tx, e.ty), `${def.id}/${e.id} 目的地 (${e.tx},${e.ty}) 在 ${e.to} 是不可走的格子`);
                // 目的地不能剛好是另一個出入口 (會一直來回傳送)
                const bounce = (dest.entities || []).find((d) => d.kind === 'exit' && entityTiles(d).some((t) => t.x === e.tx && t.y === e.ty));
                assert.ok(!bounce, `${def.id}/${e.id} 目的地正好是 ${e.to} 的出入口 ${bounce && bounce.id}`);
            }
            if (e.kind === 'trigger') for (const t of entityTiles(e)) assert.ok(!m.solidTile(t.x, t.y), `${def.id}/${e.id || 'trigger'} (${t.x},${t.y}) 觸發區在不可走的格子上`);
        }
    }
});

test('NPC 站在可走的格子上 (床等家具上的 NPC 除外)', () => {
    for (const def of allMaps) {
        const m = new GameMap(def);
        for (const e of def.entities || []) {
            if (e.kind !== 'npc') continue;
            const tn = m.tileName('objects', e.x, e.y);
            if (m.solidTile(e.x, e.y)) assert.equal(tn, 'bedhosp', `${def.id}/${e.id} (${e.x},${e.y}) 站在不可走的格子上 (${tn})`);
        }
    }
});

test('互動物件 (inspect / hide) 的格子可以被站在旁邊的主角面向', () => {
    for (const def of allMaps) {
        const m = new GameMap(def);
        for (const e of def.entities || []) {
            if (e.kind !== 'inspect' && e.kind !== 'hide' && e.kind !== 'npc') continue;
            // 多格物件只要有一格能被走到旁邊就行
            const approachable = entityTiles(e).some((t) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => (
                m.inBounds(t.x + dx, t.y + dy) && !m.solidTile(t.x + dx, t.y + dy)
                && !entityTiles(e).some((o) => o.x === t.x + dx && o.y === t.y + dy))));
            assert.ok(approachable, `${def.id}/${e.id} (${e.x},${e.y}) 四周都是牆，沒辦法調查`);
        }
    }
});

function reach(def, from, to, extraBlock = () => false) {
    const m = new GameMap(def);
    const blocked = new Set();
    for (const e of def.entities || []) {
        if (e.kind === 'npc' || e.solid) for (const t of entityTiles(e)) blocked.add(t.x + ',' + t.y);
    }
    const pass = (x, y) => !m.solidTile(x, y) && !blocked.has(x + ',' + y) && !extraBlock(x, y);
    return findPath(m.width, m.height, pass, from, to);
}

const byId = (id) => allMaps.find((d) => d.id === id);

test('Day 1 旅館：起點到各重要地點都走得到', () => {
    const f2 = byId('hotel_2f');
    for (const [name, to] of Object.entries({ 浴室門口: { x: 3, y: 10 }, 大通鋪: { x: 7, y: 7 }, 棉被間: { x: 21, y: 4 }, 樓梯: { x: 21, y: 9 } })) {
        // 開場時 NPC 擋在大通鋪裡，這裡以洗完澡之後 (沒有 NPC) 的狀態驗證
        const m = new GameMap(f2);
        const solidNpc = new Set((f2.entities || []).filter((e) => e.kind === 'npc').map((e) => e.x + ',' + e.y));
        const p = findPath(m.width, m.height, (x, y) => !m.solidTile(x, y) && !solidNpc.has('x'), { x: 3, y: 10 }, to);
        assert.ok(p, `hotel_2f 浴室門口 -> ${name} 走不到`);
    }
    const f1 = byId('hotel_1f');
    const m1 = new GameMap(f1);
    const walk = (a, b, unlocked) => findPath(m1.width, m1.height, (x, y) => !m1.solidTile(x, y) && !(!unlocked && x === 20 && y === 8), a, b);
    assert.ok(walk({ x: 21, y: 10 }, { x: 4, y: 7 }, true), '櫃台');
    assert.ok(walk({ x: 21, y: 10 }, { x: 13, y: 7 }, true), '交誼廳');
    assert.ok(walk({ x: 21, y: 10 }, { x: 20, y: 7 }, true), '廚房 (鑰匙打開後)');
    assert.equal(walk({ x: 21, y: 10 }, { x: 20, y: 7 }, false), null, '廚房沒鑰匙時不能進');
    assert.ok(walk({ x: 21, y: 10 }, { x: 11, y: 11 }, true), '大門前');
});

test('Day 2 加里山：山頂到登山口有路，近路與遠路都走得通', () => {
    const t = byId('jiali_trail');
    const goal = { x: 29, y: 95 };
    const m = new GameMap(t);
    const solidEnt = new Set((t.entities || []).filter((e) => e.kind === 'inspect' && e.solid).flatMap(entityTiles).map((p) => p.x + ',' + p.y));
    const pass = (x, y) => !m.solidTile(x, y) && !solidEnt.has(x + ',' + y);
    const full = findPath(m.width, m.height, pass, { x: 19, y: 7 }, goal);
    assert.ok(full, '山頂 -> 登山口');
    // 近路：封住遠路 (x < 20 的西側路段) 仍然走得通
    const near = findPath(m.width, m.height, (x, y) => pass(x, y) && !(x < 20 && y >= 50), { x: 19, y: 7 }, goal);
    assert.ok(near, '近路');
    // 遠路：封住近路 (x 28~30、y 53~67) 仍然走得通
    const far = findPath(m.width, m.height, (x, y) => pass(x, y) && !(x >= 28 && x <= 30 && y >= 53 && y <= 67), { x: 19, y: 7 }, goal);
    assert.ok(far, '遠路');
    assert.ok(far.length > near.length + 20, `遠路 (${far.length}) 應該比近路 (${near.length}) 明顯長`);
    // 蜂群在近路上
    const zones = (t.entities || []).filter((e) => e.id && e.id.startsWith('bee_zone'));
    assert.equal(zones.length, 2);
    for (const z of zones) assert.ok(z.x >= 28 && z.x + z.w - 1 <= 30 && z.y >= 53 && z.y <= 67, '蜂群在近路上');
});

test('Day 2 醫院：病房、護理站、安全梯之間走得通；鑰匙才能進安全梯', () => {
    const h = byId('hospital_f2');
    const start = { x: 3, y: 3 };
    for (const [name, to] of Object.entries({ 病房B: { x: 12, y: 6 }, 護理站: { x: 8, y: 12 }, 安全梯前: { x: 22, y: 9 }, 病房A窗簾: { x: 2, y: 5 } })) {
        assert.ok(reach(h, start, to), `醫院 起點 -> ${name} 走不到`);
    }
    assert.equal(reach(h, start, { x: 20, y: 5 }), null, '病房 C 應該進不去');
    assert.ok(reach(byId('store_1f'), { x: 2, y: 5 }, { x: 8, y: 7 }), '便利商店');
});

test('Day 3 透天厝：三層樓都走得通，鑰匙與大門的位置可到達', () => {
    const f1 = byId('home_1f');
    assert.ok(reach(f1, { x: 3, y: 5 }, { x: 20, y: 9 }), '1F 起點 -> 樓梯');
    assert.ok(reach(f1, { x: 3, y: 5 }, { x: 10, y: 11 }), '1F 起點 -> 大門前');
    assert.ok(reach(f1, { x: 3, y: 5 }, { x: 16, y: 7 }), '1F 起點 -> 廚房');
    const f2 = byId('home_2f');
    assert.ok(reach(f2, { x: 19, y: 10 }, { x: 19, y: 4 }), '2F 兒子房間的畫冊');
    assert.ok(reach(f2, { x: 19, y: 10 }, { x: 2, y: 4 }), '2F 主臥的床');
    const f3 = byId('home_3f');
    assert.ok(reach(f3, { x: 2, y: 10 }, { x: 7, y: 3 }), '3F 公仔櫃前');
    assert.ok(reach(f3, { x: 2, y: 10 }, { x: 13, y: 3 }), '3F 空位前');
    assert.ok(reach(f3, { x: 2, y: 10 }, { x: 18, y: 5 }), '3F 陽台');
});

test('章節都有開場函式，正式章節都有地圖', () => {
    for (const id of ['prologue', 'day1', 'day2', 'day3']) {
        assert.equal(typeof CHAPTERS[id].start, 'function', id);
        assert.ok(Object.keys(CHAPTERS[id].maps).length > 0, id + ' 沒有地圖');
        assert.ok(!CHAPTERS[id].stub, id + ' 仍是 stub');
    }
});
