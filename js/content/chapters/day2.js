// Day 2：加里山限時下山 + 醫院
//   山頂拍照時被奇怪的蜜蜂叮 -> 臉腫成大頭，開始倒數下山 (岔路：近路有蜂群、遠路比較長)
//   杉木林裡老鬼 (皺紋 + 老花眼鏡) 追逐，森林鐵道的枕木上有夥伴留的提示，到鹿場登山口就送醫
//   醫院：半夜醒來大家不見 -> 阿伯的夢話是置物櫃密碼 -> 消腫藥與安全梯鑰匙 -> 老鬼推著點滴架追逐 -> 便利商店

const rep = (c, n) => c.repeat(n);

// ======================================================================
// 加里山 (縱向長地圖，由山頂往下)
// ======================================================================

const TRAIL_W = 40;
const TRAIL_H = 100;
const TRAIL_LEGEND = {
    g: 'grass', d: 'dirt', s: 'slope', r: 'rails',
    t: { g: 'grass', o: 'tree' }, u: { g: 'grass', o: 'tree2' }, b: { g: 'grass', o: 'bush' }, ':': { g: 'grass', o: 'tuft' },
    k: { g: 'grass', o: 'rock' }, M: { g: 'grass', o: 'summit' }, h: { g: 'grass', o: 'hive' },
    z: { g: 'dirt', o: 'sign' },
};

// 路線 (座標都是格子)：
//   山頂平台 -> 陡坡 (來回折返 7 段) -> 在 (29,50) 分岔 ->
//   近路：直走，路上有兩處蜂群 / 遠路：先往西再繞回來，比較長
//   -> (29,70) 匯合 -> 杉木林 -> 森林鐵道 -> 鹿場登山口 (29,95)
export const TRAIL = {
    start: { x: 19, y: 7 },
    fork: { x: 29, y: 50 },
    ambush: { x: 29, y: 74 },
    goal: { x: 29, y: 95 },
    beeNear: [{ x: 29, y: 56 }, { x: 29, y: 62 }],
};

function buildTrail() {
    const cells = Array.from({ length: TRAIL_H }, () => Array(TRAIL_W).fill('u'));
    const carve = (x1, y1, x2, y2, ch) => {
        for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) cells[y][x] = ch;
    };
    // 樹木變化 (決定性的雜湊，不用亂數，地圖每次都一樣)
    for (let y = 0; y < TRAIL_H; y++) {
        for (let x = 0; x < TRAIL_W; x++) {
            const h = (x * 31 + y * 17) % 11;
            if (h === 0 || h === 7) cells[y][x] = 't';
            else if (h === 5) cells[y][x] = 'b';
        }
    }
    // 山頂平台
    carve(6, 1, 33, 9, 'g');
    for (const [x, y] of [[8, 2], [11, 7], [24, 8], [27, 2], [14, 3], [32, 6]]) cells[y][x] = ':';
    cells[3][19] = 'M'; // 三角點
    cells[3][30] = 'h'; // 蜂窩
    cells[2][8] = 'k';
    // 陡坡 (折返 7 段)
    carve(18, 10, 20, 19, 's');
    carve(18, 19, 33, 21, 's');
    carve(31, 21, 33, 30, 's');
    carve(10, 29, 33, 31, 's');
    carve(10, 31, 12, 40, 's');
    carve(10, 39, 30, 41, 's');
    carve(28, 41, 30, 50, 's');
    // 岔路口前的小平台
    carve(26, 48, 32, 52, 'd');
    // 近路 (直走)
    carve(28, 52, 30, 70, 'd');
    // 遠路 (往西繞一大圈再回來)
    carve(14, 50, 29, 52, 'd');
    carve(14, 52, 16, 70, 'd');
    carve(14, 68, 30, 70, 'd');
    // 匯合後：杉木林 -> 森林鐵道 -> 登山口
    carve(28, 70, 30, 80, 'd');
    carve(28, 80, 30, 91, 'r');
    carve(24, 91, 34, 98, 'd');
    // 路標
    cells[48][27] = 'z'; // 岔路提示
    cells[84][28] = 'z'; // 鐵道上夥伴的提示 (三處)
    cells[87][30] = 'z';
    cells[90][28] = 'z';
    cells[96][26] = 'z'; // 登山口
    const rows = cells.map((r) => r.join(''));
    return rows;
}

const BEE_NEAR_TILES = TRAIL.beeNear.map((p) => ({ x: p.x - 1, y: p.y - 1 }));

const trail = {
    id: 'jiali_trail',
    name: '加里山',
    bgm: 'day2',
    legend: TRAIL_LEGEND,
    rows: buildTrail(),
    entities: [
        // 山頂的同伴 (從被蜂叮到下山時消失)
        { id: 'mom', kind: 'npc', char: 'mom', x: 17, y: 5, dir: 'up', when: (g) => !g.flag('d2_alone') },
        { id: 'son', kind: 'npc', char: 'son', x: 18, y: 5, dir: 'up', when: (g) => !g.flag('d2_alone') },
        { id: 'fb_dad', kind: 'npc', char: 'fb_dad', x: 20, y: 5, dir: 'up', when: (g) => !g.flag('d2_alone') },
        { id: 'fb_mom', kind: 'npc', char: 'fb_mom', x: 21, y: 5, dir: 'up', when: (g) => !g.flag('d2_alone') },
        { id: 'daughter', kind: 'npc', char: 'daughter', x: 17, y: 6, dir: 'up', when: (g) => !g.flag('d2_alone') },
        { id: 'pa', kind: 'npc', char: 'pa', x: 21, y: 6, dir: 'up', when: (g) => !g.flag('d2_alone') },
        { id: 'pb', kind: 'npc', char: 'pb', x: 22, y: 5, dir: 'up', when: (g) => !g.flag('d2_alone') },
        // 蜜蜂 (被叮的演出)
        ...[[29, 4], [31, 4], [30, 5], [28, 3]].map(([x, y], i) => ({ id: 'swarm' + i, kind: 'prop', tile: 'bees', x, y, when: (g) => g.flag('bees_out') })),
        // 山頂提示
        {
            id: 'summit_marker', kind: 'inspect', x: 19, y: 3,
            async onInteract(g) { await g.narrate('加里山三角點。海拔 1,219 公尺，苗栗人口中的「苗栗富士山」。'); },
        },
        {
            id: 'hive', kind: 'inspect', x: 30, y: 3,
            async onInteract(g) { await g.narrate('樹上掛著一個大蜂窩，嗡嗡嗡的聲音好大……還是別靠太近。'); },
        },
        // 岔路指示牌
        {
            id: 'fork_sign', kind: 'inspect', x: 27, y: 48,
            async onInteract(g) {
                await g.narrate('岔路指示牌：「↓ 近路　比較快，但聽說最近有蜂窩」「← 遠路　繞一大圈，比較安全」');
            },
        },
        // 近路上的蜂群
        ...TRAIL.beeNear.map((p, i) => ({ id: 'bee_zone' + i, kind: 'trigger', once: false, x: p.x - 1, y: p.y, w: 3, h: 1, onEnter: beeSting })),
        ...BEE_NEAR_TILES.flatMap((p, i) => [
            { id: 'beev' + i, kind: 'prop', tile: 'bees', x: p.x + 1, y: p.y + 1 },
            { id: 'beev2_' + i, kind: 'prop', tile: 'bees', x: p.x, y: p.y + 2 },
        ]),
        // 杉木林的埋伏
        {
            id: 'ambush', kind: 'trigger', x: TRAIL.ambush.x - 1, y: TRAIL.ambush.y, w: 3, h: 1,
            async onEnter(g) {
                if (!g.timer) return;
                g.se('ghost');
                g.shake(0.4, 2);
                await g.narrate('樹林深處傳來沙沙的腳步聲……');
                await g.say('dad', '後、後面那個長得像我的老先生……是什麼東西？！');
                g.startChase(TRAIL.ambush.x, TRAIL.ambush.y - 5, { stage: 2, grace: 1.2 });
            },
        },
        // 森林鐵道上夥伴留下的提示
        {
            id: 'hint1', kind: 'inspect', x: 28, y: 84,
            async onInteract(g) { await g.narrate('枕木旁插著一根樹枝，掛著紅絲帶，上面用粉筆寫著：「老公加油！往前走！」(配偶的字)'); },
        },
        {
            id: 'hint2', kind: 'inspect', x: 30, y: 87,
            async onInteract(g) { await g.narrate('地上有人用石頭排了一個大大的箭頭，旁邊還畫了一隻很醜的小熊。(兒子的傑作)'); },
        },
        {
            id: 'hint3', kind: 'inspect', x: 28, y: 90,
            async onInteract(g) { await g.narrate('紙條：「快到了！鹿場登山口就在前面，救護車在等你！」(路人甲)'); },
        },
        {
            id: 'trailhead_sign', kind: 'inspect', x: 26, y: 96,
            async onInteract(g) { await g.narrate('「鹿場登山口」。沿著這條路一路往下，終於走出山裡了。'); },
        },
        // 終點
        {
            id: 'goal', kind: 'trigger', x: TRAIL.goal.x - 1, y: TRAIL.goal.y, w: 3, h: 1,
            async onEnter(g) {
                if (!g.timer) return;
                await arriveTrailhead(g);
            },
        },
    ],
};

function beeSting(g) {
    if (!g.timer) return;
    g.addTime(-4);
    g.se('sting');
    g.shake(0.3, 2);
    g.floatText('被蜜蜂叮了！ -4 秒');
}

// ---------- 山頂開場 ----------

const TIME_LIMIT = 180; // 預設 3 分鐘

function descentSeconds(g) {
    return TIME_LIMIT + 20 * g.difficulty().level; // 難度補償：嚇暈越多次，給越多時間
}

async function startDescent(g) {
    g.cancelTimer();
    g.state.flag('bees_out', false);
    g.startTimer(descentSeconds(g));
    g.setObjective('在時間內走下山，到鹿場登山口！');
    // 限時下山：時間到、被老鬼抓到，一律從山頂重新開始
    g.faintRestart = async (game) => {
        game.state.flag('d2_alone', true);
        game.loadMap('jiali_trail', 29, 5, 'down');
        game.setBigHead(true);
        game.bgm('day2');
        await startDescent(game);
    };
}

async function summitIntro(g) {
    await g.card('Day 2', '苗栗．加里山');
    await g.narrate('加里山，人稱「苗栗的富士山」，山形尖聳，是南庄一帶最有名的山。');
    await g.say('pa', '終於登頂了！風景也太美了吧！');
    await g.say('fb_dad', '雲海！那邊有雲海！');
    await g.say('daughter', '好高喔，我腿好痠。');
    await g.say('mom', '來來來，大家到三角點旁邊，拍張合照！');
    // 大家站到三角點旁邊
    await Promise.all([
        g.moveActor('mom', [{ x: 18, y: 4 }]), g.moveActor('son', [{ x: 19, y: 4 }]), g.moveActor('fb_dad', [{ x: 20, y: 4 }]),
        g.moveActor('fb_mom', [{ x: 21, y: 4 }]), g.moveActor('pa', [{ x: 22, y: 4 }]),
    ]);
    await g.moveActor('player', [{ x: 19, y: 5 }]);
    g.player.dir = 'up';
    await g.say('pb', '一、二、三——笑一個！');
    g.flash(0.4);
    g.se('tick');
    await g.wait(0.6);
    await g.say('dad', '這張應該拍得不錯。我去旁邊拍幾張風景照吧。');
    await g.moveActor('player', [{ x: 29, y: 4 }]);
    g.player.dir = 'up';
    await g.narrate('樹上的蜂窩旁邊，嗡嗡嗡……飛來了一隻長得很奇怪的蜜蜂。');
    g.flag('bees_out', true);
    g.se('bee');
    await g.wait(0.8);
    await g.say('dad', '咦？這隻蜜蜂……怎麼好像在盯著我看？');
    g.se('sting');
    g.shake(0.5, 3);
    g.flash(0.3);
    await g.say('dad', '啊啊啊——！我的臉！');
    g.setBigHead(true);
    await g.narrate('壽星被蜜蜂叮到了！臉像吹氣球一樣迅速腫了起來，變成了一顆大頭！');
    await g.say('son', '爸爸的臉變好大喔！');
    await g.say('mom', '快！先下山，要趕快送去醫院！');
    await g.say('fb_dad', '路很長，你先走，我們跟在後面！');
    await g.narrate('得在時間內衝下山才行！');
    await Promise.all([
        g.moveActor('mom', [{ x: 18, y: 8 }], { speed: 7 }), g.moveActor('son', [{ x: 19, y: 8 }], { speed: 7 }), g.moveActor('fb_dad', [{ x: 20, y: 8 }], { speed: 7 }),
        g.moveActor('fb_mom', [{ x: 21, y: 8 }], { speed: 7 }), g.moveActor('pa', [{ x: 22, y: 8 }], { speed: 7 }), g.moveActor('pb', [{ x: 22, y: 7 }], { speed: 7 }),
        g.moveActor('daughter', [{ x: 17, y: 8 }], { speed: 7 }),
    ]);
    g.flag('d2_alone', true);
    g.flag('bees_out', false);
}

// ---------- 抵達登山口 -> 醫院 ----------

async function arriveTrailhead(g) {
    g.cancelTimer();
    g.faintRestart = null;
    g.endChase('script');
    g.flag('trail_done', true);
    g.se('success');
    await g.narrate('抵達鹿場登山口！時間內趕到了！');
    await g.say('dad', '呼……呼……我的臉……好脹……');
    await g.fade(true, 0.8);
    await hospitalIntro(g);
}

// ======================================================================
// 醫院
// ======================================================================

const HOSP_LEGEND = {
    '#': 'wall', H: 'wallhosp', w: 'window', D: 'door', h: 'hosp',
    B: { g: 'hosp', o: 'bedhosp' }, C: { g: 'hosp', o: 'curtain' }, K: { g: 'hosp', o: 'sink' }, L: { g: 'hosp', o: 'locker' },
    c: { g: 'hosp', o: 'counter' }, E: { g: 'hosp', o: 'elevator' }, p: { g: 'hosp', o: 'plant' }, q: { g: 'hosp', o: 'chair' },
};

const hospRows = [
    rep('#', 24),
    '#' + rep('H', 7) + '#' + rep('H', 7) + '#' + rep('H', 6) + '#',
    '#' + 'hhhhhhK' + '#' + 'hhhChhh' + '#' + rep('h', 6) + '#',
    '#' + 'hBhhhhh' + '#' + 'hBhhhBh' + '#' + 'hBhhBh' + '#',
    '#' + rep('h', 7) + '#' + rep('h', 7) + '#' + rep('h', 6) + '#',
    '#' + 'Chhhhhq' + '#' + rep('h', 7) + '#' + rep('h', 6) + '#',
    '#' + rep('h', 7) + '#' + rep('h', 7) + '#' + rep('h', 6) + '#',
    '#' + '###D###' + '#' + '###D###' + '#' + '##D###' + '#',
    '#' + rep('h', 22) + '#',
    '#' + rep('h', 22) + '#',
    '#' + '####' + 'D' + rep('#', 8) + 'E' + rep('#', 7) + 'D' + '#',
    '#' + rep('h', 9) + rep('#', 14),
    '#' + 'ccccphhhL' + rep('#', 14),
    '#' + rep('h', 9) + rep('#', 14),
    rep('#', 24),
];

const hospital = {
    id: 'hospital_f2',
    name: '醫院病房',
    bgm: 'hospital',
    legend: HOSP_LEGEND,
    rows: hospRows,
    dark: 0.3,
    entities: [
        // 開場陪病的同伴
        { id: 'mom', kind: 'npc', char: 'mom', x: 3, y: 4, dir: 'up', when: (g) => !g.flag('d2_alone') },
        { id: 'son', kind: 'npc', char: 'son', x: 4, y: 4, dir: 'up', when: (g) => !g.flag('d2_alone') },
        { id: 'fb_dad', kind: 'npc', char: 'fb_dad', x: 5, y: 3, dir: 'left', when: (g) => !g.flag('d2_alone') },
        { id: 'fb_mom', kind: 'npc', char: 'fb_mom', x: 5, y: 4, dir: 'left', when: (g) => !g.flag('d2_alone') },
        { id: 'daughter', kind: 'npc', char: 'daughter', x: 4, y: 5, dir: 'up', when: (g) => !g.flag('d2_alone') },
        { id: 'pa', kind: 'npc', char: 'pa', x: 6, y: 4, dir: 'left', when: (g) => !g.flag('d2_alone') },
        { id: 'pb', kind: 'npc', char: 'pb', x: 6, y: 5, dir: 'left', when: (g) => !g.flag('d2_alone') },
        // 病房 B 的怪阿伯 (睡在床上說夢話)
        {
            id: 'elder', kind: 'npc', char: 'elder', x: 10, y: 3, dir: 'down',
            async onInteract(g) {
                g.flag('heard_code', true);
                await g.say('elder', '……三……七……二……一……不要拔我的點滴……');
                await g.narrate('阿伯在睡夢中念著一串數字：「3、7、2、1」。');
                if (!g.flag('got_stairkey')) g.setObjective('護理站的置物櫃，或許跟那串數字有關');
            },
        },
        {
            id: 'mirror', kind: 'inspect', x: 7, y: 2,
            async onInteract(g) {
                if (g.state.flag('bighead')) await g.say('dad', '鏡子裡的大頭……怎麼看都像那個老鬼。');
                else await g.say('dad', '消腫了。還好，終於變回正常的臉了。');
            },
        },
        { id: 'bedA', kind: 'inspect', x: 2, y: 3, async onInteract(g) { await g.narrate('我的病床。被子還有點溫度。'); } },
        { id: 'bedB2', kind: 'inspect', x: 14, y: 3, async onInteract(g) { await g.narrate('空的病床，被子摺得整整齊齊。'); } },
        // 病床隔簾 (可躲藏)
        { id: 'curtainA', kind: 'hide', hide: { type: 'curtain' }, x: 1, y: 5, async idle(g) { await g.narrate('病床的隔簾。後面有一點空間可以躲。'); } },
        { id: 'curtainB', kind: 'hide', hide: { type: 'curtain' }, x: 12, y: 2, async idle(g) { await g.narrate('病床的隔簾。後面有一點空間可以躲。'); } },
        // 病房 C：打不開
        {
            id: 'roomC_lock', kind: 'inspect', solid: true, x: 19, y: 7,
            async onInteract(g) { g.se('locked'); await g.narrate('門鎖住了。裡面好像有什麼東西在動……還是不要進去比較好。'); },
        },
        // 故障的電梯
        {
            id: 'elevator', kind: 'inspect', x: 14, y: 10,
            async onInteract(g) { g.se('ng'); await g.narrate('電梯門上貼著「故障中，請走安全梯」，紅燈一閃一閃的。'); },
        },
        // 護理站
        { id: 'nurse_note', kind: 'inspect', x: 2, y: 12, async onInteract(g) { await g.narrate('護理紀錄板：「B 床阿伯半夜常說夢話，不用理他。」'); } },
        { id: 'nurse_note2', kind: 'inspect', x: 4, y: 12, async onInteract(g) { await g.narrate('置物櫃的使用說明：「請輸入四位數字密碼」。'); } },
        {
            id: 'locker', kind: 'inspect', x: 9, y: 12,
            async onInteract(g) {
                if (g.flag('got_stairkey')) { await g.narrate('置物櫃是空的了。'); return; }
                const ok = await g.code({ answer: '3721', title: '護理站置物櫃', hint: g.flag('heard_code') ? '阿伯的夢話裡，好像有一串數字……' : '四位數字' });
                if (!ok) return;
                g.flag('got_stairkey', true);
                g.give('d2_stairkey');
                g.give('d2_swellmed');
                g.se('door_open');
                await g.narrate('置物櫃打開了！裡面有一把「安全梯鑰匙」，還有一包消腫藥。');
                await g.narrate('壽星把消腫藥吞了下去……');
                g.flash(0.3);
                g.setBigHead(false);
                await g.say('dad', '臉……消下去了！終於又變回人樣了！');
                g.setObjective('用安全梯鑰匙，從安全梯離開病房');
            },
        },
        // 走出護理站時，老鬼推著點滴架出現
        {
            id: 'ghost_trigger', kind: 'trigger', x: 5, y: 10,
            when: (g) => g.flag('got_stairkey') && !g.flag('hosp_ghost_done'),
            async onEnter(g) {
                g.flag('hosp_ghost_done', true);
                g.se('ghost');
                g.shake(0.4, 2);
                await g.narrate('走廊盡頭傳來「喀啦、喀啦」的聲音……是點滴架的輪子！');
                g.startChase(14, 9, { stage: 2, grace: 1.5, prop: 'drip' });
                await g.say('dad', '是那個老鬼！他、他推著點滴架追過來了！');
            },
        },
        // 安全梯 (需要鑰匙)；到達後進入便利商店
        {
            id: 'stairs_exit', kind: 'exit', x: 22, y: 10, to: 'store_1f', tx: 2, ty: 5, dir: 'right',
            requires: 'd2_stairkey', lockedMsg: '安全梯的門鎖住了。需要鑰匙。', sfx: 'door_open',
            async onUse(g) {
                g.endChase('script');
                g.ghost.despawn();
                g.bgm('prologue');
                await storeScene(g);
            },
        },
    ],
};

// ---------- 1F 便利商店 ----------

const STORE_LEGEND = {
    '#': 'wall', W: 'wallface', w: 'window', i: 'tile', D: 'door', G: 'glassdoor',
    F: { g: 'tile', o: 'freezer' }, S: { g: 'tile', o: 'shelfgoods' }, O: { g: 'tile', o: 'oden' }, c: { g: 'tile', o: 'counter' },
    T: { g: 'tile', o: 'table' }, q: { g: 'tile', o: 'chair' },
};

const store = {
    id: 'store_1f',
    name: '1F 便利商店',
    bgm: 'prologue',
    legend: STORE_LEGEND,
    rows: [
        rep('#', 18),
        '#' + 'WWWWWWwWWWWWWWWW' + '#',
        '#' + 'FFFFFiiiiiiiSSSS' + '#',
        '#' + rep('i', 16) + '#',
        '#' + 'iiiiiiiiiiOccccc' + '#',
        'D' + rep('i', 16) + '#',
        '#' + 'iiiTTiiiiiTTiiii' + '#',
        '#' + rep('i', 16) + '#',
        rep('#', 8) + 'G' + rep('#', 9),
    ],
    entities: [
        { id: 'mom', kind: 'npc', char: 'mom', x: 4, y: 7, dir: 'up' },
        { id: 'son', kind: 'npc', char: 'son', x: 5, y: 7, dir: 'up' },
        { id: 'fb_dad', kind: 'npc', char: 'fb_dad', x: 3, y: 6, dir: 'right' },
        { id: 'fb_mom', kind: 'npc', char: 'fb_mom', x: 6, y: 6, dir: 'left' },
        { id: 'daughter', kind: 'npc', char: 'daughter', x: 10, y: 7, dir: 'up' },
        { id: 'pa', kind: 'npc', char: 'pa', x: 11, y: 7, dir: 'up' },
        { id: 'pb', kind: 'npc', char: 'pb', x: 13, y: 6, dir: 'left' },
        {
            id: 'door_out', kind: 'inspect', solid: true, x: 8, y: 8,
            async onInteract(g) { await g.narrate('夜深了，外面一片漆黑。還是別亂跑。'); },
        },
    ],
};

async function storeScene(g) {
    await g.fade(false, 0.4);
    await g.say('mom', '你醒啦？我們餓了，先下來吃一點東西。');
    await g.say('fb_dad', '關東煮超好吃的！你要不要來一顆蘿蔔？');
    await g.say('pa', '你睡得跟豬一樣，叫都叫不醒啦。');
    await g.say('daughter', '叔叔，吃茶葉蛋！');
    await g.say('dad', '……又來？');
    await g.say('fb_mom', '怎麼了？你臉色怎麼怪怪的？');
    await g.say('dad', '沒事。只是剛剛……被一個推著點滴架的老先生追了一整條走廊。');
    await g.say('pb', '你一定是藥吃太多了。');
    await g.narrate('壽星看著大家若無其事地吃著關東煮，心裡有一種說不出的奇怪的感覺。');
    g.state.items.length = 0; // 醫院的鑰匙用完了
    await g.fade(true, 0.8);
    await g.startChapter('day3');
}

// ---------- 醫院開場 ----------

async function hospitalIntro(g) {
    g.cancelTimer();
    g.faintRestart = null;
    g.flag('d2_alone', false);
    g.loadMap('hospital_f2', 3, 3, 'left');
    g.bgm('hospital');
    await g.fade(false, 0.8);
    await g.card('醫院', '當晚');
    await g.narrate('救護車把壽星送到了鎮上的醫院。醫生看了看，說：「被怪蜂叮到的，睡一晚觀察就好。」');
    await g.say('mom', '你先好好躺著，我們都在這裡陪你。');
    await g.moveActor('player', [{ x: 3, y: 2 }, { x: 6, y: 2 }]);
    g.player.dir = 'right';
    await g.say('dad', '……讓我看一下鏡子。');
    await g.say('dad', '這、這是什麼……我的臉怎麼腫成這樣……');
    await g.say('dad', '……我怎麼長得跟那個鬼一樣？');
    await g.say('son', '什麼鬼？爸爸你在說什麼？');
    await g.say('dad', '沒、沒事。是我昨天在旅館……不，沒事。');
    await g.moveActor('player', [{ x: 3, y: 2 }, { x: 3, y: 3 }]);
    await g.say('fb_mom', '好啦好啦，快睡吧。');
    await g.say('pa', '我們在旁邊陪你，安心睡。');
    await g.narrate('壽星躺回病床，在大家的陪伴下，慢慢地睡著了……');
    await g.fade(true, 1.2);
    await g.wait(0.6);
    g.flag('d2_alone', true);
    g.loadMap('hospital_f2', 3, 3, 'down');
    g.player.hidden = false;
    await g.card('半夜', '', { sec: 1.6 });
    await g.fade(false, 0.8);
    await g.say('dad', '……嗯？現在幾點了？');
    await g.say('dad', '病房裡……一個人都沒有？大家去哪了？');
    g.setObjective('找到大家。走廊那邊好像有聲音');
    g.flag('d2_phase', 'hospital');
    g.setCheckpoint();
    g.autosave(); // 醫院段開頭自動存檔
}

// ======================================================================
// 章節
// ======================================================================

export const day2 = {
    id: 'day2',
    title: 'Day 2　加里山與醫院',
    maps: { jiali_trail: trail, hospital_f2: hospital, store_1f: store },
    preset: { items: [], flags: {}, objective: '' },
    onLoad(g) {
        // 山路的限時狀態不存檔 (限時中本來就不能存檔)。
        // 如果讀到的是「Day 2 開頭」的自動存檔 (還在山頂、尚未被蜂叮)，重新播放山頂劇情與倒數。
        g.faintRestart = null;
        if (g.flag('d2_phase') === 'summit') {
            g.runScript(async () => {
                await summitIntro(g);
                g.flag('d2_phase', 'trail');
                await startDescent(g);
            });
        }
    },
    async start(g, { skipIntro = false, at = 'summit' } = {}) {
        g.state.chapter = 'day2';
        g.state.flags.d2_alone = false;
        g.state.flags.bees_out = false;
        g.state.flags.d2_phase = 'summit';
        g.setBigHead(false);
        if (at === 'hospital') {
            g.state.flags.d2_alone = true;
            g.state.flags.d2_phase = 'hospital';
            g.loadMap('hospital_f2', 3, 3, 'down');
            g.setBigHead(true);
            g.setCheckpoint();
            g.autosave();
            return;
        }
        g.loadMap('jiali_trail', TRAIL.start.x, TRAIL.start.y, 'up');
        g.bgm('day2');
        g.setCheckpoint();
        g.autosave(); // Day 2 開頭自動存檔
        if (skipIntro) {
            g.flag('d2_phase', 'trail');
            await startDescentAfter(g);
            return;
        }
        await g.fadeInIfDark();
        await g.runScript(async () => {
            await summitIntro(g);
            g.flag('d2_phase', 'trail');
            await startDescent(g);
        });
    },
};

async function startDescentAfter(g) {
    g.flag('d2_alone', true);
    g.loadMap('jiali_trail', 29, 5, 'down');
    g.setBigHead(true);
    await startDescent(g);
}
