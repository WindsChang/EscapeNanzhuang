// 道具定義：icon 可為 { sheet, col, row } (Kenney 圖塊集)、{ tile } (程式圖塊) 或 { emoji }
const KEY = { sheet: 'tiny-town', col: 9, row: 9 };
const POTION_RED = { sheet: 'tiny-dungeon', col: 7, row: 9 };
const POTION_GREEN = { sheet: 'tiny-dungeon', col: 6, row: 9 };

export const ITEMS = {
    // 示範場景用
    sandbox_key: { name: '示範鑰匙', desc: '示範房間的門鑰匙。', icon: KEY },
    sandbox_note: { name: '便條紙', desc: '寫著「櫃子的密碼是 1234」。', icon: { emoji: '📝' } },
    sandbox_medicine: { name: '止癢藥膏', desc: '擦了之後紅疹就沒那麼癢了。', icon: POTION_RED },

    // Day 1 旅館
    day1_kitchen_key: { name: '廚房鑰匙', desc: '從櫃台抽屜拿到的，可以打開旅館廚房的門。', icon: KEY },
    day1_ointment: { name: '止癢藥膏', desc: '在廚房藥箱找到的。擦在紅疹上涼涼的。', icon: POTION_RED },
    day1_gatekey: { name: '旅館大門鑰匙', desc: '放在 2F 棉被間收納箱裡的備用鑰匙。', icon: KEY },

    // Day 2 醫院
    d2_stairkey: { name: '安全梯鑰匙', desc: '從護理站的置物櫃拿到的，可以打開安全梯的門。', icon: KEY },
    d2_swellmed: { name: '消腫藥', desc: '吞下去之後，腫起來的臉就消了。', icon: POTION_GREEN },

    // Day 3 透天厝
    home_gatekey: { name: '家裡的大門鑰匙', desc: '被藏在公仔櫃底層的暗格裡。', icon: KEY },
};

export function itemDef(id) {
    return ITEMS[id] || { name: id, desc: '', icon: { emoji: '❓' } };
}
