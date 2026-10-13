// 地圖：以字元陣列定義，legend 把字元對應到圖塊名稱。
// 兩種寫法：
//   1. rows (建議)：單一字元網格。legend 值為地面圖塊名稱，或物件圖塊名稱 (底下自動鋪 def.floor)，
//      也可寫成 { g: 地面, o: 物件 } 指定物件底下的地面。
//   2. ground + objects：地面層與物件層分開的兩個字元網格 (示範場景使用)。
import { TILE, VIEW_W, VIEW_H } from './util.js';
import { drawTile, isSolidTile, isGroundTile } from './sprites.js';

export class GameMap {
    /**
     * def = {
     *   id, name, rows | (ground, objects), legend: { char: tileName | {g,o} }, floor?: 物件底下預設地面,
     *   entities?: object[], bgm?: string, bg?: string (地圖外的背景色), dark?: number (0..1 暗角強度)
     * }
     */
    constructor(def) {
        this.def = def;
        this.id = def.id;
        this.name = def.name || def.id;
        this.bg = def.bg || '#000';
        this.dark = def.dark || 0;
        this.overrides = new Map(); // 動態改變的圖塊：'x,y' -> { ground?, objects? }
        const legend = def.legend || {};

        const lookup = (ch) => (ch && ch !== ' ' ? legend[ch] : undefined);
        if (def.rows) {
            this.height = def.rows.length;
            this.width = Math.max(...def.rows.map((r) => r.length));
            this.groundNames = [];
            this.objectNames = [];
            def.rows.forEach((row) => {
                const g = [];
                const o = [];
                for (let x = 0; x < this.width; x++) {
                    const spec = lookup(row[x]);
                    let gn = null;
                    let on = null;
                    if (typeof spec === 'string') {
                        if (isGroundTile(spec)) gn = spec;
                        else { gn = def.floor || 'wood'; on = spec; }
                    } else if (spec) {
                        gn = spec.g || def.floor || 'wood';
                        on = spec.o || null;
                    }
                    g.push(gn);
                    o.push(on);
                }
                this.groundNames.push(g);
                this.objectNames.push(o);
            });
        } else {
            this.height = def.ground.length;
            this.width = Math.max(...def.ground.map((r) => r.length));
            const conv = (rows, isObj) => rows.map((row) => {
                const out = [];
                for (let x = 0; x < this.width; x++) {
                    const ch = row ? row[x] : undefined;
                    out.push(!ch || ch === ' ' || (isObj && ch === '.') ? null : legend[ch] || null);
                }
                return out;
            });
            this.groundNames = conv(def.ground, false);
            this.objectNames = conv(def.objects || def.ground.map(() => ''), true);
            while (this.objectNames.length < this.height) this.objectNames.push(new Array(this.width).fill(null));
        }
    }

    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    tileName(layer, x, y) {
        const o = this.overrides.get(x + ',' + y);
        if (o && layer in o) return o[layer];
        const grid = layer === 'ground' ? this.groundNames : this.objectNames;
        const row = grid[y];
        return row ? row[x] || null : null;
    }

    /** 動態改變圖塊 (例如打開暗格、換掉物件)；name 為 null 代表移除 */
    setTile(layer, x, y, name) {
        const k = x + ',' + y;
        this.overrides.set(k, { ...(this.overrides.get(k) || {}), [layer]: name });
    }

    solidTile(x, y) {
        if (!this.inBounds(x, y)) return true;
        const g = this.tileName('ground', x, y);
        const o = this.tileName('objects', x, y);
        return (g && isSolidTile(g)) || (o && isSolidTile(o)) || false;
    }

    /** 繪製可見範圍的地面與物件層 */
    draw(ctx, camX, camY) {
        const x0 = Math.max(0, Math.floor(camX / TILE));
        const y0 = Math.max(0, Math.floor(camY / TILE));
        const x1 = Math.min(this.width - 1, Math.floor((camX + VIEW_W) / TILE));
        const y1 = Math.min(this.height - 1, Math.floor((camY + VIEW_H) / TILE));
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const g = this.tileName('ground', x, y);
                if (g) drawTile(ctx, g, x * TILE - camX, y * TILE - camY);
            }
        }
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const o = this.tileName('objects', x, y);
                if (o) drawTile(ctx, o, x * TILE - camX, y * TILE - camY);
            }
        }
    }
}
