# 測試制具查詢系統 · Bike Test Instruction

腳踏車品管部門的「測試制具查詢系統」。供應商可查詢各測試項目所需的制具清單與安裝步驟、填報庫存盤點；管理員可維護測試項目、制具庫與供應商名單，並檢視跨供應商盤點與變更歷史。

A fixture-finder portal for a bicycle QC department. Vendors look up the fixtures and setup steps for each ISO 4210 test and file stock-takes; admins manage test items, the fixture library and the vendor list, and review cross-vendor inventory and an audit trail.

純靜態網站（HTML + React 透過瀏覽器端 Babel 轉譯），無需建置步驟、無後端。資料以瀏覽器 `localStorage` 儲存（示範用）。

---

## 線上展示 / Demo accounts

| 角色 Role | 登入 Sign in | 密碼 Code |
|---|---|---|
| 供應商 Vendor | 於名單選擇公司 | `1234` |
| 管理員 Admin | 切到「管理員」分頁 | `admin` |

---

## 部署到 GitHub Pages

### 方法 A — Actions 自動部署（建議）
1. 在 GitHub 建立新 repo，將本資料夾所有內容（含 `.github/`、`.nojekyll`）推上去。
2. Repo → **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
3. 推送到 `main` 後，內附的 `.github/workflows/deploy.yml` 會自動部署。
4. 完成後網址為 `https://<你的帳號>.github.io/<repo 名稱>/`。

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<repo>.git
git push -u origin main
```

### 方法 B — 直接從分支發佈
Repo → **Settings → Pages → Source** 選 **Deploy from a branch**，分支選 `main`、資料夾選 `/ (root)`，存檔即可。（`.nojekyll` 已內附，避免 Jekyll 處理。）

### 本機預覽 / Run locally
因為使用相對路徑載入多個檔案，請用本機伺服器（不要用 `file://` 直接開）：
```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

---

## 檔案結構 / Structure

```
index.html            入口；載入下列資源
styles.css            全部樣式（三種設計方向 + 元件）
data.js               測試項目與制具預設資料、i18n 文案
theme.js              三種設計方向（Blueprint / Workshop / Datasheet）
auth.js               供應商 / 管理員登入（示範）
store.js              資料層：測試/制具/供應商編輯、稽核日誌、備份還原
tweaks-panel.jsx      設計方向切換面板
components.jsx        共用元件與圖示
fixtures.jsx          制具總覽、庫存盤點
admin.jsx             管理員：跨供應商盤點儀表板
admin-manage.jsx      管理員：測試/制具/供應商 CRUD + 備份
history.jsx           變更歷史（依日期）
app.jsx               路由、語言、主框架
uploads/              真實制具 CAD 圖
```

---

## 功能 / Features
- 測試項目搜尋、分類篩選、詳情（參數、制具清單、安裝步驟、對應標準）
- 制具總覽（反查制具用於哪些測試）＋庫存狀態、缺料篩選、BOM 匯出
- 供應商登入、各廠商獨立庫存盤點，記錄盤點人與時間
- 管理員：跨供應商盤點矩陣、測試/制具/供應商 CRUD、自訂示意圖上傳
- 變更歷史稽核軌跡、JSON 備份／還原
- 中／EN 雙語、響應式、三種設計方向、可列印

---

## 後續：正式雲端共用
目前資料存於瀏覽器本機（示範）。要做多人即時共用，建議：
- 後端：Firebase / Supabase 取代 `store.js` 的 localStorage 讀寫；
- 登入：Google OAuth 取代示範密碼。
在此之前，可用管理中心的「備份與雲端」匯出 JSON，放共用 Google 雲端硬碟在團隊間傳遞同一份資料。

> 制具 CAD 圖為專案隨附素材；其餘為示範資料。
