// Day 3 公仔排列謎題使用的公仔。
// label 目前是 emoji 佔位；拿到壽星真正收藏的公仔後，把 label 換成公仔的名字 (或短文字)，
// order 改成兒子畫冊上的排列順序即可，謎題程式不需要修改。
export const FIGURINES = [
    { id: 'bear', label: '🧸', name: '小熊' },
    { id: 'robot', label: '🤖', name: '機器人' },
    { id: 'rabbit', label: '🐰', name: '兔子' },
    { id: 'dino', label: '🦖', name: '恐龍' },
];

/** 正確的排列順序 (由左到右)，同時也是兒子畫冊上畫的順序 */
export const FIGURINE_ORDER = ['bear', 'robot', 'rabbit', 'dino'];

/** 公仔櫃一開始被打亂的樣子 (FIGURINES 的索引) */
export const FIGURINE_START = [2, 3, 0, 1];
