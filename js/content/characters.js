// 角色定義：顯示名稱與頭像來自 assets/user/config.js，外觀 (走路圖與佔位頭像) 在這裡設定。
import userConfig from '../../assets/user/config.js';

// 外觀：skin 膚色、hair 髮色、hairStyle (short/long/bald/bun/kid)、shirt 上衣色、pants 褲色、glasses 是否戴眼鏡
const LOOKS = {
    dad: { skin: '#f2c9a0', hair: '#2b2118', hairStyle: 'short', shirt: '#3d7bd9', pants: '#3a3a5a', glasses: true },
    mom: { skin: '#f6d0b0', hair: '#4a2e1c', hairStyle: 'long', shirt: '#e0709a', pants: '#5a4a6a' },
    son: { skin: '#f2c9a0', hair: '#2b2118', hairStyle: 'kid', shirt: '#4dbb6a', pants: '#2f4f7a', small: true },
    fb_dad: { skin: '#e8b98c', hair: '#1c1c1c', hairStyle: 'short', shirt: '#d9923d', pants: '#4a4a3a' },
    fb_mom: { skin: '#f6d0b0', hair: '#6b3a1c', hairStyle: 'bun', shirt: '#8a6ad9', pants: '#3a3a5a' },
    daughter: { skin: '#f6d0b0', hair: '#2b2118', hairStyle: 'kid', shirt: '#f08a4a', pants: '#c05a8a', small: true, pigtails: true },
    pa: { skin: '#e8b98c', hair: '#5a3a1a', hairStyle: 'short', shirt: '#3aa8a0', pants: '#3a3a3a' },
    pb: { skin: '#f2c9a0', hair: '#2a2a2a', hairStyle: 'long', shirt: '#c94a4a', pants: '#2a3a5a', glasses: true },
};

// 劇情中的其他角色 (不在 8 位同行者之內，名稱與外觀固定)
const EXTRA = {
    elder: { name: '怪阿伯', look: { skin: '#e0b890', hair: '#cfcfcf', hairStyle: 'short', shirt: '#7aa0c8', pants: '#8a8a9a' } },
};

export const CHARACTERS = {};
for (const [id, def] of Object.entries(EXTRA)) CHARACTERS[id] = { id, name: def.name, portrait: null, look: def.look };
for (const [id, look] of Object.entries(LOOKS)) {
    const cfg = userConfig.characters[id] || {};
    CHARACTERS[id] = {
        id,
        name: cfg.name || id,
        portrait: cfg.portrait || null,
        look,
    };
}

export const PLAYER_ID = 'dad';

/** 旁白 / 無頭像的說話者 */
export const NARRATOR = { id: 'narrator', name: '' };

/** 取得說話者資料；未知 id 會回傳只有名字的物件 */
export function speaker(id) {
    if (!id || id === 'narrator') return NARRATOR;
    if (CHARACTERS[id]) return CHARACTERS[id];
    return { id, name: id, portrait: null, look: null };
}
