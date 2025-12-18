# GA4 可測試網站 (React + Vite)

用於演練 GA4 事件與漏斗的最小可行站點，包含註冊、登入、方案選擇、結帳與功能使用事件。

## 快速開始
1) 安裝依賴：`npm install`  
2) 設定 GA4：複製 `.env.example` 為 `.env.local`，填入 `VITE_GA_MEASUREMENT_ID=G-XXXX`。  
3) 啟動：`npm run dev`，在瀏覽器開啟提示的 localhost。  
4) 驗證：在 GA DebugView 觀察事件是否正確送出。未填 measurement id 時，事件會以 `[ga-stub]` 形式印在 console 方便離線測試。

## 事件表
| 事件名稱 | 觸發時機 | 主要參數 |
| --- | --- | --- |
| `page_view` (GA 內建) | 頁面載入或路由變化 | GA 自動帶 page_location 等 |
| `start_signup` | 點擊「開始註冊」CTA | `method` |
| `sign_up` | 完成註冊 | `method`, `plan_id` |
| `login` | 回訪用戶登入 | `method`, `plan_id` |
| `view_pricing` | 查看方案按鈕 | `plan_id` |
| `select_plan` | 點擊方案卡片 | `plan_id` |
| `begin_checkout` | 開始結帳 | `plan_id`, `value`, `currency` |
| `purchase` | 完成購買 | `plan_id`, `value`, `currency`, `transaction_id` |
| `feature_use` | 點擊任何核心功能按鈕 | `feature_id`, `plan_id`, `logged_in` |

### 如何對應你的需求
- 註冊漏斗：在「探索 > 漏斗探索」設定路徑 `page_view → start_signup → sign_up → begin_checkout → purchase`。  
- 功能使用率：看 `feature_use`，以 `feature_id` 分組，`plan_id` 為次級維度。  
- 新 / 回訪：GA4 內建維度「新使用者 / 回訪使用者」，可搭配 `sign_up`、`feature_use`、`login` 切分。  
- 不同方案差異：所有核心事件都帶 `plan_id`，可在交叉表或漏斗中比對 free/pro/enterprise。

## GA 實作說明
- 事件送出：`src/analytics.ts` 會在有 measurement id 時載入 GA gtag 並呼叫 `gtag('event', ...)`；未設定時則在 console 以 `[ga-stub]` 記錄，方便本機操作。  
- 事件掛點：`src/App.tsx` 的按鈕已連動事件，可直接在頁面上點擊演練。  
- 參數風格：小寫蛇形，遵循 GA4 推薦命名，確保能在報表中當作自訂維度使用。  
- SPA 頁面：如改為多頁/路由，需要在路由變化時手動送 `page_view`，目前為單頁不需額外處理。

## 驗證建議
1) 開 DebugView：點擊頁面各按鈕，確認事件名稱與參數值。  
2) 做一次完整流程：start_signup → sign_up → select_plan → begin_checkout → purchase。  
3) 切換 plan 與功能按鈕：觀察 feature_use 的 plan_id/feature_id 變化。  
4) 以無痕視窗重走流程：對比新 / 回訪用戶的行為與功能使用率。
