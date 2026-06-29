export const APP_VERSION = '1.0.0'

export const CHANGELOG: Array<{
  version: string
  date: string
  features: string[]
}> = [
  {
    version: '1.0.0',
    date: '2026-06-29',
    features: [
      '多面板翻譯：支援同時開啟多個翻譯面板，方便對照不同語言的結果',
      '多 AI Provider 支援：內建 OpenAI、Google Gemini，以及任何相容 OpenAI 格式的自訂端點（如 OpenRouter）',
      '串流輸出模式：可在設定中切換串流模式，讓翻譯結果即時逐字顯示',
      '最愛語言對：可將常用的語言組合儲存為最愛，快速切換',
      '翻譯歷史紀錄：所有翻譯結果自動儲存於瀏覽器本地（IndexedDB），可於歷史抽屜查閱',
      '自訂語言：語言選單支援手動輸入自訂語言，不受預設清單限制',
      'BYOK（自帶金鑰）：所有 API 金鑰僅儲存於使用者瀏覽器本地，不經過伺服器',
    ],
  },
]
