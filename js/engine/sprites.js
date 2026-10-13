// 圖塊與角色圖：Kenney (CC0) 素材 + 程式繪製的像素物件，執行期組成一張圖塊集 (atlas)
import { TILE } from './util.js';
import { getImage } from './assets.js';

const T = TILE;

function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return c;
}

const R = (g, color, x, y, w, h) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

// ---------------------------------------------------------------------
// 圖塊定義：name -> { solid, draw(g) }
// ---------------------------------------------------------------------

/** 從 Kenney 圖塊集複製一格 (16x16，無間隔) */
const kenney = (sheet, col, row) => (g) => {
    const img = getImage(sheet);
    if (img) g.drawImage(img, col * T, row * T, T, T, 0, 0, T, T);
    else { R(g, '#ff00ff', 0, 0, T, T); }
};

const floorWood = (g) => {
    R(g, '#b98a56', 0, 0, T, T);
    R(g, '#a97a48', 0, 5, T, 1); R(g, '#a97a48', 0, 11, T, 1);
    R(g, '#c89a64', 0, 0, T, 1);
    R(g, '#a97a48', 4, 0, 1, 5); R(g, '#a97a48', 11, 6, 1, 5); R(g, '#a97a48', 6, 12, 1, 4);
};
const floorTatami = (g) => {
    R(g, '#c9c58a', 0, 0, T, T);
    R(g, '#a9a56a', 0, 0, T, 1); R(g, '#a9a56a', 0, 0, 1, T); R(g, '#a9a56a', 0, 15, T, 1);
    for (let x = 2; x < T; x += 3) R(g, '#bdb97c', x, 2, 1, 12);
};
const floorTile = (g) => {
    R(g, '#d6ece6', 0, 0, T, T);
    R(g, '#b7d8d0', 0, 0, 8, 8); R(g, '#b7d8d0', 8, 8, 8, 8);
    R(g, '#9fc4bb', 0, 7, T, 1); R(g, '#9fc4bb', 7, 0, 1, T);
};
const floorCarpet = (g) => {
    R(g, '#9c3f4a', 0, 0, T, T);
    R(g, '#b45560', 0, 0, T, 2); R(g, '#b45560', 0, 14, T, 2);
    R(g, '#c9a24a', 3, 7, 10, 2);
};
const floorHosp = (g) => {
    R(g, '#e8eef0', 0, 0, T, T);
    R(g, '#cfd9dd', 0, 15, T, 1); R(g, '#cfd9dd', 15, 0, 1, T);
    R(g, '#dbe5e8', 3, 3, 4, 4); R(g, '#dbe5e8', 10, 10, 4, 4);
};
const floorConcrete = (g) => {
    R(g, '#9a9a9a', 0, 0, T, T);
    R(g, '#8a8a8a', 2, 3, 3, 2); R(g, '#a8a8a8', 9, 9, 4, 2); R(g, '#8a8a8a', 10, 2, 2, 2);
};
const rails = (g) => {
    kenney('tiny-town', 1, 1)(g);
    R(g, '#6b4a2a', 0, 3, T, 3); R(g, '#6b4a2a', 0, 10, T, 3);
    R(g, '#5a5a62', 4, 0, 2, T); R(g, '#5a5a62', 10, 0, 2, T);
    R(g, '#8a8a92', 4, 0, 1, T); R(g, '#8a8a92', 10, 0, 1, T);
};
const slope = (g) => {
    kenney('tiny-town', 1, 1)(g);
    R(g, '#c98a4a', 0, 4, T, 1); R(g, '#c98a4a', 0, 10, T, 1);
    for (let x = 1; x < T; x += 4) R(g, '#7a4a22', x, 6, 2, 1);
};
const water = (g) => {
    R(g, '#4a8ad9', 0, 0, T, T); R(g, '#7ab0f0', 2, 4, 5, 1); R(g, '#7ab0f0', 9, 10, 5, 1);
};

const wallTop = (g) => {
    R(g, '#4a3a4a', 0, 0, T, T);
    R(g, '#5a4a5a', 0, 0, T, 2); R(g, '#3a2a3a', 0, 14, T, 2);
};
const wallFace = (g) => {
    R(g, '#e6d6b0', 0, 0, T, 10);
    R(g, '#d4c090', 0, 9, T, 1);
    R(g, '#8a5a3a', 0, 10, T, 6);
    R(g, '#6a4226', 0, 10, T, 1); R(g, '#6a4226', 0, 15, T, 1);
    R(g, '#9a6a46', 3, 12, 4, 2); R(g, '#9a6a46', 10, 12, 4, 2);
};
const wallFaceHosp = (g) => {
    R(g, '#d6ece6', 0, 0, T, 10);
    R(g, '#9fc4bb', 0, 9, T, 1);
    R(g, '#6fa89c', 0, 10, T, 6);
    R(g, '#5a9488', 0, 10, T, 1);
};
const windowTile = (g) => {
    wallFace(g);
    R(g, '#6a4226', 2, 1, 12, 9); R(g, '#8fcdf2', 3, 2, 10, 7);
    R(g, '#6a4226', 7, 2, 2, 7); R(g, '#c8ecff', 4, 3, 2, 2);
};
const door = (g) => {
    wallFace(g);
    R(g, '#4a2a16', 2, 0, 12, 16); R(g, '#8a5a30', 3, 1, 10, 15);
    R(g, '#6a4226', 4, 2, 3, 5); R(g, '#6a4226', 9, 2, 3, 5);
    R(g, '#f2d25a', 10, 9, 2, 2);
};
const stairsUp = (g) => {
    floorWood(g);
    R(g, '#6a4a2a', 1, 0, 14, 16);
    for (let i = 0; i < 5; i++) { R(g, '#d0a06a', 2, 1 + i * 3, 12, 2); R(g, '#8a5a30', 2, 3 + i * 3, 12, 1); }
    R(g, '#ffe36a', 7, 7, 2, 2); // 向上提示
};
const stairsDown = (g) => {
    floorWood(g);
    R(g, '#3a2a1a', 1, 0, 14, 16);
    for (let i = 0; i < 5; i++) { R(g, '#a07a4a', 2, 1 + i * 3, 12, 2); R(g, '#5a3a20', 2, 3 + i * 3, 12, 1); }
    R(g, '#ff9a6a', 7, 7, 2, 2);
};

// ----- 家具與物件 (皆有透明背景，繪製在地板之上) -----
const futon = (dirty) => (g) => {
    R(g, dirty ? '#8a7a5a' : '#dcd2e8', 1, 2, 14, 13);
    R(g, dirty ? '#6a5a3a' : '#bba8d8', 1, 2, 14, 2);
    R(g, dirty ? '#7a6a4a' : '#f4eefc', 3, 3, 10, 4); // 枕頭
    if (dirty) { R(g, '#5a4a2a', 4, 9, 3, 2); R(g, '#5a4a2a', 10, 11, 3, 2); R(g, '#9aa05a', 8, 8, 2, 2); }
    else R(g, '#e0d4ee', 3, 9, 10, 2);
};
const cabinet = (g) => {
    R(g, '#6a4226', 0, 1, T, 15); R(g, '#8a5a30', 1, 2, 14, 13);
    R(g, '#6a4226', 7, 2, 2, 13); R(g, '#f2d25a', 5, 8, 1, 2); R(g, '#f2d25a', 10, 8, 1, 2);
};
const counter = (g) => {
    R(g, '#5a3a20', 0, 4, T, 12); R(g, '#9a6a3a', 0, 4, T, 3); R(g, '#7a5028', 1, 8, 14, 7);
    R(g, '#c04a4a', 11, 1, 3, 3); // 鈴
};
const tv = (g) => {
    R(g, '#2a2a30', 1, 1, 14, 10); R(g, '#7ab0c8', 2, 2, 12, 8); R(g, '#a8d0e0', 3, 3, 4, 2);
    R(g, '#2a2a30', 6, 11, 4, 2); R(g, '#3a3a40', 3, 13, 10, 2);
};
const table = (g) => {
    R(g, '#6a4226', 0, 4, T, 3); R(g, '#a8763e', 0, 3, T, 4); R(g, '#6a4226', 1, 7, 2, 8); R(g, '#6a4226', 13, 7, 2, 8);
};
const chair = (g) => {
    R(g, '#6a4226', 3, 2, 10, 6); R(g, '#a8763e', 4, 3, 8, 4); R(g, '#6a4226', 3, 8, 10, 3); R(g, '#6a4226', 3, 11, 2, 4); R(g, '#6a4226', 11, 11, 2, 4);
};
const sofa = (g) => {
    R(g, '#7a4a8a', 0, 3, T, 11); R(g, '#9a66aa', 1, 6, 14, 7); R(g, '#6a3a7a', 0, 3, T, 3); R(g, '#5a2a6a', 0, 13, T, 2);
};
const fridge = (g) => {
    R(g, '#9aa8b0', 2, 0, 12, 16); R(g, '#dbe5e8', 3, 1, 10, 14); R(g, '#9aa8b0', 3, 6, 10, 1);
    R(g, '#7a8890', 11, 3, 1, 2); R(g, '#7a8890', 11, 9, 1, 3);
};
const shelf = (g) => {
    R(g, '#5a3a20', 0, 0, T, T); R(g, '#7a5028', 1, 1, 14, 14);
    R(g, '#5a3a20', 1, 7, 14, 1);
    R(g, '#e85a5a', 3, 3, 3, 4); R(g, '#5ab0e8', 7, 4, 3, 3); R(g, '#f2d25a', 11, 3, 3, 4);
    R(g, '#5ae88a', 3, 10, 3, 5); R(g, '#c85ae8', 8, 11, 4, 4);
};
const curtain = (g) => {
    R(g, '#a8d8c8', 0, 0, T, 13); R(g, '#7fb8a8', 0, 0, T, 2);
    for (let x = 1; x < T; x += 4) R(g, '#8fc8b8', x, 2, 1, 11);
    R(g, '#5a8a80', 0, 13, T, 1);
};
const bedHosp = (g) => {
    R(g, '#c0c8cc', 0, 2, T, 13); R(g, '#f4f4f8', 1, 3, 14, 11); R(g, '#e8e8f0', 2, 4, 12, 4); R(g, '#9ad0e0', 1, 9, 14, 5);
    R(g, '#8a949a', 0, 14, 2, 2); R(g, '#8a949a', 14, 14, 2, 2);
};
const locker = (g) => {
    R(g, '#6a7a8a', 1, 0, 14, 16); R(g, '#8a9aaa', 2, 1, 12, 14); R(g, '#6a7a8a', 7, 1, 2, 14);
    R(g, '#2a2a30', 5, 7, 1, 2); R(g, '#2a2a30', 10, 7, 1, 2);
};
const drawer = (g) => {
    R(g, '#5a3a20', 1, 3, 14, 13); R(g, '#8a5a30', 2, 4, 12, 11); R(g, '#5a3a20', 2, 9, 12, 1);
    R(g, '#f2d25a', 7, 6, 2, 1); R(g, '#f2d25a', 7, 12, 2, 1);
};
const wardrobe = (g) => {
    R(g, '#5a3a20', 0, 0, T, T); R(g, '#8a5a30', 1, 1, 14, 14); R(g, '#5a3a20', 7, 1, 2, 14);
    R(g, '#f2d25a', 5, 8, 1, 2); R(g, '#f2d25a', 10, 8, 1, 2);
};
const plant = (g) => {
    R(g, '#8a4a2a', 5, 10, 6, 5); R(g, '#3a9a4a', 3, 3, 10, 8); R(g, '#5ac86a', 5, 2, 4, 4); R(g, '#2a7a3a', 9, 6, 3, 4);
};
const lamp = (g) => {
    R(g, '#5a4a3a', 7, 6, 2, 9); R(g, '#f2d25a', 4, 1, 8, 6); R(g, '#fff0a0', 5, 2, 6, 3);
};
const box = (g) => {
    R(g, '#8a6a3a', 1, 4, 14, 11); R(g, '#a88a4a', 2, 5, 12, 9); R(g, '#d8c07a', 7, 4, 2, 11);
};
const toybox = (g) => {
    R(g, '#d85a5a', 1, 5, 14, 10); R(g, '#f27a7a', 2, 6, 12, 8); R(g, '#f2d25a', 4, 2, 3, 3); R(g, '#5ab0e8', 9, 1, 3, 4);
};
const balloons = (g) => {
    R(g, '#e85a5a', 2, 1, 5, 6); R(g, '#5ab0e8', 8, 2, 5, 6); R(g, '#f2d25a', 5, 6, 5, 6);
    R(g, '#ddd', 4, 7, 1, 8); R(g, '#ddd', 10, 8, 1, 7); R(g, '#ddd', 7, 12, 1, 3);
};
const cakeBox = (g) => {
    R(g, '#f4e0c8', 1, 5, 14, 10); R(g, '#e88aa8', 1, 5, 14, 3); R(g, '#d8c0a0', 7, 5, 2, 10);
    R(g, '#c04a4a', 2, 10, 4, 2);
};
const rock = (g) => {
    R(g, '#6a6a72', 2, 6, 12, 9); R(g, '#8a8a92', 3, 5, 9, 4); R(g, '#a8a8b0', 4, 5, 4, 2); R(g, '#4a4a52', 2, 13, 12, 2);
};
const sign = (g) => kenney('tiny-town', 11, 6)(g);
const bees = (g) => {
    R(g, '#f2c93a', 2, 3, 4, 3); R(g, '#2a2a2a', 3, 3, 1, 3); R(g, '#d8f0ff', 3, 1, 2, 2);
    R(g, '#f2c93a', 9, 8, 4, 3); R(g, '#2a2a2a', 10, 8, 1, 3); R(g, '#d8f0ff', 10, 6, 2, 2);
    R(g, '#f2c93a', 4, 11, 4, 3); R(g, '#2a2a2a', 5, 11, 1, 3);
};

// ----- 章節新增的物件 -----
const bathtub = (g) => {
    R(g, '#cfd9dd', 0, 3, T, 12); R(g, '#f4f4f8', 1, 4, 14, 10); R(g, '#7ab8e8', 2, 6, 12, 7); R(g, '#a8d4f4', 3, 7, 4, 2);
    R(g, '#9aa8b0', 13, 1, 2, 3);
};
const sinkT = (g) => {
    R(g, '#cfd9dd', 2, 6, 12, 6); R(g, '#f4f4f8', 3, 7, 10, 4); R(g, '#9aa8b0', 7, 3, 2, 4); R(g, '#7ab8e8', 6, 8, 4, 2);
    R(g, '#8fcdf2', 3, 0, 10, 3); R(g, '#c8ecff', 4, 1, 3, 1); // 鏡子
};
const toilet = (g) => {
    R(g, '#e8eef0', 4, 1, 8, 5); R(g, '#f4f4f8', 3, 6, 10, 7); R(g, '#cfd9dd', 4, 12, 8, 2); R(g, '#9aa8b0', 6, 3, 4, 1);
};
const rack = (g) => {
    R(g, '#6a4226', 1, 1, 14, 14); R(g, '#8a5a30', 2, 2, 12, 12);
    R(g, '#f4e0c8', 3, 3, 4, 4); R(g, '#e88aa8', 8, 3, 4, 4); R(g, '#a8d8c8', 3, 8, 4, 4); R(g, '#f2d25a', 8, 8, 4, 4);
};
const elevator = (g) => {
    R(g, '#8a949a', 1, 0, 14, 16); R(g, '#b8c2c8', 2, 1, 6, 14); R(g, '#b8c2c8', 8, 1, 6, 14); R(g, '#6a747a', 7, 1, 2, 14);
    R(g, '#c04a4a', 4, 3, 8, 4); R(g, '#fff', 5, 4, 6, 2); // 故障中
};
const drip = (g) => {
    R(g, '#8a949a', 7, 2, 2, 13); R(g, '#8a949a', 4, 14, 8, 1); R(g, '#8a949a', 4, 1, 8, 1);
    R(g, '#d8f0ff', 4, 2, 3, 6); R(g, '#7ab8e8', 5, 4, 1, 3); R(g, '#e8d8d8', 9, 2, 3, 5);
};
const shelfGoods = (g) => {
    R(g, '#5a6a7a', 0, 0, T, T); R(g, '#8a9aaa', 1, 1, 14, 14); R(g, '#5a6a7a', 1, 7, 14, 1);
    for (let i = 0; i < 4; i++) { R(g, ['#e85a5a', '#f2d25a', '#5ab0e8', '#5ae88a'][i], 2 + i * 3, 3, 2, 4); R(g, ['#f2a25a', '#c85ae8', '#e8e85a', '#5ac8e8'][i], 2 + i * 3, 10, 2, 4); }
};
const oden = (g) => {
    R(g, '#9a9a9a', 0, 5, T, 11); R(g, '#d8d8d8', 1, 6, 14, 8); R(g, '#e8c46a', 2, 4, 12, 4); R(g, '#c8a43a', 3, 8, 3, 3); R(g, '#f4f4f4', 7, 8, 3, 3); R(g, '#c85a3a', 11, 8, 3, 3);
};
const freezer = (g) => {
    R(g, '#5a8ab0', 0, 2, T, 14); R(g, '#a8d4f0', 1, 4, 14, 11); R(g, '#e8f4ff', 3, 6, 4, 3); R(g, '#e8f4ff', 9, 10, 4, 3);
};
const glassDoor = (g) => {
    R(g, '#4a5a6a', 0, 0, T, T); R(g, '#a8d4f0', 1, 1, 6, 14); R(g, '#a8d4f0', 9, 1, 6, 14); R(g, '#e8f4ff', 2, 2, 2, 8); R(g, '#e8f4ff', 10, 2, 2, 8);
};
const bedHome = (g) => {
    R(g, '#6a4226', 0, 1, T, 15); R(g, '#e8d8f4', 1, 3, 14, 12); R(g, '#f4eefc', 2, 4, 5, 4); R(g, '#f4eefc', 9, 4, 5, 4); R(g, '#8a6ad9', 1, 9, 14, 6);
};
const figCase = (g) => {
    R(g, '#5a3a20', 0, 0, T, T); R(g, '#a8d4f0', 1, 1, 14, 14); R(g, '#e8f4ff', 2, 2, 3, 5);
    R(g, '#5a3a20', 1, 7, 14, 1);
    R(g, '#e8c46a', 3, 3, 2, 4); R(g, '#d85a5a', 7, 4, 3, 3); R(g, '#5ab0e8', 11, 3, 2, 4);
    R(g, '#5ae88a', 3, 10, 3, 4); R(g, '#c85ae8', 8, 10, 3, 4); R(g, '#f2a25a', 12, 11, 2, 3);
};
const figSlot = (g) => {
    R(g, '#5a3a20', 0, 0, T, T); R(g, '#a8d4f0', 1, 1, 14, 14); R(g, '#5a3a20', 1, 12, 14, 2);
    R(g, '#c0e0f4', 4, 3, 8, 9); // 空位 (可以站進去假裝公仔)
};
const stove = (g) => {
    R(g, '#5a5a62', 0, 3, T, 13); R(g, '#8a8a92', 1, 4, 14, 11); R(g, '#2a2a30', 3, 5, 4, 4); R(g, '#2a2a30', 9, 5, 4, 4); R(g, '#c04a4a', 5, 11, 2, 2);
};
const bookshelf = (g) => {
    R(g, '#5a3a20', 0, 0, T, T); R(g, '#7a5028', 1, 1, 14, 14);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) R(g, ['#c04a4a', '#4a7ac0', '#4ac07a', '#c0a04a', '#8a4ac0', '#c04a8a'][(i + r) % 6], 2 + i * 2, 2 + r * 4, 2, 3);
};
const cake = (g) => {
    R(g, '#f4e0c8', 2, 8, 12, 6); R(g, '#e88aa8', 2, 8, 12, 2); R(g, '#fff', 3, 6, 10, 3);
    for (const x of [4, 7, 10]) { R(g, '#f2d25a', x, 2, 1, 4); R(g, '#ff9a3a', x, 1, 1, 1); }
    R(g, '#c04a4a', 5, 11, 2, 2); R(g, '#4a7ac0', 9, 11, 2, 2);
};
const rug = (g) => {
    R(g, '#c09a6a', 0, 0, T, T); R(g, '#a07a4a', 0, 0, T, 1); R(g, '#a07a4a', 0, 15, T, 1); R(g, '#d8b88a', 3, 3, 10, 10); R(g, '#b8885a', 5, 5, 6, 6);
};
const summit = (g) => {
    R(g, '#8a8a92', 3, 7, 10, 8); R(g, '#a8a8b0', 4, 6, 8, 3); R(g, '#e8e85a', 7, 3, 2, 4); R(g, '#2a2a30', 7, 9, 2, 2);
};
const luggage = (g) => {
    R(g, '#2a4a8a', 2, 4, 12, 11); R(g, '#4a6aaa', 3, 5, 10, 9); R(g, '#1a2a5a', 6, 2, 4, 3); R(g, '#c8c8c8', 4, 14, 2, 2); R(g, '#c8c8c8', 10, 14, 2, 2);
};
const vanL = (g) => {
    R(g, '#e8e8f0', 0, 3, T, 11); R(g, '#c8c8d8', 0, 3, T, 2); R(g, '#8fcdf2', 4, 5, 6, 4); R(g, '#2a2a30', 2, 13, 5, 3); R(g, '#8a8a92', 3, 14, 3, 2);
};
const vanR = (g) => {
    R(g, '#e8e8f0', 0, 3, 14, 11); R(g, '#c8c8d8', 0, 3, 14, 2); R(g, '#8fcdf2', 2, 5, 8, 4); R(g, '#2a2a30', 8, 13, 5, 3); R(g, '#8a8a92', 9, 14, 3, 2);
    R(g, '#f2d25a', 13, 9, 2, 2);
};
const sleeper = (g) => {
    kenney('tiny-town', 1, 1)(g);
    R(g, '#6b4a2a', 0, 3, T, 3); R(g, '#6b4a2a', 0, 10, T, 3);
};

const GROUND_NAMES = new Set(['grass', 'dirt', 'wood', 'tatami', 'tile', 'carpet', 'hosp', 'concrete', 'rails', 'slope', 'water',
    'wall', 'wallface', 'wallhosp', 'window', 'door', 'stairsup', 'stairsdown', 'glassdoor', 'rug', 'sleeper']);

export const TILE_DEFS = {
    // 地面
    glassdoor: { draw: glassDoor },
    rug: { draw: rug },
    sleeper: { draw: sleeper },
    // 章節物件
    bathtub: { draw: bathtub, solid: true },
    sink: { draw: sinkT, solid: true },
    toilet: { draw: toilet, solid: true },
    rack: { draw: rack, solid: true },
    elevator: { draw: elevator, solid: true },
    drip: { draw: drip },
    shelfgoods: { draw: shelfGoods, solid: true },
    oden: { draw: oden, solid: true },
    freezer: { draw: freezer, solid: true },
    bedhome: { draw: bedHome, solid: true },
    figcase: { draw: figCase, solid: true },
    figslot: { draw: figSlot, solid: true },
    stove: { draw: stove, solid: true },
    bookshelf: { draw: bookshelf, solid: true },
    cake: { draw: cake },
    summit: { draw: summit, solid: true },
    luggage: { draw: luggage, solid: true },
    vanl: { draw: vanL, solid: true },
    vanr: { draw: vanR, solid: true },
    grass: { draw: kenney('tiny-town', 0, 0) },
    dirt: { draw: kenney('tiny-town', 1, 1) },
    wood: { draw: floorWood },
    tatami: { draw: floorTatami },
    tile: { draw: floorTile },
    carpet: { draw: floorCarpet },
    hosp: { draw: floorHosp },
    concrete: { draw: floorConcrete },
    rails: { draw: rails },
    slope: { draw: slope },
    water: { draw: water, solid: true },
    // 牆與出入口
    wall: { draw: wallTop, solid: true },
    wallface: { draw: wallFace, solid: true },
    wallhosp: { draw: wallFaceHosp, solid: true },
    window: { draw: windowTile, solid: true },
    door: { draw: door },
    stairsup: { draw: stairsUp },
    stairsdown: { draw: stairsDown },
    // 家具 (透明背景)
    futon: { draw: futon(false), solid: true },
    futondirty: { draw: futon(true), solid: true },
    cabinet: { draw: cabinet, solid: true },
    counter: { draw: counter, solid: true },
    tv: { draw: tv, solid: true },
    table: { draw: table, solid: true },
    chair: { draw: chair, solid: true },
    sofa: { draw: sofa, solid: true },
    fridge: { draw: fridge, solid: true },
    shelf: { draw: shelf, solid: true },
    curtain: { draw: curtain, solid: true },
    bedhosp: { draw: bedHosp, solid: true },
    locker: { draw: locker, solid: true },
    drawer: { draw: drawer, solid: true },
    wardrobe: { draw: wardrobe, solid: true },
    plant: { draw: plant, solid: true },
    lamp: { draw: lamp, solid: true },
    box: { draw: box, solid: true },
    toybox: { draw: toybox, solid: true },
    balloons: { draw: balloons },
    cakebox: { draw: cakeBox },
    // 戶外
    tree: { draw: kenney('tiny-town', 4, 0), solid: true },
    tree2: { draw: kenney('tiny-town', 4, 1), solid: true },
    bush: { draw: kenney('tiny-town', 5, 0), solid: true },
    tuft: { draw: kenney('tiny-town', 6, 0) },
    mushroom: { draw: kenney('tiny-town', 5, 2) },
    fence: { draw: kenney('tiny-town', 8, 6), solid: true },
    rock: { draw: rock, solid: true },
    sign: { draw: sign, solid: true },
    hive: { draw: kenney('tiny-town', 10, 7), solid: true },
    bees: { draw: bees },
    barrel: { draw: kenney('tiny-dungeon', 10, 6), solid: true },
    chest: { draw: kenney('tiny-dungeon', 5, 7), solid: true },
};

const names = Object.keys(TILE_DEFS);
export const TILE_INDEX = Object.fromEntries(names.map((n, i) => [n, i]));

let atlas = null;
const ATLAS_COLS = 16;

/** 建立圖塊集；需在 Kenney 圖片載入完成後呼叫 */
export function buildAtlas() {
    const rows = Math.ceil(names.length / ATLAS_COLS);
    atlas = canvas(ATLAS_COLS * T, rows * T);
    const ag = atlas.getContext('2d');
    names.forEach((name, i) => {
        const c = canvas(T, T);
        const g = c.getContext('2d');
        TILE_DEFS[name].draw(g);
        ag.drawImage(c, (i % ATLAS_COLS) * T, Math.floor(i / ATLAS_COLS) * T);
    });
    return atlas;
}

export function drawTile(ctx, name, x, y) {
    const i = TILE_INDEX[name];
    if (i === undefined || !atlas) return;
    ctx.drawImage(atlas, (i % ATLAS_COLS) * T, Math.floor(i / ATLAS_COLS) * T, T, T, Math.round(x), Math.round(y), T, T);
}

export function isSolidTile(name) {
    return !!(TILE_DEFS[name] && TILE_DEFS[name].solid);
}

/** 地面型圖塊 (不是疊在地板上的物件) */
export function isGroundTile(name) {
    return GROUND_NAMES.has(name);
}

// ---------------------------------------------------------------------
// 角色走路圖：每個角色 4 方向 x 3 格 (站立 / 左腳 / 右腳)，每格 16x16
// ---------------------------------------------------------------------

const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };
const charCache = new Map();

function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, v + amt));
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

function drawChar(g, ox, oy, look, dir, frame) {
    const small = look.small;
    const top = small ? 3 : 0; // 小孩整體往下移，顯得比較矮
    const bob = frame === 0 ? 0 : -1;
    const x = ox + 4;
    const y = oy + top;
    const skin = look.skin;
    const legH = small ? 1 : 4;
    // 腿
    const legA = frame === 1 ? 1 : 0;
    const legB = frame === 2 ? 1 : 0;
    R(g, look.pants, x + 1, y + 12 - legA, 3, legH + legA);
    R(g, look.pants, x + 4, y + 12 - legB, 3, legH + legB);
    // 身體
    R(g, look.shirt, x, y + 7 + bob, 8, 5);
    R(g, shade(look.shirt, -30), x, y + 11 + bob, 8, 1);
    // 手
    R(g, skin, x - 1, y + 8 + bob + (frame === 1 ? 1 : 0), 1, 3);
    R(g, skin, x + 8, y + 8 + bob + (frame === 2 ? 1 : 0), 1, 3);
    // 頭 (大頭狀態：被蜂叮、臉腫起來，頭變大)
    const big = !!look.bigHead;
    const hx = big ? x - 2 : x; // 頭的左緣
    const hw = big ? 12 : 8; // 頭寬
    const hy = big ? y - 2 + bob : y + bob; // 頭的上緣 (頭髮頂端)
    R(g, skin, hx, hy + 1, hw, big ? 11 : 7);
    // 頭髮與臉
    const hair = look.hair;
    if (dir === 'up') {
        R(g, hair, hx - 1, hy, hw + 2, big ? 11 : 8);
        if (look.hairStyle === 'long') R(g, hair, hx - 1, hy + 3, hw + 2, 7);
    } else {
        R(g, hair, hx - 1, hy, hw + 2, 3);
        R(g, hair, hx - 1, hy, 1, 5); R(g, hair, hx + hw, hy, 1, 5);
        if (look.hairStyle === 'long') { R(g, hair, hx - 1, hy + 3, 2, 6); R(g, hair, hx + hw - 1, hy + 3, 2, 6); }
        if (look.hairStyle === 'bun') R(g, hair, hx + 2, hy - 2, 4, 3);
        if (look.pigtails) { R(g, hair, hx - 2, hy + 3, 2, 4); R(g, hair, hx + hw, hy + 3, 2, 4); }
    }
    // 眼睛 (大頭時眼睛位置往下，並加上紅腫的臉頰)
    const ey = hy + (big ? 7 : 5);
    if (big && dir !== 'up') { R(g, '#e8786a', hx + 1, ey + 2, 3, 2); R(g, '#e8786a', hx + hw - 4, ey + 2, 3, 2); }
    if (dir === 'down') {
        R(g, '#222', hx + (big ? 2 : 1), ey, 2, 2); R(g, '#222', hx + hw - (big ? 4 : 3), ey, 2, 2);
        if (look.glasses) { R(g, '#222', hx, ey - 1, hw / 2, 1); R(g, '#222', hx + hw / 2, ey - 1, hw / 2, 1); }
    } else if (dir === 'left') {
        R(g, '#222', hx + 1, ey, 2, 2);
        if (look.glasses) R(g, '#222', hx, ey - 1, hw / 2, 1);
    } else if (dir === 'right') {
        R(g, '#222', hx + hw - 3, ey, 2, 2);
        if (look.glasses) R(g, '#222', hx + hw / 2, ey - 1, hw / 2, 1);
    }
}

/** 取得角色走路圖 (3x4 格) */
export function charSheet(id, look) {
    if (charCache.has(id)) return charCache.get(id);
    const c = canvas(3 * T, 4 * T);
    const g = c.getContext('2d');
    for (const [dir, row] of Object.entries(DIR_ROW)) {
        for (let f = 0; f < 3; f++) drawChar(g, f * T, row * T, look, dir, f);
    }
    charCache.set(id, c);
    return c;
}

export function drawChar16(ctx, sheet, dir, frame, x, y) {
    ctx.drawImage(sheet, frame * T, DIR_ROW[dir] * T, T, T, Math.round(x), Math.round(y), T, T);
}

/** 畫一張 Q 版頭像 (佔位用)，回傳 canvas */
export function placeholderPortrait(look, size = 64) {
    const c = canvas(size, size);
    const g = c.getContext('2d');
    R(g, '#3b3560', 0, 0, size, size);
    const l = look || { skin: '#ddd', hair: '#444', hairStyle: 'short', shirt: '#888', pants: '#444' };
    const tmp = canvas(T, T);
    drawChar(tmp.getContext('2d'), 0, 0, { ...l, small: false }, 'down', 0);
    // 只取頭與肩膀 (上半 12 列)，放大填滿
    g.imageSmoothingEnabled = false;
    g.drawImage(tmp, 2, 0, 12, 12, 0, 0, size, size);
    return c;
}

/** 用 Kenney 圖示或程式圖塊畫道具圖 (選單使用) */
export function iconCanvas(def, size = 32) {
    const c = canvas(size, size);
    const g = c.getContext('2d');
    if (def.sheet) {
        const img = getImage(def.sheet);
        if (img) g.drawImage(img, def.col * T, def.row * T, T, T, 0, 0, size, size);
    } else if (def.tile) {
        const t = canvas(T, T);
        if (TILE_DEFS[def.tile]) TILE_DEFS[def.tile].draw(t.getContext('2d'));
        g.drawImage(t, 0, 0, size, size);
    } else if (def.emoji) {
        g.font = `${size * 0.8}px sans-serif`;
        g.textBaseline = 'middle';
        g.textAlign = 'center';
        g.fillText(def.emoji, size / 2, size / 2 + 2);
    }
    return c;
}
