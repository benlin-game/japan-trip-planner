# Japan Trip Planner 🗾

多人協作的日本旅遊行程規劃工具，支援即時同步、AI 旅遊助理、預算追蹤、Google Maps 整合。

---

## 功能清單

- **旅程管理**：建立旅程並生成6碼邀請碼，邀請旅伴加入
- **行程規劃**：依天數規劃景點，支援拖拉排序（dnd-kit），自動計算出發/抵達時間
- **即時同步**：透過 Supabase Realtime，多人同時編輯即時可見
- **線上人數**：頂部顯示目前正在瀏覽的旅伴（Presence）
- **地圖模式**：Google Maps 標記每日景點，點擊顯示詳細資訊
- **航班查詢**：快速連結6大航空公司至 Google Flights，Skyscanner 比價
- **預算追蹤**：記錄各成員花費，分類統計，JPY/TWD 雙幣顯示
- **AI 助理**：Gemini 1.5 Flash 驅動，了解旅程背景，提供個人化建議
- **PDF 匯出**：一鍵匯出完整行程表 PDF

---

## 安裝步驟

### 前置需求

- Node.js 18+
- pnpm（或 npm/yarn）
- Supabase 帳號
- Google Gemini API Key
- Google Maps API Key（選用）

### 1. 複製專案

```bash
git clone <repo-url>
cd japan-trip-planner
```

### 2. 安裝依賴

```bash
pnpm install
# 或
npm install
```

### 3. 設定環境變數

複製 `.env.example` 為 `.env.local`：

```bash
cp .env.example .env.local
```

填入對應的值（見下方說明）。

---

## Supabase 設定

### 1. 建立 Supabase 專案

前往 [supabase.com](https://supabase.com) 建立新專案。

### 2. 執行 Schema

在 Supabase Dashboard → SQL Editor，貼上並執行 `supabase/schema.sql` 的完整內容。

此 SQL 將建立：
- `trips` — 旅程主表
- `trip_members` — 旅伴表
- `itinerary_items` — 行程景點
- `chat_messages` — AI 對話記錄
- `budgets` — 費用記錄

並設定 RLS 政策（允許匿名存取）及開啟 Realtime。

### 3. 取得 API 金鑰

在 Supabase Dashboard → Settings → API：
- `NEXT_PUBLIC_SUPABASE_URL`：Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：anon/public key

---

## 環境變數設定

編輯 `.env.local`：

```env
# Supabase（必填）
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini AI（必填，只用於伺服器端）
GEMINI_API_KEY=AIzaSy...

# Google Maps（選填，地圖功能需要）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

> **安全重要事項**：`GEMINI_API_KEY` 絕對不可加 `NEXT_PUBLIC_` 前綴，只在 `/api/chat` 路由的伺服器端使用。

---

## 本地開發

```bash
pnpm dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

---

## 部署到 Vercel

### 1. 推送到 GitHub

```bash
git add .
git commit -m "初始提交"
git push origin main
```

### 2. 在 Vercel 匯入專案

前往 [vercel.com](https://vercel.com)，點選「Add New Project」，選擇你的 GitHub 儲存庫。

### 3. 設定環境變數（重要）

在 Vercel 專案設定 → Environment Variables，加入：

| 變數名稱 | 說明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `GEMINI_API_KEY` | Google Gemini API Key（**絕不加 NEXT_PUBLIC_ 前綴**）|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS API Key（選填）|

> `GEMINI_API_KEY` 在 Vercel 上設定時只在 Server 環境使用，確保不被暴露到前端。

### 4. 部署

Vercel 會自動部署，完成後取得公開 URL。

---

## 技術架構

| 技術 | 用途 |
|---|---|
| Next.js 14 (App Router) | 前端框架 |
| Supabase | 資料庫 + Realtime |
| Tailwind CSS | 樣式 |
| Google Gemini 1.5 Flash | AI 助理（伺服器端） |
| @dnd-kit | 拖拉排序 |
| jsPDF | PDF 匯出 |
| TypeScript | 型別安全 |
