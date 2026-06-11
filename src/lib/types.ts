export type ProviderId = "openai" | "gemini" | "custom";

export type TranslationMode = "precise" | "natural" | "business" | "casual";

export type TranslationTone = "neutral" | "warm" | "concise" | "formal";

export type TranslationStatus = "idle" | "translating" | "done" | "error";

export type LanguageCode =
  | "auto"
  | "en"
  | "zh-Hant"
  | "zh-Hans"
  | "ja"
  | "ko"
  | "fr"
  | "de"
  | "es"
  | (string & {}); // 允許任意自訂語言字串

export interface FavoritePair {
  id: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}


export interface ModelOption {
  id: string;
  provider: ProviderId;
  label: string;
  tier: "便宜" | "平衡" | "高品質";
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  notes: string;
}

export interface ProviderSettings {
  provider: ProviderId;
  apiKeys: Record<ProviderId, string>;
  rememberKeys: boolean;
  // 全局翻譯設定
  model: Record<ProviderId, string>; // 記錄各 provider 選用的 model
  mode: TranslationMode;
  tone: TranslationTone;
  customEndpoint: string; // 自訂 API 端點
  customModel: string;    // 自訂模型名稱
}


export interface TranslationPanelState {
  id: string;
  title: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  input: string;
  output: string;
  status: TranslationStatus;
  error?: string;
}

