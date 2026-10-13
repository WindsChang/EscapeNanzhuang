// 地圖：以字元陣列定義 (地面層 + 物件層)，legend 把字元對應到圖塊名稱
import { TILE, VIEW_W, VIEW_H } from './util.js';
import { drawTile, isSolidTile } from './sprites.js';

export class GameMap {
    /**
     * def = {
     *   id, name, ground: string[], objects?: string[], legend: { char: tileName },
     *   entities?: object[], bgm?: string, bg?: string (地圖外的背景色), dark?: number (0..1 暗角強度)
     * }
     */
    constructor(def) {
        this.def = def;
        this.id = def.id;
        this.name = def.name || def.id;
        this.legend = def.legend || {};
        this.ground = def.ground.map((r) => [...r]);
        this.objects = (def.objects || []).map((r) => [...r]);
        this.height = this.ground.length;
        this.width = Math.max(...this.ground.map((r) => r.length));
        this.bg = def.bg || '#000';
        this.dark = def.dark || 0;
        this.overrides = new Map(); // 動態改變的圖塊：'x,y' -> { ground?, object? }
    }

    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    tileName(layer, x, y) {
        const o = this.overrides.get(x + ',' + y);
        if (o && layer in o) return o[layer];
        const row = (layer === 'ground' ? this.ground : this.objects)[y];
        if (!row) return null;
        const ch = row[x];
        if (!ch || ch === ' ' || (layer === 'objects' && ch === '.')) return null;
        return this.legend[ch] || null;
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
