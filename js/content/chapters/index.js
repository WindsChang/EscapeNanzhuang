// 章節註冊：每個章節提供自己的地圖與開場腳本。
import { sandbox } from './sandbox.js';
import { prologue } from './prologue.js';
import { day1 } from './day1.js';
import { day2 } from './day2.js';
import { day3 } from './day3.js';

export const CHAPTERS = { sandbox, prologue, day1, day2, day3 };

/** 依順序的正式章節 (除錯跳關用) */
export const CHAPTER_ORDER = ['prologue', 'day1', 'day2', 'day3'];

/** 「開始遊戲」進入的章節 */
export const NEW_GAME_CHAPTER = 'prologue';

export function mapDef(id) {
    for (const ch of Object.values(CHAPTERS)) {
        if (ch.maps && ch.maps[id]) return ch.maps[id];
    }
    return null;
}
