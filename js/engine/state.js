// 遊戲進度狀態：道具、劇情旗標、章節、目標提示。(嚇暈次數存在 save.meta，不隨讀檔歸零)

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.chapter = 'sandbox';
        this.items = [];
        this.flags = {};
        this.objective = '';
    }

    has(item) { return this.items.includes(item); }

    give(item) {
        if (!this.has(item)) this.items.push(item);
    }

    take(item) {
        this.items = this.items.filter((i) => i !== item);
    }

    flag(name, value) {
        if (value === undefined) return this.flags[name];
        this.flags[name] = value;
        return value;
    }

    /** 轉成可存檔的純資料 */
    toJSON() {
        return { chapter: this.chapter, items: [...this.items], flags: { ...this.flags }, objective: this.objective };
    }

    load(data) {
        this.chapter = data.chapter || 'sandbox';
        this.items = [...(data.items || [])];
        this.flags = { ...(data.flags || {}) };
        this.objective = data.objective || '';
    }
}
