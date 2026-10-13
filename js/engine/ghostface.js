// 老鬼外觀：用壽星照片做成大頭藍鬼，依章節疊加老化道具。
//   stage 1 = 白頭髮 (Day 1)、stage 2 = 皺紋 + 老花眼鏡 (Day 2)、stage 3 = 白髮蒼蒼 + 拐杖 (Day 3)
// 沒有照片時以卡通臉佔位。合成後快取。
import { getImage } from './assets.js';

const cache = new Map();

function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

/** 在 32x40 的基準座標畫老鬼，scale 為放大倍率 */
function paint(g, stage, face, scale) {
    g.save();
    g.scale(scale, scale);
    g.imageSmoothingEnabled = scale > 1;
    const BODY = '#2a45a8';
    const BODY_DARK = '#1c2f7a';
    const SKIN = '#4f78e8';

    // 拐杖 (Day 3)
    if (stage >= 3) {
        g.fillStyle = '#7a4a22';
        g.fillRect(25, 26, 2, 14);
        g.fillRect(25, 25, 5, 2);
    }
    // 腿
    g.fillStyle = BODY_DARK;
    g.fillRect(11, 33, 4, 7);
    g.fillRect(17, 33, 4, 7);
    // 身體與手
    g.fillStyle = BODY;
    g.fillRect(10, 22, 12, 12);
    g.fillRect(6, 23, 4, 9);
    g.fillRect(22, 23, 4, 9);
    g.fillStyle = SKIN;
    g.fillRect(6, 31, 4, 3);
    g.fillRect(22, 31, 4, 3);
    // 衣服的釦子 (老人家的開襟背心)
    g.fillStyle = '#8fb0ff';
    g.fillRect(15, 24, 2, 8);

    // 大頭
    g.save();
    g.beginPath();
    g.ellipse(16, 13, 13, 12, 0, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = SKIN;
    g.fillRect(0, 0, 32, 28);
    if (face) {
        // 以「填滿」方式裁切照片
        const s = Math.max(26 / face.width, 24 / face.height);
        const w = face.width * s;
        const hgt = face.height * s;
        g.drawImage(face, 16 - w / 2, 13 - hgt / 2, w, hgt);
        g.globalCompositeOperation = 'multiply';
        g.fillStyle = '#b4c8ff';
        g.fillRect(0, 0, 32, 28);
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(50, 90, 230, 0.32)';
        g.fillRect(0, 0, 32, 28);
    } else {
        // 佔位臉：大眼睛、大嘴巴
        g.fillStyle = '#fff';
        g.fillRect(8, 9, 6, 6);
        g.fillRect(18, 9, 6, 6);
        g.fillStyle = '#111';
        g.fillRect(11, 11, 3, 4);
        g.fillRect(19, 11, 3, 4);
        g.fillStyle = '#1a1240';
        g.fillRect(9, 18, 14, 5);
        g.fillStyle = '#fff';
        for (let x = 10; x < 22; x += 3) g.fillRect(x, 18, 2, 2);
        g.fillStyle = '#10205a';
        g.fillRect(7, 7, 7, 1);
        g.fillRect(18, 7, 7, 1);
    }
    g.restore();
    // 輪廓
    g.strokeStyle = BODY_DARK;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(16, 13, 13, 12, 0, 0, Math.PI * 2);
    g.stroke();

    // ----- 老化道具 -----
    g.fillStyle = '#f4f4f4';
    if (stage === 1) {
        // 頭頂幾根白頭髮
        for (const [x, y, h2] of [[11, 2, 4], [15, 0, 5], [19, 1, 4], [23, 3, 3]]) g.fillRect(x, y, 1, h2);
    }
    if (stage >= 2) {
        // 皺紋
        g.strokeStyle = 'rgba(16, 30, 90, 0.8)';
        g.lineWidth = 0.7;
        for (const y of [4, 5.6, 7.2]) {
            g.beginPath(); g.moveTo(9, y); g.lineTo(23, y); g.stroke();
        }
        g.beginPath(); g.moveTo(6, 15); g.quadraticCurveTo(8, 18, 9, 21); g.stroke();
        g.beginPath(); g.moveTo(26, 15); g.quadraticCurveTo(24, 18, 23, 21); g.stroke();
        // 老花眼鏡
        g.strokeStyle = '#2a1a0a';
        g.lineWidth = 1;
        g.strokeRect(7.5, 9.5, 7, 6);
        g.strokeRect(17.5, 9.5, 7, 6);
        g.beginPath(); g.moveTo(14.5, 11.5); g.lineTo(17.5, 11.5); g.stroke();
        g.fillStyle = 'rgba(220, 240, 255, 0.35)';
        g.fillRect(8, 10, 6, 5);
        g.fillRect(18, 10, 6, 5);
    }
    if (stage >= 3) {
        // 白髮蒼蒼：頭頂與兩側一大圈白髮 + 白鬍子
        g.fillStyle = '#f4f4f4';
        g.beginPath();
        g.ellipse(16, 3.5, 11, 4, 0, Math.PI, Math.PI * 2);
        g.fill();
        g.fillRect(3, 4, 3, 7);
        g.fillRect(26, 4, 3, 7);
        g.beginPath();
        g.ellipse(16, 22, 6, 3, 0, 0, Math.PI);
        g.fill();
    }
    g.restore();
}

/** 取得老鬼圖：{ map: 32x40, big: 128x160 }，stage 為 1~3 */
export function ghostSprites(stage) {
    const face = getImage('ghost-face');
    const key = stage + ':' + (face ? 'photo' : 'ph');
    if (cache.has(key)) return cache.get(key);
    const map = makeCanvas(32, 40);
    paint(map.getContext('2d'), stage, face, 1);
    const big = makeCanvas(128, 160);
    paint(big.getContext('2d'), stage, face, 4);
    const out = { map, big };
    cache.set(key, out);
    return out;
}
