// 使用者素材設定：只需要編輯這個檔案並把圖片放進對應資料夾，不需要改程式。
// 圖片路徑都是相對於 assets/user/ 的路徑；填 null 代表還沒提供，遊戲會自動使用佔位素材。

export default {
    // 8 位角色的顯示名稱與 Q 版頭像 (建議 128x128 以上的正方形 PNG，背景透明或單色皆可)
    characters: {
        dad: { name: '壽星', portrait: null }, // 例：'portraits/dad.png'
        mom: { name: '配偶', portrait: null },
        son: { name: '兒子', portrait: null },
        fb_dad: { name: '朋友 B 爸', portrait: null },
        fb_mom: { name: '朋友 B 媽', portrait: null },
        daughter: { name: '女兒', portrait: null },
        pa: { name: '路人甲', portrait: null },
        pb: { name: '路人乙', portrait: null },
    },

    // 壽星正面照 (老鬼用)：建議已去背或背景單純，例：'ghost/face.png'
    ghostFace: null,

    // 慶生照片 (依序輪播)，例：['photos/01.jpg', 'photos/02.jpg']
    photos: [],

    // 片尾祝福：who 對應上面的角色 id (共 7 位，壽星本人不用寫)
    blessings: [
        { who: 'mom', text: '生日快樂！謝謝你一直都這麼辛苦。' },
        { who: 'son', text: '爸爸生日快樂！' },
        { who: 'fb_dad', text: '又老一歲了，祝你更帥更健康！' },
        { who: 'fb_mom', text: '生日快樂，今年也要平安喔。' },
        { who: 'daughter', text: '叔叔生日快樂！' },
        { who: 'pa', text: '生日快樂，下次換你請客。' },
        { who: 'pb', text: '生日快樂，天天開心。' },
    ],
};
