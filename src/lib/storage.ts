import type { FavoritePair, ProviderId, ProviderSettings } from './types'

const STORAGE_KEY = 'lets-translate.provider-settings'

export const defaultProviderSettings: ProviderSettings = {
  provider: 'openai',
  apiKeys: {
    openai: '',
    gemini: '',
    custom: '',
  },
  rememberKeys: false,
  stream: true,
  model: {
    openai: 'gpt-5.4-nano',
    gemini: 'gemini-2.5-flash-lite',
    custom: 'custom-model',
  },
  mode: 'natural',
  tone: 'neutral',
  customEndpoint: 'https://api.openai.com/v1/chat/completions',
  customModel: 'gpt-4o',
  developerMode: false,
}

export function loadProviderSettings(
  storage: Storage | undefined = globalThis.localStorage
): ProviderSettings {
  if (!storage) return defaultProviderSettings

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return defaultProviderSettings
    const parsed = JSON.parse(raw) as Partial<ProviderSettings>
    return {
      provider:
        parsed.provider === 'gemini' || parsed.provider === 'custom' ? parsed.provider : 'openai',
      apiKeys: {
        openai: typeof parsed.apiKeys?.openai === 'string' ? parsed.apiKeys.openai : '',
        gemini: typeof parsed.apiKeys?.gemini === 'string' ? parsed.apiKeys.gemini : '',
        custom: typeof parsed.apiKeys?.custom === 'string' ? parsed.apiKeys.custom : '',
      },
      rememberKeys: parsed.rememberKeys === true,
      stream: parsed.stream !== false,
      model: {
        openai: typeof parsed.model?.openai === 'string' ? parsed.model.openai : 'gpt-5.4-nano',
        gemini:
          typeof parsed.model?.gemini === 'string' ? parsed.model.gemini : 'gemini-2.5-flash-lite',
        custom: typeof parsed.model?.custom === 'string' ? parsed.model.custom : 'custom-model',
      },
      mode:
        parsed.mode === 'precise' ||
        parsed.mode === 'natural' ||
        parsed.mode === 'business' ||
        parsed.mode === 'casual'
          ? parsed.mode
          : 'natural',
      tone:
        parsed.tone === 'neutral' ||
        parsed.tone === 'warm' ||
        parsed.tone === 'concise' ||
        parsed.tone === 'formal'
          ? parsed.tone
          : 'neutral',
      customEndpoint:
        typeof parsed.customEndpoint === 'string'
          ? parsed.customEndpoint
          : 'https://api.openai.com/v1/chat/completions',
      customModel: typeof parsed.customModel === 'string' ? parsed.customModel : 'gpt-4o',
      developerMode: parsed.developerMode === true,
    }
  } catch {
    return defaultProviderSettings
  }
}

export function saveProviderSettings(
  settings: ProviderSettings,
  storage: Storage | undefined = globalThis.localStorage
) {
  if (!storage) return

  if (!settings.rememberKeys) {
    storage.removeItem(STORAGE_KEY)
    return
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function maskApiKey(value: string) {
  if (!value) return ''
  if (value.length <= 10) return '••••••'
  return `${value.slice(0, 6)}••••${value.slice(-4)}`
}

export function updateProviderKey(
  settings: ProviderSettings,
  provider: ProviderId,
  apiKey: string
): ProviderSettings {
  return {
    ...settings,
    apiKeys: {
      ...settings.apiKeys,
      [provider]: apiKey,
    },
  }
}

const FAVORITES_KEY = 'lets-translate.favorite-pairs'

export const defaultFavoritePairs: FavoritePair[] = [
  { id: '1', sourceLanguage: 'zh-Hant', targetLanguage: 'en' },
  { id: '2', sourceLanguage: 'en', targetLanguage: 'zh-Hant' },
  { id: '3', sourceLanguage: 'ja', targetLanguage: 'zh-Hant' },
]

export function loadFavoritePairs(
  storage: Storage | undefined = globalThis.localStorage
): FavoritePair[] {
  if (!storage) return defaultFavoritePairs
  try {
    const raw = storage.getItem(FAVORITES_KEY)
    if (!raw) return defaultFavoritePairs
    return JSON.parse(raw) as FavoritePair[]
  } catch {
    return defaultFavoritePairs
  }
}

export function saveFavoritePairs(
  pairs: FavoritePair[],
  storage: Storage | undefined = globalThis.localStorage
) {
  if (!storage) return
  storage.setItem(FAVORITES_KEY, JSON.stringify(pairs))
}
