# 部署與測試說明

遊戲是純靜態網頁，不需要建置，也不需要後端。所有資源都使用相對路徑，可以放在 GitHub Pages 的子路徑
(`https://<帳號>.github.io/<repo>/`) 下。

## 本機測試

在專案根目錄啟動任何靜態伺服器即可，例如：

```bash
npx --yes serve -l 8080 .
# 或
python -m http.server 8080
```

然後開啟 `http://localhost:8080/`。

- 除錯模式：網址加上 `?debug=1` (例如 `http://localhost:8080/?debug=1`)，左上角會出現除錯按鈕，可以跳到任一章節、
  開無敵、顯示座標、給道具、設定嚇暈次數。一般網址不會有任何除錯介面。
- 想在桌機上預覽觸控控制：網址加上 `?touch=1`。
- 邏輯測試：`node --test tests/*.test.mjs`

## 放入你的素材

1. 把圖片放進 `assets/user/` 底下對應的資料夾 (`portraits/`、`ghost/`、`photos/`)
2. 編輯 `assets/user/config.js`，填入檔名、角色名稱、祝福文字
3. 沒有提供的素材會自動用佔位素材，不會影響遊玩

照片建議長邊壓縮到 1600px 以內的 JPEG，頭像 128x128 以上的正方形 PNG。

## 發布到 GitHub Pages (遊玩或測試時)

repo 平時保持 **private**。要給人玩或自己測試時才切成 public：

1. GitHub repo → Settings → General → 最下方 Danger Zone → **Change visibility** → Make public
2. Settings → Pages → Source 選 **Deploy from a branch**，Branch 選 `main` / `(root)` → Save
3. 等 1～2 分鐘，Pages 頁面上方會出現網址 `https://<帳號>.github.io/<repo>/`

## 玩完之後切回 private

1. Settings → General → Danger Zone → Change visibility → Make private
2. 切回 private 後，免費方案的 Pages 會自動下架，網址會失效

之後再次切成 public 時，請到 Settings → Pages 確認設定還在 (通常會保留，若不見了就重新做上面第 2 步)。

## 注意事項

- **commit 歷史會一起公開**：repo 是 public 的那段時間，整個歷史都看得到，包括之後刪掉的舊照片。
  如果照片中途換過，舊的也還在歷史裡。想避免的話，把最後要用的照片留到最後一刻才 commit。
- **存檔只存在玩家的瀏覽器**：存檔放在瀏覽器的 localStorage，換裝置、換瀏覽器或清除網站資料都不會帶過去。
  無痕模式可能無法保存存檔，遊戲仍可遊玩，但會提示無法保存。
- **音效格式**：音效檔為 `.ogg`，近年的 iOS Safari / Android Chrome / 桌機瀏覽器都支援；
  很舊的 iOS 版本可能沒有音效，但音樂是即時合成的不受影響，遊戲仍可正常進行。
- 手機瀏覽器需要玩家先點一下畫面才會出聲，這是瀏覽器限制，標題畫面的「點擊開始」就是為了這件事。
