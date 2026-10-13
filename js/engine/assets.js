// 素材載入：圖片預先載入並回報進度，缺件時回傳 null (由呼叫端改用佔位素材)

import userConfig from '../../assets/user/config.js';
import { CHARACTERS } from '../content/characters.js';

const images = new Map();

function loadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

/** 取得已載入的圖片，缺件為 null */
export function getImage(key) {
    return images.get(key) || null;
}

/** 所有要預先載入的圖片 (key -> 路徑) */
function manifest() {
    const list = {
        'tiny-town': 'assets/tiles/tiny-town.png',
        'tiny-dungeon': 'assets/tiles/tiny-dungeon.png',
    };
    for (const c of Object.values(CHARACTERS)) {
        if (c.portrait) list['portrait:' + c.id] = 'assets/user/' + c.portrait;
    }
    if (userConfig.ghostFace) list['ghost-face'] = 'assets/user/' + userConfig.ghostFace;
    userConfig.photos.forEach((p, i) => { list['photo:' + i] = 'assets/user/' + p; });
    return list;
}

/** 載入全部素材。onProgress(0..1) */
export async function loadAll(onProgress = () => {}) {
    const list = Object.entries(manifest());
    let done = 0;
    onProgress(0);
    await Promise.all(list.map(async ([key, url]) => {
        images.set(key, await loadImage(url));
        done++;
        onProgress(done / list.length);
    }));
    onProgress(1);
}
