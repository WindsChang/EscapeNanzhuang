// Day 3：三層透天厝 + 最終結局
//   回家休養 -> 醒來家人不見 -> 公仔排列謎題拿到大門鑰匙 -> 老鬼 (白髮蒼蒼拄拐杖) 追逐 3F -> 1F
//   -> 玄關：開門逃出去 (門把轉不動) / 回頭 -> 「老一歲就老一歲吧」-> 大家跳出來慶生 -> 蛋糕、照片、片尾

import { FIGURINES, FIGURINE_ORDER, FIGURINE_START } from '../figurines.js';
import { meta } from '../../engine/save.js';

const rep = (c, n) => c.repeat(n);

const LEGEND = {
    '#': 'wall', W: 'wallface', w: 'window', D: 'door', '.': 'wood', i: 'tile',
    U: 'stairsup', V: 'stairsdown',
    S: 'sofa', v: 'tv', k: 'bookshelf', m: 'lamp', p: 'plant', Q: 'curtain', b: 'balloons', x: 'box', y: 'toybox', T: 'table',
    e: 'bedhome', a: 'wardrobe', f: 'figcase', g: 'figslot',
    R: { g: 'tile', o: 'fridge' }, s: { g: 'tile', o: 'stove' }, c: { g: 'tile', o: 'counter' }, z: { g: 'tile', o: 'table' },
};

// ---------- 1F：客廳 (起點沙發)、廚房 (冰箱)、玄關 (大門) ----------
const rows1f = [
    rep('#', 22),
    '#' + 'WWWWwWWWWW' + '#' + 'WWWWwWWWW' + '#',
    '#' + 'p.kvk..Q.p' + '#' + 'Rsccciiii' + '#',
    '#' + rep('.', 10) + '#' + rep('i', 9) + '#',
    '#' + '..SS......' + '#' + 'iiiiizii' + 'i' + '#',
    '#' + '.........b' + '#' + rep('i', 9) + '#',
    '#' + rep('.', 10) + '#' + rep('i', 9) + '#',
    '#' + rep('.', 10) + '#' + rep('i', 9) + '#',
    '#' + '####.#####' + '#' + '####.####' + '#',
    '#' + rep('.', 20) + '#',
    '#' + rep('.', 19) + 'U' + '#',
    '#' + rep('.', 20) + '#',
    rep('#', 10) + 'D' + rep('#', 11),
];

const REVEAL = {
    pa: [6, 9, 'down'], daughter: [9, 9, 'down'], fb_dad: [12, 9, 'down'], pb: [15, 9, 'down'],
    mom: [8, 10, 'down'], son: [11, 10, 'down'], fb_mom: [13, 10, 'down'],
};

const home1f = {
    id: 'home_1f',
    name: '家 1F',
    bgm: 'day3',
    legend: LEGEND,
    rows: rows1f,
    dark: 0.3,
    entities: [
        // 開場時家人還在客廳
        { id: 'mom', kind: 'npc', char: 'mom', x: 6, y: 5, dir: 'left', when: (g) => !g.flag('d3_alone') && !g.flag('reveal') },
        { id: 'son', kind: 'npc', char: 'son', x: 7, y: 6, dir: 'left', when: (g) => !g.flag('d3_alone') && !g.flag('reveal') },
        // 結局時從各處跳出來的同伴
        ...Object.entries(REVEAL).map(([id, [x, y, dir]]) => ({
            id: 'r_' + id, kind: 'npc', char: id, x, y, dir, when: (g) => g.flag('reveal'),
        })),
        { id: 'cake', kind: 'prop', tile: 'cake', x: 10, y: 10, when: (g) => g.flag('reveal') },
        {
            id: 'tv', kind: 'inspect', x: 4, y: 2,
            async onInteract(g) { await g.narrate('電視關著，螢幕上映出我自己有點疲憊的臉。'); },
        },
        {
            id: 'sofa', kind: 'inspect', x: 3, y: 4, w: 2,
            async onInteract(g) { await g.narrate('沙發上還留著我剛剛睡出來的凹痕。'); },
        },
        {
            id: 'balloon_bag', kind: 'inspect', x: 10, y: 5,
            async onInteract(g) {
                await g.narrate('地上有一包還沒吹的氣球。……奇怪，今天家裡有誰要過生日嗎？');
            },
        },
        {
            id: 'fridge', kind: 'inspect', x: 12, y: 2,
            async onInteract(g) {
                await g.narrate('冰箱裡有一個蛋糕盒，上面貼了張紙條：「不准打開！！！」');
                await g.narrate('旁邊還畫了一個很醜的笑臉。……這字跡，是兒子的。');
                g.flag('saw_cakebox', true);
            },
        },
        { id: 'stove', kind: 'inspect', x: 13, y: 2, async onInteract(g) { await g.narrate('爐子上什麼都沒有，廚房很乾淨。'); } },
        {
            id: 'curtain_living', kind: 'hide', hide: { type: 'curtain' }, x: 8, y: 2,
            async idle(g) { await g.narrate('客廳的窗簾。拉開來，外面一片漆黑。'); },
        },
        {
            id: 'key_hook', kind: 'inspect', x: 9, y: 11,
            async onInteract(g) { await g.narrate('玄關的掛勾。平常掛大門鑰匙的地方，現在空空的……鑰匙不見了。'); },
        },
        // 大門
        {
            id: 'front_door', kind: 'inspect', solid: true, x: 10, y: 12,
            async onInteract(g) {
                if (!g.has('home_gatekey')) {
                    g.se('locked');
                    await g.narrate('大門鎖得緊緊的。鑰匙……鑰匙去哪了？');
                    return;
                }
                await doorChoice(g);
            },
        },
        // 剛醒來時，樓上傳來聲音 (伏筆)
        {
            id: 'creak', kind: 'trigger', x: 5, y: 8,
            when: (g) => g.flag('d3_alone') && !g.flag('d3_creak'),
            async onEnter(g) {
                g.flag('d3_creak', true);
                g.se('creak');
                g.floatText('……咚。', 2);
                await g.narrate('天花板傳來「咚」的一聲，好像有人在樓上走動……還有人在偷笑？');
            },
        },
        { id: 'to2f', kind: 'exit', x: 20, y: 10, to: 'home_2f', tx: 19, ty: 10, dir: 'left', sfx: 'footstep' },
    ],
};

// ---------- 2F：主臥 (大衣櫃)、兒子房間 ----------
const rows2f = [
    rep('#', 22),
    '#' + 'WWWWwWWWWW' + '#' + 'WWWWwWWWW' + '#',
    '#' + '.m......aa' + '#' + 'y.kk.....' + '#',
    '#' + '.ee.......' + '#' + '.......T.' + '#',
    '#' + rep('.', 10) + '#' + rep('.', 9) + '#',
    '#' + rep('.', 10) + '#' + rep('.', 9) + '#',
    '#' + 'x.........' + '#' + rep('.', 9) + '#',
    '#' + rep('.', 10) + '#' + rep('.', 9) + '#',
    '#' + '####.#####' + '#' + '####.####' + '#',
    '#' + rep('.', 20) + '#',
    '#' + 'U' + rep('.', 18) + 'V' + '#',
    '#' + rep('.', 20) + '#',
    rep('#', 22),
];

const home2f = {
    id: 'home_2f',
    name: '家 2F',
    bgm: 'day3',
    legend: LEGEND,
    rows: rows2f,
    dark: 0.3,
    entities: [
        {
            id: 'bed_hide', kind: 'hide', hide: { type: 'bed' }, x: 2, y: 3, w: 2,
            async idle(g) { await g.narrate('我和老婆的床。被子是整齊的，好像今天都沒有人躺過。'); },
        },
        {
            id: 'wardrobe', kind: 'inspect', x: 9, y: 2, w: 2,
            async onInteract(g) {
                g.se('creak');
                await g.narrate('想打開大衣櫃看看……');
                await g.say('pa', '噓……你什麼都沒看到。');
                await g.narrate('衣櫃的門「啪」地一聲被關上了。');
                await g.say('dad', '……？');
                g.flag('saw_wardrobe', true);
            },
        },
        { id: 'lamp', kind: 'inspect', x: 2, y: 2, async onInteract(g) { await g.narrate('床頭燈。開關按了沒反應，好像沒電了。'); } },
        { id: 'box_m', kind: 'inspect', x: 1, y: 6, async onInteract(g) { await g.narrate('一個紙箱，裡面都是舊衣服。'); } },
        { id: 'toybox', kind: 'inspect', x: 12, y: 2, async onInteract(g) { await g.narrate('兒子的玩具箱。裡面有積木、小汽車，還有一隻缺了手的恐龍。'); } },
        { id: 'shelf_son', kind: 'inspect', x: 14, y: 2, w: 2, async onInteract(g) { await g.narrate('書架上整整齊齊排著繪本。其中一本封面是「爸爸的公仔」。'); } },
        {
            id: 'drawing_book', kind: 'inspect', x: 19, y: 3,
            async onInteract(g) {
                g.flag('saw_book', true);
                const order = FIGURINE_ORDER.map((id) => FIGURINES.find((f) => f.id === id).label).join('　');
                await g.narrate('桌上攤開著兒子的畫冊，這一頁畫著爸爸收藏的公仔，由左到右排成一排：');
                await g.narrate(`「${order}」`);
                await g.narrate('旁邊寫了一行歪歪扭扭的字：「公仔要照順序排好喔，爸爸最愛的公仔櫃！」');
                if (!g.has('home_gatekey')) g.setObjective('去 3F 的公仔房，照畫冊把公仔排好');
            },
        },
        { id: 'to3f', kind: 'exit', x: 1, y: 10, to: 'home_3f', tx: 2, ty: 10, dir: 'right', sfx: 'footstep' },
        { id: 'to1f', kind: 'exit', x: 20, y: 10, to: 'home_1f', tx: 19, ty: 10, dir: 'left', sfx: 'footstep' },
    ],
};

// ---------- 3F：公仔房 (展示櫃)、陽台 ----------
const rows3f = [
    rep('#', 22),
    '#' + 'WWWWWwWWWWWWWW' + '#' + 'WWWWW' + '#',
    '#' + '.fff.ffff.ffg.' + '#' + 'p...p' + '#',
    '#' + rep('.', 14) + '#' + rep('.', 5) + '#',
    '#' + rep('.', 14) + '#' + rep('.', 5) + '#',
    '#' + rep('.', 14) + '.' + rep('.', 5) + '#',
    '#' + '...b..........' + '#' + rep('.', 5) + '#',
    '#' + rep('.', 14) + '#' + rep('.', 5) + '#',
    '#' + '######.#######' + '#' + '#####' + '#',
    '#' + rep('.', 20) + '#',
    '#' + 'V' + rep('.', 19) + '#',
    '#' + rep('.', 20) + '#',
    rep('#', 22),
];

async function solveFigurines(g) {
    if (g.flag('cabinet_open')) {
        await g.narrate('公仔都整整齊齊地排好了。展示櫃底層的暗格已經空了。');
        return;
    }
    const ok = await g.arrange({
        title: '排列公仔',
        hint: g.flag('saw_book') ? '照兒子畫冊上的順序排好' : '公仔被人打亂了……好像有一本畫冊可以參考',
        items: FIGURINES.map((f) => ({ id: f.id, label: f.label })),
        slots: FIGURINE_ORDER.length,
        answer: FIGURINE_ORDER,
        start: FIGURINE_START,
    });
    if (!ok) return;
    g.flag('cabinet_open', true);
    g.se('door_open');
    await g.narrate('「喀」的一聲，展示櫃底層的暗格彈開了！');
    g.give('home_gatekey');
    await g.say('dad', '是大門的鑰匙！原來被藏在這裡！');
    g.setObjective('帶著鑰匙下樓，打開大門');
    // 燈光閃爍，老鬼從公仔櫃後面站起來
    for (let i = 0; i < 3; i++) { g.flash(0.15); await g.wait(0.25); }
    g.se('ghost');
    g.shake(0.6, 2);
    await g.narrate('公仔櫃後面，有什麼東西慢慢地站了起來……');
    await g.say('dad', '白頭髮……還拄著拐杖……是那個老鬼！');
    g.startChase(5, 3, { stage: 3, grace: 1.5 });
}

const home3f = {
    id: 'home_3f',
    name: '家 3F　公仔房',
    bgm: 'day3',
    legend: LEGEND,
    rows: rows3f,
    dark: 0.3,
    entities: [
        {
            id: 'big_case', kind: 'inspect', x: 7, y: 2, w: 2,
            onInteract: solveFigurines,
        },
        ...[[2, 3], [6, 1], [9, 1], [11, 2]].map(([x, w], i) => ({
            id: 'case' + i, kind: 'inspect', x, y: 2, w,
            async onInteract(g) {
                await g.narrate(['玻璃櫃裡擺滿了公仔，每一隻都擦得亮晶晶的。', '這隻是限量版的！老婆說我花了不少錢買。', '公仔們的眼睛好像都在盯著我看……'][i % 3]);
            },
        })),
        {
            id: 'pose_slot', kind: 'hide', hide: { type: 'pose' }, x: 13, y: 2,
            async idle(g) { await g.narrate('展示櫃裡有一個空位。……我站進去的話，看起來會不會像公仔？'); },
        },
        { id: 'balloons3', kind: 'inspect', x: 4, y: 6, async onInteract(g) { await g.narrate('一串已經吹好的氣球，綁在書桌腳上。……氣球？為什麼這裡會有氣球？'); } },
        { id: 'plant3', kind: 'inspect', x: 16, y: 2, async onInteract(g) { await g.narrate('陽台的盆栽。老婆每天都有澆水。'); } },
        { id: 'to2f', kind: 'exit', x: 1, y: 10, to: 'home_2f', tx: 2, ty: 10, dir: 'right', sfx: 'footstep' },
    ],
};

// ---------- 玄關：結局 ----------

async function doorChoice(g) {
    // 追逐在這一刻暫停 (劇情腳本執行中老鬼不會動)
    for (;;) {
        const i = await g.choice(['開門逃出去', '回頭'], { text: '大門的鎖已經打開了。老鬼就在背後……' });
        if (i === 0) {
            g.se('locked');
            g.shake(0.4, 2);
            await g.narrate('門把轉不動！好像有人在外面（裡面？）緊緊拉住門把……');
            continue;
        }
        break;
    }
    await finale(g);
}

async function finale(g) {
    g.player.dir = 'up';
    if (g.ghost.active) {
        g.ghost.body.teleport(10, 9, 'down');
        g.ghost.grace = 9999;
        g.ghost.appear = 1;
    } else {
        g.showGhost(10, 9, 3);
    }
    g.bgm('day3');
    await g.narrate('壽星慢慢地轉過身。老鬼就站在他面前。');
    await g.narrate('老鬼拄著拐杖，沒有撲上來，反而露出了一個和藹的微笑。');
    await g.say('dad', '……你是老了一歲的我，對不對？');
    await g.say('dad', '我一直在逃，其實是因為不想承認自己又老了一歲。');
    await g.say('dad', '……老一歲就老一歲吧。');
    await g.fadeOutGhost(1.8);
    g.endChase('script');
    await g.narrate('老鬼的身影慢慢變得透明，消失了。');
    await celebration(g, { live: true });
}

/** 燈全亮、大家跳出來、蛋糕、照片、片尾。live = false 時是從標題重看 (跳過對話) */
async function celebration(g, { live = true } = {}) {
    g.bgm('birthday', { fade: 0.2 });
    g.flash(0.6);
    g.se('success');
    g.flag('reveal', true);
    g.setBigHead(false);
    await g.wait(0.8);
    if (live) {
        await g.say('mom', '老公，生日快樂！！！');
        await g.say('son', '爸爸生日快樂！！！');
        await g.say('fb_dad', '生日快樂！！！');
        await g.say('fb_mom', '生日快樂！！！');
        await g.say('daughter', '叔叔生日快樂！！！');
        await g.say('pa', '生日快樂！！！我在衣櫃裡躲超久，腳都麻了。');
        await g.say('pb', '生日快樂！！！');
        await g.say('dad', '你們……原來都躲在家裡！');
        await g.say('fb_dad', '門把是我拉住的啦！');
        await g.say('daughter', '叔叔你被嚇暈了幾次？');
        await g.say('mom', '你這三天一直說有老鬼，我們躲在旁邊都快笑死了。');
        await g.say('son', '爸爸，這是我們一起做的蛋糕！');
    }
    g.setObjective('');
    await g.cake();
    await g.photos();
    await g.credits();
    meta.set({ cleared: true });
    g.endChase('abort');
    g.ghost.despawn();
    g.flag('reveal', false);
    g.mode = 'idle';
    g.onTitle && g.onTitle();
}

// ---------- 開場 ----------

async function intro(g) {
    await g.card('Day 3', '回到家');
    await g.narrate('旅行的最後一天，大家平安地回到了家。壽星的臉也消腫了，只是整個人還很疲倦。');
    await g.say('mom', '你的臉才剛消腫，今天就好好在家休息，什麼都不要做喔。');
    await g.say('son', '爸爸，我和媽媽去幫你買點好吃的，你先睡一下！');
    await g.say('dad', '好～～我就躺一下下。');
    g.player.dir = 'up';
    await g.fade(true, 1);
    g.flag('d3_alone', true);
    await g.narrate('不知道過了多久……');
    g.loadMap('home_1f', 3, 5, 'up');
    await g.fade(false, 1);
    await g.say('dad', '……嗯？天怎麼黑了？我睡了多久？');
    await g.say('dad', '老婆？兒子？……怎麼家裡一個人都沒有。');
    await g.narrate('家裡靜悄悄的，只有時鐘的滴答聲。');
    await g.say('dad', '手機也沒訊號……先找找看大家在哪裡吧。');
    g.setObjective('找到老婆和兒子。大門鑰匙好像不見了');
}

export const day3 = {
    id: 'day3',
    title: 'Day 3　透天厝',
    maps: { home_1f: home1f, home_2f: home2f, home_3f: home3f },
    preset: { items: [], flags: { saw_book: false }, objective: '找到老婆和兒子' },
    onLoad(g) {
        g.faintRestart = null;
    },
    async start(g, { skipIntro = false } = {}) {
        g.state.chapter = 'day3';
        g.state.flags.d3_alone = false;
        g.state.flags.reveal = false;
        g.setBigHead(false);
        g.loadMap('home_1f', 3, 5, 'up');
        g.bgm('day3');
        g.setCheckpoint();
        if (skipIntro) {
            g.flag('d3_alone', true);
            g.setObjective('找到老婆和兒子。大門鑰匙好像不見了');
            g.autosave();
            return;
        }
        await g.fadeInIfDark();
        await g.runScript(() => intro(g));
        g.autosave(); // Day 3 開頭 (醒來、開始自由探索的位置) 自動存檔
    },
    /** 從標題「重看結局」進入：直接播放慶生、照片、片尾 */
    async replay(g) {
        g.state.chapter = 'day3';
        g.state.flags.d3_alone = true;
        g.mode = 'play';
        g.loadMap('home_1f', 10, 11, 'up');
        await g.runScript(() => celebration(g, { live: false }));
    },
};
