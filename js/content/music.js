// 背景音樂樂譜 (由 audio.js 以 Web Audio 即時合成，不需要音樂檔)
// 音符格式：'C4:4' = 音名 + 八度 + ':' + 長度 (單位為十六分音符)，'-:4' = 休止符，# 升記號、b 降記號
// 每個 voice 的時間軸從第 0 步開始，整首曲子以最長的 voice 為一個循環。

export const MUSIC = {
    // 標題：輕快帶點滑稽
    title: {
        bpm: 112,
        voices: [
            { wave: 'square', vol: 0.09, notes: 'E5:4 G5:4 E5:4 C5:4 D5:4 F5:4 D5:4 B4:4 C5:4 E5:4 G5:4 E5:4 D5:8 G4:8' },
            { wave: 'triangle', vol: 0.2, notes: 'C3:8 G3:8 G2:8 D3:8 A2:8 E3:8 G2:16' },
        ],
    },
    // 序章：公路旅行
    prologue: {
        bpm: 128,
        voices: [
            { wave: 'square', vol: 0.09, notes: 'G4:4 B4:4 D5:4 B4:4 A4:4 C5:4 E5:4 C5:4 B4:4 D5:4 G5:4 D5:4 A4:8 D5:8' },
            { wave: 'triangle', vol: 0.2, notes: 'G2:8 D3:8 A2:8 E3:8 G2:8 D3:8 D3:16' },
        ],
    },
    // Day 1：半夜的旅館，可愛又有點毛
    day1: {
        bpm: 84,
        voices: [
            { wave: 'triangle', vol: 0.16, notes: 'A4:6 C5:2 E5:4 -:4 D5:6 C5:2 B4:4 -:4 A4:4 B4:4 C5:4 E5:4 E5:12 -:4' },
            { wave: 'sine', vol: 0.22, notes: 'A2:16 F2:16 D2:8 E2:8 A2:16' },
            { wave: 'square', vol: 0.04, notes: '-:2 A5:1 -:13 -:16 -:2 E5:1 -:13 -:16' },
        ],
    },
    // Day 2 山路
    day2: {
        bpm: 118,
        voices: [
            { wave: 'square', vol: 0.09, notes: 'D5:4 F#5:4 A5:4 F#5:4 E5:4 G5:4 E5:4 C#5:4 D5:4 F#5:4 A5:4 D6:4 A5:8 D5:8' },
            { wave: 'triangle', vol: 0.2, notes: 'D3:4 A3:4 D3:4 A3:4 E3:4 B3:4 E3:4 B3:4 D3:4 A3:4 D3:4 A3:4 A2:8 D3:8' },
        ],
    },
    // 醫院：稀疏安靜
    hospital: {
        bpm: 70,
        voices: [
            { wave: 'sine', vol: 0.2, notes: 'E5:8 -:4 B4:4 G4:8 -:8 A4:8 -:4 F#4:4 E4:16' },
            { wave: 'triangle', vol: 0.18, notes: 'E2:16 C3:16 A2:16 B2:16' },
        ],
    },
    // Day 3：家裡，柔和帶一點詭異
    day3: {
        bpm: 92,
        voices: [
            { wave: 'triangle', vol: 0.16, notes: 'F4:4 A4:4 C5:8 Bb4:4 A4:4 G4:8 F4:4 A4:4 C5:4 D5:4 C5:16' },
            { wave: 'sine', vol: 0.22, notes: 'F2:16 C3:16 D3:8 Bb2:8 C3:16' },
            { wave: 'square', vol: 0.035, notes: 'C6:1 -:15 -:16 G5:1 -:15 -:16' },
        ],
    },
    // 追逐：快節奏
    chase: {
        bpm: 156,
        voices: [
            {
                wave: 'square', vol: 0.1,
                notes: 'A4:2 A4:2 C5:2 A4:2 E5:2 A4:2 C5:2 A4:2 G4:2 G4:2 B4:2 G4:2 D5:2 G4:2 B4:2 G4:2 '
                    + 'F4:2 F4:2 A4:2 F4:2 C5:2 F4:2 A4:2 F4:2 E4:2 E4:2 G#4:2 E4:2 B4:2 E4:2 G#4:2 E4:2',
            },
            { wave: 'sawtooth', vol: 0.09, notes: 'A2:4 A2:4 A2:4 A2:4 G2:4 G2:4 G2:4 G2:4 F2:4 F2:4 F2:4 F2:4 E2:4 E2:4 E2:4 E2:4' },
        ],
    },
    // 結局：生日快樂歌 (PD) 搭配簡單伴奏
    birthday: {
        bpm: 104,
        voices: [
            {
                wave: 'square', vol: 0.1,
                notes: 'G4:3 G4:1 A4:4 G4:4 C5:4 B4:12 G4:3 G4:1 A4:4 G4:4 D5:4 C5:12 '
                    + 'G4:3 G4:1 G5:4 E5:4 C5:4 B4:4 A4:4 F5:3 F5:1 E5:4 C5:4 D5:4 C5:12',
            },
            { wave: 'triangle', vol: 0.2, notes: 'C3:12 C3:12 G2:12 C3:12 C3:12 G2:12 C3:12 F2:12 C3:12 G2:12 C3:12' },
        ],
    },
};
