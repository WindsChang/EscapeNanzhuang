// 格子尋路 (BFS)：地圖最大約 40x30，每次移動重新計算的量可以忽略

const STEPS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

/**
 * 找出從 from 到 to 的最短路徑 (含終點、不含起點)；找不到回傳 null。
 * @param {number} w 地圖寬
 * @param {number} h 地圖高
 * @param {(x:number,y:number)=>boolean} passable 該格是否可通行
 */
export function findPath(w, h, passable, from, to) {
    if (from.x === to.x && from.y === to.y) return [];
    const key = (x, y) => y * w + x;
    const prev = new Int32Array(w * h).fill(-2);
    const queue = [key(from.x, from.y)];
    prev[queue[0]] = -1;
    const goal = key(to.x, to.y);
    for (let qi = 0; qi < queue.length; qi++) {
        const cur = queue[qi];
        const cx = cur % w;
        const cy = (cur / w) | 0;
        for (const [dx, dy] of STEPS) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const k = key(nx, ny);
            if (prev[k] !== -2) continue;
            // 目標格即使不可通行 (例如主角站的位置被視為障礙) 也允許抵達
            if (k !== goal && !passable(nx, ny)) continue;
            prev[k] = cur;
            if (k === goal) {
                const path = [];
                for (let c = k; c !== -1 && c !== queue[0]; c = prev[c]) path.push({ x: c % w, y: (c / w) | 0 });
                return path.reverse();
            }
            queue.push(k);
        }
    }
    return null;
}
