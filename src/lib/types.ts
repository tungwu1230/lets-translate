export type ProviderId = "openai" | "gemini";

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
  | "es";

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
}

export interface TranslationPanelState {
  id: string;
  title: string;
  provider: ProviderId;
  model: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  mode: TranslationMode;
  tone: TranslationTone;
  input: string;
  output: string;
  status: TranslationStatus;
  error?: string;
  lastEstimatedCost?: number;
}
