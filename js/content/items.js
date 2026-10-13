// 道具定義：icon 可為 { sheet, col, row } (Kenney 圖塊集)、{ tile } (程式圖塊) 或 { emoji }
export const ITEMS = {
    // 示範場景用
    sandbox_key: { name: '示範鑰匙', desc: '示範房間的門鑰匙。', icon: { sheet: 'tiny-town', col: 9, row: 9 } },
    sandbox_note: { name: '便條紙', desc: '寫著「櫃子的密碼是 1234」。', icon: { emoji: '📝' } },
    sandbox_medicine: { name: '止癢藥膏', desc: '擦了之後紅疹就沒那麼癢了。', icon: { sheet: 'tiny-dungeon', col: 7, row: 9 } },
};

export function itemDef(id) {
    return ITEMS[id] || { name: id, desc: '', icon: { emoji: '❓' } };
}
