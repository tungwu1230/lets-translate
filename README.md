# Let's Translate 🌐

可並行、多面板的現代化大語言模型（LLM）翻譯工具。基於 React + Vite + TypeScript 構建，具備精美溫暖的「自然人文主義設計風格（Natural Humanist Style）」。

👉 **線上使用**：[Let's Translate 網頁服務](https://lets-translate-vk.vercel.app/)

---

## ✨ 核心特色

- 🎨 **自然人文主義美學**：採用暖沙色背景、森林綠主色調與有機圓角設計，提供舒適且極簡的閱讀與操作體驗。
- 📑 **多面板並行對照**：支援一鍵新增/刪除翻譯面板，可在同一個畫面上以不同語氣、不同模型進行多組翻譯結果的對照。
- 🔒 **BYOK 安全隱私設計**：
  - 密鑰完全儲存在使用者的瀏覽器本地 LocalStorage 中，站方不收集任何密鑰。
  - 網頁內置嚴格的 **Content Security Policy (CSP)** 防禦機制，全面防範 XSS 攻擊讀取 LocalStorage，安全有保障。
- ⚡ **本地安全代理伺服器**：
  - 隨附零依賴的 Node.js 代理伺服器。啟動後可在後端安全注入 API Key，徹底解決前端直接調用 API 時的 CORS 限制。
- 🌟 **常用語言組合收藏**：可快速切換、新增或移除您最愛用的翻譯語言對（例如：繁中 ⇄ 英文）。
- 📝 **輸入字數限制與警示**：輸入區上限 5,000 字（同 Google/DeepL 標準），當字數達上限時會有動態抖動警示與高亮，保障 LLM 翻譯輸出品質。
- ⌨️ **鍵盤快速鍵**：支援 `Cmd + ,` (Mac) 或 `Ctrl + ,` (Windows/Linux) 快速召喚與關閉設定抽屜。

---

## 🚀 快速開始

### 1. 本地開發與執行
```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

### 2. 本地安全代理伺服器 (解決 CORS 與 API 暴露)
如果您不想在瀏覽器中直接輸入 API 密鑰，可以使用內建的 Proxy 伺服器：
```bash
# 設定環境變數
export OPENAI_API_KEY="您的金鑰"
export GEMINI_API_KEY="您的金鑰"

# 啟動代理伺服器
npm run proxy
```
*啟動後，在網頁設定中選擇供應商為「自訂 (Custom)」，端點輸入 `http://localhost:3001/v1/chat/completions`，API Key 留空即可安全使用。*

### 3. 單元測試
```bash
npm test
```

---

## 📦 部署到 Vercel

本專案使用 Vercel Edge 函數作為代理伺服器，解決瀏覽器端直接調用 LLM API 的 CORS 限制。部署到 Vercel 後，`/api/proxy` 路由會自動處理所有 API 請求的轉發與 CORS 標頭。

```bash
# 安裝 Vercel CLI（如尚未安裝）
npm i -g vercel

# 部署到 Vercel
vercel
```

或在 Vercel 網站上直接連接 GitHub 仓库進行自動部署。

---

## 🛠️ 技術棧
- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS (核心樣式配置), Vanilla CSS (自訂人文卡片與版面設計)
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library
