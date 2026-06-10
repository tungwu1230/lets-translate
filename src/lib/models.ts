import type { LanguageCode, ModelOption, ProviderId, TranslationMode, TranslationTone } from "./types";

export const languageOptions: Array<{ code: LanguageCode; label: string }> = [
  { code: "auto", label: "自動偵測" },
  { code: "en", label: "英文" },
  { code: "zh-Hant", label: "繁體中文" },
  { code: "zh-Hans", label: "簡體中文" },
  { code: "ja", label: "日文" },
  { code: "ko", label: "韓文" },
  { code: "fr", label: "法文" },
  { code: "de", label: "德文" },
  { code: "es", label: "西班牙文" },
];

export const modeOptions: Array<{ id: TranslationMode; label: string; description: string }> = [
  { id: "precise", label: "精準", description: "忠實原文，保留術語與結構" },
  { id: "natural", label: "自然", description: "讀起來像母語者寫作" },
  { id: "business", label: "商務", description: "清楚、禮貌、適合工作往來" },
  { id: "casual", label: "口語", description: "放鬆自然，適合聊天回覆" },
];

export const toneOptions: Array<{ id: TranslationTone; label: string }> = [
  { id: "neutral", label: "中性" },
  { id: "warm", label: "溫和" },
  { id: "concise", label: "精簡" },
  { id: "formal", label: "正式" },
];

export const modelOptions: ModelOption[] = [
  {
    id: "gpt-5.4-nano",
    provider: "openai",
    label: "GPT-5.4 Nano",
    tier: "便宜",
    inputUsdPerMillion: 0.2,
    outputUsdPerMillion: 1.25,
    notes: "OpenAI 低成本預設，適合大量短文翻譯。",
  },
  {
    id: "gpt-5.4-mini",
    provider: "openai",
    label: "GPT-5.4 Mini",
    tier: "平衡",
    inputUsdPerMillion: 0.75,
    outputUsdPerMillion: 4.5,
    notes: "速度、品質、成本平衡。",
  },
  {
    id: "gpt-5.5",
    provider: "openai",
    label: "GPT-5.5",
    tier: "高品質",
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 30,
    notes: "高品質翻譯與語氣改寫。",
  },
  {
    id: "gemini-2.5-flash-lite",
    provider: "gemini",
    label: "Gemini 2.5 Flash-Lite",
    tier: "便宜",
    inputUsdPerMillion: 0.1,
    outputUsdPerMillion: 0.4,
    notes: "Google 成本最佳模型，適合高頻翻譯。",
  },
  {
    id: "gemini-2.5-flash",
    provider: "gemini",
    label: "Gemini 2.5 Flash",
    tier: "平衡",
    inputUsdPerMillion: 0.54,
    outputUsdPerMillion: 4.5,
    notes: "品質與速度平衡，適合較長內容。",
  },
];

export function getModelsForProvider(provider: ProviderId) {
  return modelOptions.filter((model) => model.provider === provider);
}

export function getDefaultModel(provider: ProviderId) {
  return getModelsForProvider(provider)[0].id;
}

export function getLanguageLabel(code: LanguageCode) {
  return languageOptions.find((language) => language.code === code)?.label ?? code;
}

export function getModel(id: string) {
  return modelOptions.find((model) => model.id === id) ?? modelOptions[0];
}
