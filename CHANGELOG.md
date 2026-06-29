# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-29

### Added

- **多面板翻譯**：支援同時開啟多個翻譯面板，方便對照不同語言的結果
- **多 AI Provider 支援**：內建 OpenAI、Google Gemini，以及任何相容 OpenAI 格式的自訂端點（如 OpenRouter）
- **串流輸出模式**：可在設定中切換串流模式，讓翻譯結果即時逐字顯示
- **最愛語言對**：可將常用的語言組合儲存為最愛，快速切換
- **翻譯歷史紀錄**：所有翻譯結果自動儲存於瀏覽器本地（IndexedDB），可於歷史抽屜查閱
- **自訂語言**：語言選單支援手動輸入自訂語言，不受預設清單限制
- **可搜尋語言選單**：語言選單支援關鍵字搜尋，快速找到目標語言
- **BYOK（自帶金鑰）**：所有 API 金鑰僅儲存於使用者瀏覽器本地，不經過伺服器
- **用量與費用估算**：顯示本次翻譯的 Token 用量及預估費用
- **鍵盤快捷鍵**：支援快捷鍵操作提升使用效率
- **Vercel Edge Proxy**：透過 Edge Function 轉發 API 請求，解決 CORS 限制
