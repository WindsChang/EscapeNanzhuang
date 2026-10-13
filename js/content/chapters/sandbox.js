// 示範場景：用來測試引擎的各項機制 (移動、對話、謎題、追逐、躲藏、存檔)。
// 正式章節完成後仍保留，讓除錯模式可以快速測試。

const LEGEND = {
    '#': 'wall', W: 'wallface', w: 'window', D: 'door', '.': 'wood', ',': 'carpet', U: 'stairsup', V: 'stairsdown',
    S: 'sofa', T: 'table', R: 'fridge', r: 'drawer', m: 'lamp', p: 'plant', a: 'wardrobe', f: 'shelf',
    F: 'futondirty', C: 'curtain', x: 'box', v: 'tv',
};

// 大地圖示範：超過一個畫面的戶外地圖、陡坡減速、限時倒數、蜂群扣時間
const HILL_LEGEND = { ...LEGEND, g: 'grass', d: 'dirt', s: 'slope', t: 'tree', b: 'bush', ':': 'tuft', k: 'rock', z: 'sign', n: 'bees' };

function buildHill() {
    const W = 40;
    const H = 28;
    const ground = [];
    const objects = [];
    for (let y = 0; y < H; y++) {
        let g = '';
        let o = '';
        for (let x = 0; x < W; x++) {
            const onPath = Math.abs(y - 13) <= 1;
            let gc = onPath ? (x >= 15 && x <= 22 ? 's' : 'd') : 'g';
            let oc = '.';
            if (x === 0 || y === 0 || x === W - 1 || y === H - 1) oc = 't';
            else if (!onPath && (x * 7 + y * 13) % 9 === 0) oc = (x + y) % 2 ? 't' : 'b';
            else if (!onPath && (x * 5 + y * 3) % 11 === 0) oc = ':';
            else if (!onPath && (x * 3 + y * 17) % 23 === 0) oc = 'k';
            if (onPath) gc = x >= 15 && x <= 22 ? 's' : 'd';
            g += gc;
            o += oc;
        }
        ground.push(g);
        objects.push(o);
    }
    const put = (x, y, c) => { objects[y] = objects[y].slice(0, x) + c + objects[y].slice(x + 1); };
    put(4, 11, 'z');
    put(29, 12, 'n');
    put(30, 14, 'n');
    return {
        id: 'sandbox_hill',
        name: '示範山路',
        bgm: 'day2',
        legend: HILL_LEGEND,
        ground,
        objects,
        entities: [
            { id: 'hill_sign', kind: 'inspect', x: 4, y: 11, async onInteract(g) { await g.narrate('告示牌：往東走到 (38,13) 就是終點。陡坡會讓人走得比較慢，蜂群會扣時間。'); } },
            { id: 'hill_back', kind: 'exit', x: 1, y: 13, to: 'sandbox_2f', tx: 8, ty: 4, dir: 'left', sfx: 'door_close', onUse: (g) => g.cancelTimer() },
            {
                id: 'bees', kind: 'trigger', once: false, x: 28, y: 13, w: 3, h: 1,
                onEnter(g) { g.addTime(-5); g.se('sting'); g.floatText('被蜜蜂叮了！-5 秒'); },
            },
            {
                id: 'goal', kind: 'trigger', x: 38, y: 13,
                async onEnter(g) {
                    g.cancelTimer();
                    g.flag('hill_done', true);
                    await g.narrate('抵達終點了！');
                },
            },
        ],
    };
}

const map1f = {
    id: 'sandbox_1f',
    name: '示範房間 1F',
    bgm: 'day1',
    legend: LEGEND,
    ground: [
        '####################',
        '#WWWwWWWW#WWWWwWWWW#',
        '#,,,,,,,,#.......U.#',
        '#,,,,,,,,#.........#',
        '#,,,,,,,,#.........#',
        '#,,,,,,,,D.........#',
        '#,,,,,,,,#.........#',
        '#,,,,,,,,#.........#',
        '#,,,,,,,,#.........#',
        '#,,,,,,,,#.........#',
        '####################',
    ],
    objects: [
        '....................',
        '....................',
        '.mSSv..r...aa.ff....',
        '....................',
        '....................',
        '....................',
        '.....T..............',
        '....................',
        '......FF.....xx.....',
        '.pCC.............p..',
        '....................',
    ],
    entities: [
        {
            id: 'mom', kind: 'npc', char: 'mom', x: 4, y: 6, dir: 'down',
            async onInteract(g) {
                await g.say('mom', '你醒啦？這裡是示範場景，可以測試各種機制喔。');
                for (;;) {
                    const i = await g.choice(['怎麼玩？', '櫃子的密碼是什麼？', '沒事'], { who: 'mom', text: '有什麼想問的嗎？' });
                    if (i === 0) await g.say('mom', ['方向鍵或搖桿移動，確認鍵調查東西。', 'Esc 或選單鍵可以叫出選單存檔。', '被鬼追的時候可以躲進棉被、窗簾，或假裝成公仔。']);
                    else if (i === 1) await g.say('mom', '桌上好像有張便條紙，你去看看。');
                    else break;
                }
            },
        },
        {
            id: 'tv', kind: 'inspect', x: 4, y: 2,
            async onInteract(g) { await g.narrate('電視在播雪花畫面，沙沙沙……'); },
        },
        {
            id: 'note', kind: 'inspect', x: 5, y: 6,
            async onInteract(g) {
                if (!g.has('sandbox_note')) g.give('sandbox_note');
                await g.narrate('桌上有一張便條紙：「櫃子的密碼是 1234」。');
            },
        },
        {
            id: 'drawer', kind: 'inspect', x: 7, y: 2,
            async onInteract(g) {
                if (g.flag('drawer_opened')) { await g.narrate('抽屜已經空了。'); return; }
                const ok = await g.code({ answer: '1234', title: '抽屜的密碼鎖', hint: '輸入 4 位數字' });
                if (!ok) return;
                g.flag('drawer_opened', true);
                g.give('sandbox_key');
                await g.narrate('抽屜打開了，裡面有一把鑰匙！');
                g.setObjective('用鑰匙打開房間的門');
            },
        },
        {
            id: 'lockdoor', kind: 'inspect', solid: true, x: 9, y: 5,
            when: (g) => !g.flag('door_open'),
            async onInteract(g) {
                if (g.has('sandbox_key')) {
                    g.flag('door_open', true);
                    g.se('door_open');
                    await g.narrate('用鑰匙打開了門。');
                    g.setObjective('去右邊房間找藥膏');
                } else {
                    g.se('locked');
                    await g.narrate('門鎖住了，需要鑰匙。');
                }
            },
        },
        { id: 'futon', kind: 'hide', hide: { type: 'futon' }, x: 6, y: 8, w: 2, h: 1 },
        { id: 'curtain', kind: 'hide', hide: { type: 'curtain' }, x: 2, y: 9, w: 2, h: 1 },
        {
            id: 'wardrobe', kind: 'inspect', x: 11, y: 2, w: 2, h: 1,
            async onInteract(g) {
                const i = await g.choice(['老鬼 (白頭髮)', '老鬼 (皺紋眼鏡)', '老鬼 (拄拐杖)', '算了'], { text: '衣櫃裡傳來怪聲…要叫出老鬼測試追逐嗎？' });
                if (i === 3) return;
                g.flag('ghost_stage', i + 1);
                await g.narrate('衣櫃的門慢慢打開了……');
                g.startChase(11, 3, { stage: i + 1 });
            },
        },
        {
            id: 'shelf', kind: 'inspect', x: 14, y: 2, w: 2,
            async onInteract(g) {
                if (g.has('sandbox_medicine')) { await g.narrate('架上的小東西排得整整齊齊。'); return; }
                const ok = await g.arrange({
                    title: '排列架子上的小東西',
                    hint: '依照「紅、藍、黃」的順序排好',
                    slots: 3,
                    items: [
                        { id: 'y', label: '🟡' }, { id: 'r', label: '🔴' }, { id: 'b', label: '🔵' },
                    ],
                    answer: ['r', 'b', 'y'],
                });
                if (!ok) return;
                g.give('sandbox_medicine');
                await g.narrate('架子後面掉出一條止癢藥膏！');
                g.setObjective('可以去 2F 探索，或叫出老鬼測試躲藏');
            },
        },
        { id: 'pose', kind: 'hide', hide: { type: 'pose' }, x: 18, y: 6 },
        { id: 'to2f', kind: 'exit', x: 17, y: 2, to: 'sandbox_2f', tx: 2, ty: 2, dir: 'right', sfx: 'footstep' },
    ],
};

// 18,6 的公仔架
map1f.objects[6] = '.....T............f.';

const map2f = {
    id: 'sandbox_2f',
    name: '示範房間 2F',
    bgm: 'day3',
    legend: LEGEND,
    ground: [
        '##########',
        '#WWWwWWWW#',
        '#V.......#',
        '#........#',
        '#.......DD',
        '#........#',
        '#........#',
        '##########',
    ],
    objects: [
        '..........',
        '..........',
        '.....ff...',
        '......FF..',
        '..........',
        '..........',
        '...C..x...',
        '..........',
    ],
    entities: [
        { id: 'to1f', kind: 'exit', x: 1, y: 2, to: 'sandbox_1f', tx: 17, ty: 3, dir: 'down', sfx: 'footstep' },
        {
            id: 'to_hill', kind: 'exit', x: 9, y: 4, to: 'sandbox_hill', tx: 2, ty: 13, dir: 'right', sfx: 'door_open',
            onUse: (g) => { if (!g.flag('hill_done')) g.startTimer(45); },
        },
        { id: 'futon2', kind: 'hide', hide: { type: 'futon' }, x: 6, y: 3, w: 2, h: 1 },
        { id: 'curtain2', kind: 'hide', hide: { type: 'curtain' }, x: 3, y: 6 },
        { id: 'pose2', kind: 'hide', hide: { type: 'pose' }, x: 5, y: 2, w: 2 },
        {
            id: 'box2', kind: 'inspect', x: 6, y: 6,
            async onInteract(g) { await g.narrate('空紙箱，什麼都沒有。'); },
        },
    ],
};

export const sandbox = {
    id: 'sandbox',
    title: '示範場景',
    maps: { sandbox_1f: map1f, sandbox_2f: map2f, sandbox_hill: buildHill() },
    preset: { items: [], flags: {}, objective: '找到打開門的方法' },
    async start(g, { skipIntro = false } = {}) {
        g.state.chapter = 'sandbox';
        g.loadMap('sandbox_1f', 4, 7, 'down');
        g.setObjective('找到打開門的方法');
        g.autosave();
        if (skipIntro) return;
        await g.runScript(async () => {
            await g.narrate('這裡是示範場景，用來測試遊戲的各種機制。');
            await g.say('dad', '咦，這是哪裡…？先到處看看吧。');
        });
    },
};
