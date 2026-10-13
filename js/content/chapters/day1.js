// Day 1：旅館大通鋪
//   開場：搬棉被、試蓋起紅疹 -> 洗澡時門外說了「XXXX」(壽星沒聽清楚) -> 出來大家都不見了
//   謎題：交誼廳線索 -> 櫃台抽屜密碼 -> 廚房鑰匙 -> 藥膏 -> 2F 棉被間的大門鑰匙 (老鬼從棉被堆爬出來)
//   結局：大家提著鹹酥雞站在門口，回放洗澡時的完整對話

const rep = (c, n) => c.repeat(n);

const LEGEND = {
    '#': 'wall', W: 'wallface', w: 'window', D: 'door', '.': 'wood', t: 'tatami', i: 'tile', ',': 'carpet',
    U: 'stairsup', V: 'stairsdown',
    F: { g: 'tatami', o: 'futondirty' }, G: { g: 'wood', o: 'futondirty' }, x: { g: 'wood', o: 'box' },
    K: { g: 'tile', o: 'sink' }, N: { g: 'tile', o: 'toilet' }, B: { g: 'tile', o: 'bathtub' },
    c: { g: 'carpet', o: 'counter' }, q: { g: 'carpet', o: 'drawer' }, p: { g: 'carpet', o: 'plant' }, C: { g: 'carpet', o: 'curtain' },
    v: { g: 'wood', o: 'tv' }, S: { g: 'wood', o: 'sofa' }, T: { g: 'wood', o: 'table' }, r: { g: 'wood', o: 'rack' },
    P: { g: 'wood', o: 'plant' }, Q: { g: 'wood', o: 'curtain' },
    R: { g: 'tile', o: 'fridge' }, s: { g: 'tile', o: 'stove' }, a: { g: 'tile', o: 'cabinet' }, k: { g: 'tile', o: 'counter' }, y: { g: 'tile', o: 'table' },
    // 戶外
    g: 'grass', d: 'dirt', n: 'concrete', z: { g: 'grass', o: 'tree' },
};

// ---------- 2F：大通鋪、棉被間、走廊、浴室 ----------
const rows2f = [
    rep('#', 24),
    '#' + 'WWWWWwWWWWWWWW' + '#' + 'WWwWWWW' + '#',
    '#' + rep('t', 14) + '#' + rep('.', 7) + '#',
    '#' + 'tttFtFtFtFtttt' + '#' + '.GG.GG.' + '#',
    '#' + rep('t', 14) + '#' + '......x' + '#',
    '#' + rep('t', 14) + '#' + '.GG.GG.' + '#',
    '#' + 'tttFtFtFtFtttt' + '#' + rep('.', 7) + '#',
    '#' + rep('t', 14) + '#' + rep('.', 7) + '#',
    '#' + rep('#', 6) + 'D' + rep('#', 7) + '#' + '###' + 'D' + '####',
    '#' + rep('.', 21) + 'V' + '#',
    '#' + rep('.', 22) + '#',
    '#' + '##' + 'D' + rep('#', 20),
    '#' + 'KiiiiiBB' + rep('#', 15),
    '#' + 'iiiiiiiN' + rep('#', 15),
    rep('#', 24),
];

const FUTONS = [[4, 3], [6, 3], [8, 3], [10, 3], [4, 6], [6, 6], [8, 6], [10, 6]];
const PILES = [[17, 3], [18, 3], [20, 3], [21, 3], [17, 5], [18, 5], [20, 5], [21, 5]];

function futonEntities() {
    return FUTONS.map(([x, y], i) => ({
        id: 'futon' + i, kind: 'hide', hide: { type: 'futon' }, x, y,
        async idle(g) {
            g.se('sneeze');
            g.floatText('哈啾！');
            await g.narrate(i % 2 ? '髒髒的棉被，一靠近皮膚就開始發癢……' : '棉被有一股霉味。我還是別碰比較好。');
        },
    }));
}

const hotel2f = {
    id: 'hotel_2f',
    name: '旅館 2F',
    bgm: 'day1',
    legend: LEGEND,
    rows: rows2f,
    entities: [
        // 開場時在大通鋪裡的 7 位同伴 (壽星洗完澡後全部消失)
        { id: 'mom', kind: 'npc', char: 'mom', x: 5, y: 5, dir: 'down', when: (g) => !g.flag('d1_alone') },
        { id: 'son', kind: 'npc', char: 'son', x: 7, y: 4, dir: 'down', when: (g) => !g.flag('d1_alone') },
        { id: 'fb_dad', kind: 'npc', char: 'fb_dad', x: 9, y: 5, dir: 'left', when: (g) => !g.flag('d1_alone') },
        { id: 'fb_mom', kind: 'npc', char: 'fb_mom', x: 11, y: 5, dir: 'left', when: (g) => !g.flag('d1_alone') },
        { id: 'daughter', kind: 'npc', char: 'daughter', x: 12, y: 3, dir: 'down', when: (g) => !g.flag('d1_alone') },
        { id: 'pa', kind: 'npc', char: 'pa', x: 3, y: 4, dir: 'right', when: (g) => !g.flag('d1_alone') },
        { id: 'pb', kind: 'npc', char: 'pb', x: 13, y: 5, dir: 'left', when: (g) => !g.flag('d1_alone') },

        ...futonEntities(),
        ...PILES.map(([x, y], i) => ({
            id: 'pile' + i, kind: 'inspect', x, y,
            async onInteract(g) { g.se('sneeze'); await g.narrate('一大堆舊棉被，灰塵都飄起來了……哈啾！'); },
        })),
        {
            id: 'bathtub', kind: 'inspect', x: 7, y: 12, w: 2,
            async onInteract(g) { await g.narrate('浴缸裡的水已經涼了。'); },
        },
        { id: 'sink', kind: 'inspect', x: 1, y: 12, async onInteract(g) { await g.narrate('洗手台上的鏡子起霧了，什麼也看不清楚。'); } },
        { id: 'toilet', kind: 'inspect', x: 8, y: 13, async onInteract(g) { await g.narrate('……現在不是上廁所的時候。'); } },
        {
            id: 'storagebox', kind: 'inspect', x: 22, y: 4,
            async onInteract(g) {
                if (g.has('day1_gatekey')) { await g.narrate('收納箱已經空了。'); return; }
                await g.say('dad', '收納箱裡……有一把備用的大門鑰匙！');
                g.give('day1_gatekey');
                g.setObjective('帶著鑰匙下樓，打開旅館大門');
                await g.narrate('……沙沙……沙沙沙……');
                g.shake(0.6, 2);
                g.se('ghost');
                await g.narrate('棉被堆裡有什麼東西在動！');
                // 老鬼 (白頭髮) 從棉被堆爬出來，第一次登場
                g.startChase(16, 3, { stage: 1, grace: 1.6 });
                await g.say('dad', '那、那是什麼……長得跟我好像……？！');
            },
        },
        { id: 'to1f', kind: 'exit', x: 22, y: 9, to: 'hotel_1f', tx: 21, ty: 10, dir: 'left', sfx: 'footstep' },
    ],
};

// ---------- 1F：櫃台、交誼廳、廚房、大廳、上鎖的大門 ----------
const rows1f = [
    rep('#', 24),
    '#' + 'WWWWwWWW' + '#' + 'WWWWWwWW' + '#' + 'WWWW' + '#',
    '#' + 'p,,,,,,p' + '#' + 'vPPPPPPP' + '#' + 'RsaK' + '#',
    '#' + ',ccccq,,' + '#' + 'SSv..rP.' + '#' + 'iiii' + '#',
    '#' + rep(',', 8) + '#' + '....T...' + '#' + 'iiii' + '#',
    '#' + rep(',', 8) + '#' + rep('.', 8) + '#' + 'iiyi' + '#',
    '#' + rep(',', 8) + '#' + rep('.', 8) + '#' + 'iiii' + '#',
    '#' + rep(',', 8) + '#' + rep('.', 8) + '#' + 'iiii' + '#',
    '#' + '###' + 'D' + '####' + '#' + '###' + 'D' + '####' + '#' + '#' + 'D' + '##' + '#',
    '#' + rep('.', 22) + '#',
    '#' + rep('.', 21) + 'U' + '#',
    '#' + rep('.', 22) + '#',
    rep('#', 11) + 'D' + rep('#', 12),
];
// 交誼廳的物件重新排：電視 (11,2)、沙發 (10,3)(11,3)、桌 (14,4)、傳單架 (15,3)、窗簾 (17,2)
rows1f[2] = '#' + 'p,,,,,Cp' + '#' + 'Pv..PPQ.' + '#' + 'RsaK' + '#';
rows1f[3] = '#' + ',ccccq,,' + '#' + 'SS..r...' + '#' + 'iiii' + '#';

const hotel1f = {
    id: 'hotel_1f',
    name: '旅館 1F',
    bgm: 'day1',
    legend: LEGEND,
    rows: rows1f,
    entities: [
        {
            id: 'registry', kind: 'inspect', x: 3, y: 3,
            async onInteract(g) {
                g.flag('clue_room', true);
                await g.narrate('住宿登記簿：「大通鋪　8 位　房號 206」。……我們住的是 206 房。');
            },
        },
        {
            id: 'bell', kind: 'inspect', x: 2, y: 3,
            async onInteract(g) { g.se('select'); await g.narrate('叮～　櫃台的服務鈴。沒有人回應。'); },
        },
        {
            id: 'tv', kind: 'inspect', x: 11, y: 2,
            async onInteract(g) {
                g.flag('clue_channel', true);
                await g.narrate('電視開著，播著沒什麼人看的節目。畫面角落有個大大的「8」。……第 8 台。');
            },
        },
        {
            id: 'flyer', kind: 'inspect', x: 14, y: 3,
            async onInteract(g) {
                g.flag('clue_flyer', true);
                await g.narrate('旅館傳單：「櫃台抽屜的密碼，是『房號』加上『電視頻道』。」……房號、頻道，嗯。');
            },
        },
        {
            id: 'sofa', kind: 'inspect', x: 10, y: 3, w: 2,
            async onInteract(g) { await g.narrate('沙發上的彈簧好像壞掉了，坐下去會陷進去。'); },
        },
        {
            id: 'drawer', kind: 'inspect', x: 6, y: 3,
            async onInteract(g) {
                if (g.flag('drawer_opened')) { await g.narrate('抽屜已經空了。'); return; }
                const clues = [g.flag('clue_room') ? '房號 206' : '？', g.flag('clue_channel') ? '頻道 8' : '？', g.flag('clue_flyer') ? '傳單有寫提示' : '？'];
                const ok = await g.code({ answer: '2068', title: '櫃台抽屜的密碼鎖', hint: `四位數字。線索：${clues.join(' / ')}` });
                if (!ok) return;
                g.flag('drawer_opened', true);
                g.give('day1_kitchen_key');
                g.se('door_open');
                await g.narrate('抽屜打開了！裡面有一把「廚房」的鑰匙。');
                g.setObjective('用鑰匙打開廚房，找找看有沒有藥膏');
            },
        },
        // 窗簾 (可躲藏)
        {
            id: 'curtain_lounge', kind: 'hide', hide: { type: 'curtain' }, x: 16, y: 2,
            async idle(g) { await g.narrate('窗簾後面什麼都沒有，只有一堆灰塵。'); },
        },
        // 廚房的門 (需要廚房鑰匙)
        {
            id: 'kitchen_lock', kind: 'inspect', solid: true, x: 20, y: 8,
            when: (g) => !g.flag('kitchen_open'),
            async onInteract(g) {
                if (g.has('day1_kitchen_key')) {
                    g.flag('kitchen_open', true);
                    g.se('door_open');
                    await g.narrate('用廚房鑰匙打開了門。');
                } else {
                    g.se('locked');
                    await g.narrate('廚房的門鎖住了。需要鑰匙。');
                }
            },
        },
        {
            id: 'fridge', kind: 'inspect', x: 19, y: 2,
            async onInteract(g) {
                g.flag('note_gatekey', true);
                await g.narrate('冰箱門上貼著一張便條：「備用大門鑰匙，放在二樓棉被間的收納箱裡。」');
                if (g.has('day1_ointment') && !g.has('day1_gatekey')) g.setObjective('上 2F 的棉被間，找備用大門鑰匙');
            },
        },
        { id: 'stove', kind: 'inspect', x: 20, y: 2, async onInteract(g) { await g.narrate('瓦斯爐是冷的，鍋子裡什麼都沒有。'); } },
        {
            id: 'medbox', kind: 'inspect', x: 21, y: 2,
            async onInteract(g) {
                if (g.has('day1_ointment')) { await g.narrate('藥箱裡只剩下一些過期的 OK 繃。'); return; }
                g.give('day1_ointment');
                await g.narrate('藥箱裡有一條止癢藥膏！擦在手臂上，紅疹立刻涼涼的，沒那麼癢了。');
                g.setObjective(g.flag('note_gatekey') ? '上 2F 的棉被間，找備用大門鑰匙' : '找到旅館的大門鑰匙');
            },
        },
        { id: 'sink1f', kind: 'inspect', x: 22, y: 2, async onInteract(g) { await g.narrate('水龍頭滴答、滴答地漏水。'); } },
        { id: 'table_k', kind: 'inspect', x: 21, y: 5, async onInteract(g) { await g.narrate('桌上放著幾個空碗，好像剛吃過什麼的樣子。'); } },
        // 櫃台旁的窗簾 (可躲藏)
        {
            id: 'curtain_counter', kind: 'hide', hide: { type: 'curtain' }, x: 7, y: 2,
            async idle(g) { await g.narrate('櫃台旁的窗簾。拉開來也只有一面牆。'); },
        },
        // 大門：需要大門鑰匙與藥膏才會離開 Day 1
        {
            id: 'front_door', kind: 'inspect', solid: true, x: 11, y: 12,
            async onInteract(g) {
                if (!g.has('day1_gatekey')) {
                    g.se('locked');
                    await g.narrate('大門鎖得緊緊的。需要鑰匙。');
                    return;
                }
                if (!g.has('day1_ointment')) {
                    await g.narrate('手臂還是好癢……先把藥膏找來擦一擦吧。');
                    return;
                }
                await endOfDay1(g);
            },
        },
        { id: 'to2f', kind: 'exit', x: 22, y: 10, to: 'hotel_2f', tx: 21, ty: 9, dir: 'left', sfx: 'footstep' },
    ],
};

// ---------- 旅館門外 (結局) ----------
const front = {
    id: 'hotel_front',
    name: '旅館門口',
    bgm: 'prologue',
    legend: LEGEND,
    rows: [
        'zgggggggggggzg',
        'ggzgggggzggggg',
        'dddddddddddddd',
        'nnnnnnnnnnnnnn',
        'nnnnnnnnnnnnnn',
        'nnnnnnnnnnnnnn',
        'nnnnnnnnnnnnnn',
    ],
    entities: [
        { id: 'mom', kind: 'npc', char: 'mom', x: 4, y: 4, dir: 'down' },
        { id: 'son', kind: 'npc', char: 'son', x: 5, y: 4, dir: 'down' },
        { id: 'fb_dad', kind: 'npc', char: 'fb_dad', x: 6, y: 4, dir: 'down' },
        { id: 'fb_mom', kind: 'npc', char: 'fb_mom', x: 7, y: 4, dir: 'down' },
        { id: 'daughter', kind: 'npc', char: 'daughter', x: 8, y: 4, dir: 'down' },
        { id: 'pa', kind: 'npc', char: 'pa', x: 9, y: 4, dir: 'down' },
        { id: 'pb', kind: 'npc', char: 'pb', x: 10, y: 4, dir: 'down' },
    ],
};
async function endOfDay1(g) {
    g.endChase('script');
    g.ghost.despawn();
    g.se('door_open');
    await g.fade(true, 0.4);
    g.loadMap('hotel_front', 7, 3, 'down');
    g.bgm('prologue');
    await g.fade(false, 0.4);
    await g.say('fb_dad', '欸！你終於洗完啦？你洗太久了啦！');
    await g.say('pa', '我們都已經出去、回來了欸！');
    g.floatText('🍗🍗🍗');
    await g.say('dad', '……出去？你們剛才出門了？');
    await g.say('mom', '對啊，我們出門前有跟你說啊！');
    await g.say('dad', '有嗎？我怎麼不記得……');
    await g.fade(true, 0.6);
    await g.narrate('（回想中……）');
    g.se('water');
    await g.say('mom', '欸～ 我們去買鹹酥雞喔～ 你要吃什麼？');
    await g.say('dad', '好～～～');
    await g.fade(false, 0.6);
    await g.say('daughter', '叔叔你不是回答「好」嗎？');
    await g.say('fb_mom', '趁熱吃啦！鹹酥雞冷了就不好吃了。');
    await g.say('dad', '……原來是這樣。是我自己沒有聽清楚。');
    await g.narrate('壽星回頭看了一眼旅館。剛才追著他跑的老鬼，已經不見了。');
    await g.say('dad', '……真的是我的錯覺嗎？');
    g.state.items.length = 0; // 旅館的鑰匙與藥膏用完了
    await g.fade(true, 0.8);
    await g.startChapter('day2');
}

// ---------- 開場：抵達、紅疹、洗澡 ----------
async function intro(g) {
    await g.card('Day 1', '抵達旅館');
    await g.narrate('今天住的是一間老旅館的大通鋪，八個人要擠在同一個房間睡覺。');
    await g.say('fb_mom', '這些棉被……是從那間儲藏室搬出來的吧？好像很久沒洗了。');
    await g.say('pa', '有股霉味欸。');
    g.face('mom', 'down');
    await g.say('dad', '沒事啦，蓋一下就習慣了。我先試試看。');
    g.player.dir = 'up';
    g.se('cloth');
    await g.wait(0.8);
    g.se('itch');
    g.shake(0.4, 1);
    await g.wait(0.6);
    await g.narrate('壽星的手臂上，一顆一顆地冒出了紅疹！');
    await g.say('mom', '你皮膚很敏感耶！先去洗個澡，等下記得擦藥。');
    await g.say('dad', '藥……不知道被我塞到哪裡去了。');
    await g.say('fb_dad', '洗完澡再找啦，我們先整理行李。');
    await g.say('dad', '好吧，那我先去沖個澡。');
    await g.fade(true, 0.6);
    // 洗澡：只有水聲，門外有人說話 (內容不透露)
    g.se('water');
    await g.narrate('（嘩啦啦啦啦……）');
    await g.say('mom', '欸～ XXXX 喔～');
    await g.say('dad', '好～～～');
    await g.wait(0.6);
    await g.narrate('（水聲持續了很久……）');
    g.flag('d1_alone', true);
    g.loadMap('hotel_2f', 3, 12, 'up');
    await g.fade(false, 0.6);
    await g.say('dad', '呼～洗得好舒服。咦？怎麼這麼安靜？');
    await g.moveActor('player', [{ x: 3, y: 11 }, { x: 3, y: 10 }]);
    await g.say('dad', '大通鋪……空空的？大家都跑去哪了？');
    g.setObjective('找到大家');
}

export const day1 = {
    id: 'day1',
    title: 'Day 1　旅館',
    maps: { hotel_2f: hotel2f, hotel_1f: hotel1f, hotel_front: front },
    preset: { items: [], flags: {}, objective: '找到大家' },
    async start(g, { skipIntro = false } = {}) {
        g.state.chapter = 'day1';
        g.state.flags.d1_alone = false;
        g.loadMap('hotel_2f', 7, 7, 'up');
        g.setBigHead(false);
        g.setCheckpoint();
        g.bgm('day1');
        if (skipIntro) {
            g.flag('d1_alone', true);
            g.loadMap('hotel_2f', 3, 10, 'down');
            g.autosave();
            return;
        }
        await g.fadeInIfDark();
        await g.runScript(() => intro(g));
        g.autosave(); // Day 1 開頭 (洗完澡、開始自由探索的位置) 自動存檔
    },
};
