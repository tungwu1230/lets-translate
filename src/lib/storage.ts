import type { ProviderId, ProviderSettings } from "./types";

const STORAGE_KEY = "open-translate.provider-settings";

export const defaultProviderSettings: ProviderSettings = {
  provider: "openai",
  apiKeys: {
    openai: "",
    gemini: "",
  },
  rememberKeys: false,
};

export function loadProviderSettings(storage: Storage | undefined = globalThis.localStorage): ProviderSettings {
  if (!storage) return defaultProviderSettings;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaultProviderSettings;
    const parsed = JSON.parse(raw) as Partial<ProviderSettings>;
    return {
      provider: parsed.provider === "gemini" ? "gemini" : "openai",
      apiKeys: {
        openai: typeof parsed.apiKeys?.openai === "string" ? parsed.apiKeys.openai : "",
        gemini: typeof parsed.apiKeys?.gemini === "string" ? parsed.apiKeys.gemini : "",
      },
      rememberKeys: parsed.rememberKeys === true,
    };
  } catch {
    return defaultProviderSettings;
  }
}

export function saveProviderSettings(settings: ProviderSettings, storage: Storage | undefined = globalThis.localStorage) {
  if (!storage) return;

  if (!settings.rememberKeys) {
    storage.removeItem(STORAGE_KEY);
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function maskApiKey(value: string) {
  if (!value) return "";
  if (value.length <= 10) return "••••••";
  return `${value.slice(0, 6)}••••${value.slice(-4)}`;
}

export function updateProviderKey(settings: ProviderSettings, provider: ProviderId, apiKey: string): ProviderSettings {
  return {
    ...settings,
    apiKeys: {
      ...settings.apiKeys,
      [provider]: apiKey,
    },
  };
}
