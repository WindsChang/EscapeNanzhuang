# Design

## Context

專案目前是空的，只有 OpenSpec 設定，沒有既有程式碼。動機與範圍見 proposal.md，各功能的行為規格見 `specs/`。

影響技術選擇的限制：

- 部署在 GitHub Pages：只能是靜態檔案，且網址會在子路徑 `/<repo>/` 下
- 手機 (多半從 LINE 點開) 與電腦都要能玩；行動瀏覽器會阻擋自動播放聲音
- 開發者 (使用者本人) 需要能自行替換素材與文字，不應該要碰程式
- 慶生是一次性活動，重視「做得出來、穩定、好改」勝過可擴充性

## Goals / Non-Goals

**Goals:**

- 零建置：clone 下來用任何靜態伺服器打開就能跑，push 上去就是部署
- 劇情內容 (對話、事件、地圖) 與引擎程式分開，改劇情不需要改引擎
- 每個章節可以獨立測試 (除錯跳關)，方便分章節開發與驗收

**Non-Goals:**

- 不做通用的 RPG 引擎或地圖編輯器
- 不支援多語系，所有文字為繁體中文
- 不做線上存檔、排行榜、多人或任何後端
- 不追求跨瀏覽器的舊版支援，以近兩年的 iOS Safari、Android Chrome、桌機 Chrome / Edge 為目標
- 不做無障礙的完整支援 (例如螢幕閱讀器)，但文字大小與對比需在手機上易讀

## Decisions

### D1. 原生 JavaScript (ES Modules) + Canvas 2D，不使用遊戲框架

- 用 `<script type="module">` 直接載入，瀏覽器原生支援，不需要打包工具
- Canvas 2D 足以處理 16px 格子圖塊、角色動畫與簡單特效 (淡出、閃爍、色調)
- 替代方案：
  - **Phaser**：功能完整，但體積大 (約 1MB)、要從 CDN 或 vendor 進來，且學習成本對這個規模不划算
  - **RPG Maker MZ 匯出網頁版**：最像青鬼，但需要付費授權、專案檔非純文字難以版控，且客製化 (紅疹量表、公仔偽裝、照片輪播) 受限
  - **DOM / CSS 排版**：格子地圖與大量圖塊的效能和像素清晰度不如 Canvas

### D2. 內部解析度 320x240、16px 圖塊，整數倍縮放

- 與原版青鬼 (RPG Maker 2000) 同比例，一個畫面 20x15 格，CC0 像素素材多為 16px
- 依可用空間取最大整數倍縮放並設 `image-rendering: pixelated`，保持像素銳利
- 手機直式時 Canvas 置頂，下方空間放虛擬方向鍵與按鈕；橫式時按鈕疊在畫面左右兩側半透明顯示
- 對話文字另以較高解析度繪製 (或疊一層 DOM 對話框)，避免 320px 寬度下中文字太小糊掉。決定：**對話框、選單、謎題介面使用 DOM 疊在 Canvas 上方**，地圖與角色在 Canvas。中文字在 DOM 用系統字型即可清晰顯示，也省去點陣中文字型的授權與檔案大小問題

### D3. 程式結構

```
index.html
css/style.css
js/
  main.js            進入點、主迴圈 (requestAnimationFrame)、場景堆疊
  engine/
    input.js         鍵盤 + 觸控統一成抽象指令 (up/down/left/right/ok/cancel)
    renderer.js      縮放、繪製圖塊與角色、特效
    map.js           地圖載入、碰撞、出入口
    actor.js         主角、NPC、老鬼的位置與動畫
    ghost.js         老鬼 AI (BFS 尋路、跨地圖跟隨、速度與難度補償)
    hide.js          躲藏機制 (棉被紅疹量表、隔簾、公仔偽裝、一般躲藏點)
    script.js        劇情腳本執行器 (async 指令序列)
    dialog.js        DOM 對話框、選項
    puzzle.js        密碼鎖、排列謎題 UI
    menu.js          遊戲中選單
    save.js          localStorage 存讀檔、版本檢查
    audio.js         BGM / SE 管理、解鎖、淡出淡入
    assets.js        預先載入、缺件時回傳佔位素材
    state.js         道具、旗標、嚇暈次數、目前章節
    debug.js         ?debug=1 時才載入
  content/
    characters.js    角色 id、顯示名稱、頭像路徑
    chapters/
      prologue.js
      day1.js        地圖資料 + 事件 + 劇情腳本
      day2.js
      day3.js
assets/
  tiles/  sprites/  audio/bgm/  audio/se/   CC0 素材
  user/
    portraits/<角色id>.png    使用者提供的 Q 版頭像
    ghost/face.png            壽星照片
    photos/01.jpg ...         慶生照片
    config.js                 角色名稱、祝福文字、照片清單
CREDITS.md       素材來源與授權
DEPLOY.md        GitHub Pages 部署與 private/public 切換說明
```

- `content/` 與 `assets/user/` 是使用者會改的部分，其他是引擎
- 照片清單寫在 `config.js` 而不是自動掃描資料夾，因為 GitHub Pages 無法列出目錄內容

### D4. 地圖以 JS 陣列 + 字元圖例定義

- 每張地圖以字串陣列表示，每個字元對應一種圖塊 (例如 `#` 牆、`.` 地板、`B` 棉被)，搭配圖例表對應到 tileset 座標與是否阻擋
- 物件、出入口、NPC、事件觸發點另以清單標在座標上
- 替代方案：**Tiled 地圖編輯器 + JSON 匯出**。視覺化較好，但多一個工具與轉換流程；本專案共約 10 張小地圖，用文字定義在 diff 裡也看得懂，修改更直接。如果之後地圖美化需求變高再改用 Tiled
- 預計地圖：旅館 2F、旅館 1F、浴室 (過場)、加里山 (一張長的縱向捲動地圖)、醫院樓層、醫院 1F 便利商店、透天 1F / 2F / 3F，共約 9-10 張

### D5. 劇情以 async 指令序列撰寫

```js
// 示意，非最終 API
async ({ say, choice, move, fade, give, flag, bgm, ghost }) => {
  await bgm('day1_night');
  await say('wife', '你皮膚很敏感耶，等下洗完澡記得擦藥');
  if (await choice(['開門逃出去', '回頭']) === 0) { ... }
}
```

- 用 async/await 讓劇情讀起來像劇本，條件分支直接用 JS
- 執行劇情時暫停玩家輸入與老鬼 (除非該指令明確要老鬼繼續動)
- 替代方案：JSON 事件表。可序列化但分支與等待寫起來冗長，劇本可讀性差

### D6. 老鬼 AI：BFS 尋路 + 青鬼式跟隨

- 每次移動完一格就重新以 BFS 計算到主角的下一步，地圖最大約 40x30 格，計算量可忽略
- 主角在追逐中穿過出入口時記錄出入口與時間，老鬼在延遲 (預設約 2 秒) 後於同一出入口的目的地出現
- 主角躲藏時，老鬼改為走向最後看到主角的位置並在附近徘徊一段時間後放棄，追逐結束
- 難度補償：嚇暈次數門檻預設 `3 / 5 / 8`，對應老鬼速度倍率與提示開關，數值集中在一個設定物件，方便測試後調整

### D7. 存檔格式

- `localStorage` key：`escape-nanzhuang:slot:{auto|1|2|3}`、`escape-nanzhuang:settings`、`escape-nanzhuang:meta` (累計嚇暈次數、是否通關)
- 內容為 JSON：`{ version, chapter, mapId, x, y, facing, items, flags, savedAt }`
- 嚇暈次數放在 `meta` 而不是存檔欄位，所以讀檔不會讓嚇暈次數歸零 (符合難度補償的目的)
- `version` 不符或 JSON 解析失敗時視為無法讀取的欄位
- 所有 `localStorage` 存取包在 try/catch，失敗時以記憶體暫存並提示

### D8. 音訊使用 Web Audio API

- 第一次點擊時建立 / resume `AudioContext`，之後所有聲音經由它播放，可統一控制 BGM 與 SE 兩條音量
- BGM 用 `fetch` + `decodeAudioData` 解碼，以 GainNode 做淡出淡入
- `visibilitychange` 時 suspend / resume
- 音檔使用 `.mp3` (iOS Safari 對 ogg 支援不穩)，BGM 每首控制在 1MB 以內
- 替代方案：`<audio>` 元素。簡單，但 iOS 上同時播放多個與音量控制有限制

### D9. 老鬼外觀的合成

- 執行期在離屏 Canvas 上合成：`face.png` 縮放成大頭 → 以 `multiply` / `color` 混合套上藍色調 → 疊上章節對應的老化道具圖層 (白頭髮、皺紋、老花眼鏡) → 接上小身體 sprite (Day 3 加拐杖)
- 合成一次後快取成 sprite，地圖中直接使用
- 對話與跳出嚇人的演出時使用較大尺寸版本
- 好處：使用者只要給一張照片，四種外觀與尺寸都自動產生；不必事先手工修圖

### D10. 素材來源

- 圖塊與角色走路圖：以 Kenney (CC0) 為優先，不足的部分從 OpenGameArt 挑選 CC0 素材；特殊物件 (過敏棉被、蜂窩、公仔、點滴架、鹹酥雞) 若找不到合適的就自行以像素繪製簡單版本
- 8 位角色走路圖：用同一套角色素材改顏色/髮型區分，辨識度主要靠對話頭像
- 音效與音樂：以 CC0 為優先 (例如 Kenney 音效包、OpenGameArt、freesound 的 CC0 項目)
- 所有第三方素材記錄在 `CREDITS.md`

### D11. 測試策略

- 遊戲以手動遊玩驗收為主，每章完成後依 specs 的 Scenario 逐項確認
- 除錯模式 (`?debug=1`)：章節跳轉、無敵、顯示座標、直接給道具、設定嚇暈次數 (測難度補償)
- 存檔、難度補償數值等純邏輯部分，若方便可用瀏覽器開一個 `tests.html` 跑簡單斷言，不引入測試框架
- 實機測試：至少一台 iPhone (Safari) 與一台 Android (Chrome)，以及桌機 Chrome

## Risks / Trade-offs

- **[iOS Safari 的觸控與音訊特殊行為]** → 早期就在 iPhone 上實機測試輸入與聲音解鎖，不等到最後；觸控區加上 `touch-action: none` 與防止雙擊縮放
- **[CC0 素材風格不一致]** → 盡量同一個作者/素材包；選定 tileset 後再開始畫地圖
- **[壽星照片合成效果不好笑或很怪]** → 合成參數 (大頭比例、色調強度) 集中可調，先用佔位照片做出流程，拿到真實照片再微調
- **[難度太高，壽星卡關掃興]** → 難度補償 + 除錯模式下由朋友先試玩一輪，依試玩結果調整門檻與倒數時間
- **[Day 2 縱向長地圖在手機上視野太小]** → 鏡頭跟隨主角並在岔路前放提示；必要時把山路切成 2-3 張地圖
- **[public 期間照片與歷史外流]** → 使用者已確認照片為壽星已公開於 IG 的內容；DEPLOY.md 提醒 commit 歷史的可見性
- **[repo 切回 private 後 Pages 下架]** → 這是預期行為；DEPLOY.md 說明重新公開時要確認 Pages 設定
- **[localStorage 在部分無痕模式不可用]** → 包 try/catch 並提示，不影響一次玩完的流程
- **[檔案大小拖慢手機載入]** → 圖片使用 PNG 小圖塊、照片壓縮為長邊 1600px 以內的 JPEG，BGM 壓縮，載入畫面顯示進度

## Migration Plan

全新專案，無遷移。部署步驟：

1. 本機以靜態伺服器 (例如 `npx serve` 或 `uvx` 啟動的 `python -m http.server`) 開發測試
2. push 到 GitHub (private)
3. 測試或遊玩前：repo 切 public → Settings / Pages 選擇 `main` 分支根目錄 → 取得網址
4. 遊玩結束後切回 private (Pages 自動下架)

## Open Questions

以下不影響架構與任務拆分，可以在實作中或拿到素材後再決定：

- 專屬梗 (口頭禪、糗事) 要放進哪些對話：先用一般台詞，之後替換 `content/chapters/*.js` 的字串即可
- 壽星實際收藏的 4 隻公仔：先用通用造型，之後替換公仔圖與畫冊圖
- Day 2 便利商店大家在吃的食物：先寫關東煮/泡麵，之後可換成真實的
- 是否加入真人錄音 (口頭禪、結局喊生日快樂)：音訊系統已支援任意音效，有錄音時加一個 SE 即可
- 8 位角色的顯示名稱：放在 `assets/user/config.js`，先用「壽星」「配偶」「兒子」等稱呼佔位
- 難度補償門檻與 Day 2 倒數秒數的最終數值：依試玩結果調整
