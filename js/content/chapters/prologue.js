// 序章：八個人在停車場集合，準備出發去南庄 (約 1 分鐘的純劇情)

const LEGEND = {
    g: 'grass', c: 'concrete',
    t: { g: 'grass', o: 'tree' }, b: { g: 'grass', o: 'bush' }, ':': { g: 'grass', o: 'tuft' },
    V: { g: 'concrete', o: 'vanl' }, X: { g: 'concrete', o: 'vanr' }, l: { g: 'concrete', o: 'luggage' },
};

const lot = {
    id: 'prologue_lot',
    name: '停車場',
    bgm: 'prologue',
    floor: 'concrete',
    legend: LEGEND,
    rows: [
        'gggggggggggggggggggg',
        'gtgg:ggbggtggg:gbgtg',
        'gggggggggggggggggggg',
        'cccccccccccccVXccccc',
        'ccccccccccccccccllcc',
        'cccccccccccccccccccc',
        'cccccccccccccccccccc',
        'cccccccccccccccccccc',
        'cccccccccccccccccccc',
    ],
    entities: [
        { id: 'mom', kind: 'npc', char: 'mom', x: 8, y: 5, dir: 'left' },
        { id: 'son', kind: 'npc', char: 'son', x: 9, y: 6, dir: 'left' },
        { id: 'fb_dad', kind: 'npc', char: 'fb_dad', x: 10, y: 5, dir: 'left' },
        { id: 'fb_mom', kind: 'npc', char: 'fb_mom', x: 11, y: 6, dir: 'left' },
        { id: 'daughter', kind: 'npc', char: 'daughter', x: 12, y: 5, dir: 'left' },
        { id: 'pa', kind: 'npc', char: 'pa', x: 9, y: 4, dir: 'left' },
        { id: 'pb', kind: 'npc', char: 'pb', x: 11, y: 4, dir: 'left' },
    ],
};

export const prologue = {
    id: 'prologue',
    title: '序章',
    maps: { prologue_lot: lot },
    preset: { items: [], flags: {} },
    async start(g) {
        g.state.chapter = 'prologue';
        g.loadMap('prologue_lot', 6, 5, 'right');
        g.setCheckpoint();
        g.bgm('prologue');
        await g.runScript(async () => {
            await g.card('序章', '出發！南庄三日遊');
            await g.narrate('這個週末，兩家人加上兩位好朋友，八個人浩浩蕩蕩，準備去苗栗南庄玩三天兩夜。');
            await g.say('fb_dad', '人都到齊了嗎？行李都上車了？');
            await g.say('mom', '我數數看……一、二、三……八個，到齊了！');
            await g.say('son', '爸爸！我們要去哪裡玩呀？');
            await g.say('dad', '南庄喔。第一天住旅館，第二天去爬加里山。');
            await g.say('daughter', '可以吃鹹酥雞嗎？');
            await g.say('fb_mom', '你就知道吃。');
            await g.say('pa', '鹹酥雞……聽起來不錯欸。');
            await g.say('dad', '……時間過得真快啊。再沒多久，我就又老一歲了。');
            await g.say('mom', '欸，你不要又開始感嘆了啦。');
            await g.say('pb', '老一歲有什麼關係？上車上車，別讓山上的風景等太久！');
            await g.say('dad', '（不知道為什麼，我總覺得這趟旅行會發生什麼不太一樣的事……）');
            await g.narrate('就這樣，一行八人坐上休旅車，往南庄出發。');
            await g.fade(true, 0.8);
        });
        await g.startChapter('day1');
    },
};
