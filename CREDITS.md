# 素材來源與授權

本專案只使用允許免費使用的素材。第三方素材皆為 CC0 (公眾領域貢獻)，不需要標註作者，但仍在此列出來源。

## 圖像

| 素材 | 來源 | 授權 | 使用位置 |
|---|---|---|---|
| Tiny Town (地形、樹木、柵欄、蜂窩、告示牌、鑰匙圖示) | Kenney — https://kenney.nl/assets/tiny-town | CC0 1.0 | `assets/tiles/tiny-town.png` |
| Tiny Dungeon (木桶、寶箱、藥水圖示) | Kenney — https://kenney.nl/assets/tiny-dungeon | CC0 1.0 | `assets/tiles/tiny-dungeon.png` |

授權文字備份在 `assets/tiles/LICENSE-kenney-*.txt`。

## 自行繪製 (程式產生)

下列圖像沒有使用第三方素材，由 `js/engine/sprites.js`、`js/engine/ghostface.js` 以程式繪製，本專案自有：

- 室內地板、牆壁、門、樓梯，以及所有家具 (棉被、櫃子、沙發、電視、冰箱、病床、隔簾、公仔架等)
- 8 位角色與主角的走路圖、佔位頭像
- 老鬼的佔位外觀與老化道具 (白頭髮、皺紋、老花眼鏡、拐杖)

## 音效

| 素材 | 來源 | 授權 | 使用位置 |
|---|---|---|---|
| RPG Audio (腳步、開門、關門、鎖住、衣物) | Kenney — https://kenney.nl/assets/rpg-audio | CC0 1.0 | `assets/audio/se/footstep.ogg` `door_open.ogg` `door_close.ogg` `locked.ogg` `cloth.ogg` |
| Interface Sounds (確認、錯誤、選擇、返回、取得道具) | Kenney — https://kenney.nl/assets/interface-sounds | CC0 1.0 | `assets/audio/se/ok.ogg` `ng.ogg` `select.ogg` `back.ogg` `item.ogg` |

其餘音效 (打噴嚏、抓癢、老鬼出現、嚇暈、蜜蜂、文字音、成功音等) 由 `js/engine/audio.js` 以 Web Audio 即時合成。

## 音樂

背景音樂全部由 `js/content/music.js` 的樂譜在執行期合成，不含任何第三方音樂檔。
結局曲使用〈Happy Birthday to You〉旋律，該旋律在美國已屬公眾領域。

## 使用者提供的素材

頭像、壽星照片、慶生照片、祝福文字由專案擁有者自行提供，放在 `assets/user/`，不在此列出。
