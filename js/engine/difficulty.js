// 難度補償：依累計嚇暈次數降低難度，確保壽星一定能看到結局。
// 門檻與倍率集中在這裡，方便試玩後調整。

export const FAINT_THRESHOLDS = [3, 5, 8];

// 各等級 (0 = 沒有補償)；speed 是老鬼速度倍率，chase 是追逐持續時間倍率 (追逐有時限時使用)
const LEVELS = [
    { speed: 1.0, hint: false, chase: 1.0 },
    { speed: 0.8, hint: false, chase: 1.0 },
    { speed: 0.8, hint: true, chase: 1.0 },
    { speed: 0.6, hint: true, chase: 0.6 },
];

export function difficultyFor(faints) {
    let level = 0;
    for (const t of FAINT_THRESHOLDS) if (faints >= t) level++;
    return { level, ...LEVELS[level] };
}
