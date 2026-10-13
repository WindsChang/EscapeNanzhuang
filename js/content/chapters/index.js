// 章節註冊：每個章節提供自己的地圖與開場腳本。
// 正式章節 (prologue / day1 / day2 / day3) 完成前以 stub 佔位，內容在後續任務中補上。
import { sandbox } from './sandbox.js';

const stub = (id, title) => ({ id, title, stub: true, maps: {} });

export const CHAPTERS = {
    sandbox,
    prologue: stub('prologue', '序章'),
    day1: stub('day1', 'Day 1　旅館'),
    day2: stub('day2', 'Day 2　加里山與醫院'),
    day3: stub('day3', 'Day 3　透天厝'),
};

/** 依順序的正式章節 (除錯跳關用) */
export const CHAPTER_ORDER = ['prologue', 'day1', 'day2', 'day3'];

/** 「開始遊戲」進入的章節；正式章節完成後改為 prologue */
export const NEW_GAME_CHAPTER = 'sandbox';

export function mapDef(id) {
    for (const ch of Object.values(CHAPTERS)) {
        if (ch.maps && ch.maps[id]) return ch.maps[id];
    }
    return null;
}
