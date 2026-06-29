import { renderHook, act, waitFor } from '@testing-library/react'
import { useTranslationPanels } from './useTranslationPanels'
import * as provider from '../lib/provider'
import * as db from '../lib/db'
import type { ProviderSettings, FavoritePair } from '../lib/types'

// Mock dependencies
vi.mock('../lib/provider')
vi.mock('../lib/db')
vi.mock('../lib/cost', () => ({
  estimateTokens: vi.fn(() => 10),
  estimateCostUsd: vi.fn(() => 0.001),
}))

const mockSettings: ProviderSettings = {
  provider: 'openai',
  apiKeys: {
    openai: 'test-key',
    gemini: '',
    custom: '',
  },
  model: {
    openai: 'gpt-5.4-nano',
    gemini: 'gemini-2.5-flash-lite',
  },
  customModel: '',
  customEndpoint: '',
  mode: 'natural',
  tone: 'neutral',
  stream: false,
  developerMode: false,
}

const mockFavoritePairs: FavoritePair[] = [
  { id: '1', sourceLanguage: 'en', targetLanguage: 'zh-Hant' },
]

describe('useTranslationPanels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(provider.translateText).mockResolvedValue('測試翻譯結果')
    vi.mocked(db.addHistoryRecord).mockResolvedValue()
  })

  it('should initialize with one panel', () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs)
    )

    expect(result.current.panels).toHaveLength(1)
    expect(result.current.panels[0].sourceLanguage).toBe('en')
    expect(result.current.panels[0].targetLanguage).toBe('zh-Hant')
  })

  it('should use default language pair when no favorites', () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, [])
    )

    expect(result.current.panels).toHaveLength(1)
    expect(result.current.panels[0].sourceLanguage).toBe('zh-Hant')
    expect(result.current.panels[0].targetLanguage).toBe('en')
  })

  it('should add new panel', () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs)
    )

    act(() => {
      result.current.addPanel()
    })

    expect(result.current.panels).toHaveLength(2)
  })

  it('should delete panel when multiple exist', () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs)
    )

    act(() => {
      result.current.addPanel()
    })

    const firstPanelId = result.current.panels[0].id

    act(() => {
      result.current.deletePanel(firstPanelId)
    })

    expect(result.current.panels).toHaveLength(1)
  })

  it('should not delete last panel', () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs)
    )

    const firstPanelId = result.current.panels[0].id

    act(() => {
      result.current.deletePanel(firstPanelId)
    })

    expect(result.current.panels).toHaveLength(1)
  })

  it('should update panel', () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs)
    )

    const updatedPanel = {
      ...result.current.panels[0],
      input: '新的輸入',
    }

    act(() => {
      result.current.updatePanel(updatedPanel)
    })

    expect(result.current.panels[0].input).toBe('新的輸入')
  })

  it('should calculate summary correctly', () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs)
    )

    expect(result.current.summary.activeCount).toBe(0)

    // 模擬有一個面板在翻譯中
    act(() => {
      result.current.updatePanel({
        ...result.current.panels[0],
        status: 'translating',
      })
    })

    expect(result.current.summary.activeCount).toBe(1)
  })

  it('should detect compare mode', () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs)
    )

    expect(result.current.isCompareMode).toBe(false)

    act(() => {
      result.current.addPanel()
    })

    expect(result.current.isCompareMode).toBe(true)
  })

  it('should run translation', async () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs, {})
    )

    const panel = {
      ...result.current.panels[0],
      input: 'Hello',
    }

    act(() => {
      result.current.updatePanel(panel)
    })

    act(() => {
      result.current.runTranslation(panel)
    })

    await waitFor(() => {
      expect(result.current.panels[0].status).toBe('done')
      expect(result.current.panels[0].output).toBe('測試翻譯結果')
    })

    expect(provider.translateText).toHaveBeenCalled()
    expect(db.addHistoryRecord).toHaveBeenCalled()
  })

  it('should cancel translation', async () => {
    const mockAbort = vi.fn()
    vi.mocked(provider.translateText).mockImplementation(
      ({ signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new Error('Aborted'))
          })
          // 模擬 abort
          setTimeout(() => mockAbort(), 10)
        })
    )

    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs)
    )

    const panel = {
      ...result.current.panels[0],
      input: 'Hello',
    }

    act(() => {
      result.current.runTranslation(panel)
    })

    expect(result.current.panels[0].status).toBe('translating')

    act(() => {
      result.current.cancelTranslation(panel.id)
    })

    await waitFor(() => {
      expect(result.current.panels[0].status).toBe('idle')
    })
  })

  it('should run all translations', async () => {
    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs, {})
    )

    act(() => {
      result.current.addPanel()
    })

    // 設置兩個面板的輸入
    act(() => {
      result.current.updatePanel({ ...result.current.panels[0], input: 'Hello' })
      result.current.updatePanel({ ...result.current.panels[1], input: 'World' })
    })

    act(() => {
      result.current.runAllTranslations()
    })

    await waitFor(() => {
      expect(result.current.panels.every((p) => p.status === 'done')).toBe(true)
    })
  })

  it('should call onHistoryAdded callback after translation', async () => {
    const onHistoryAdded = vi.fn()

    const { result } = renderHook(() =>
      useTranslationPanels(mockSettings, mockFavoritePairs, {
        onHistoryAdded,
      })
    )

    const panel = {
      ...result.current.panels[0],
      input: 'Hello',
    }

    act(() => {
      result.current.runTranslation(panel)
    })

    await waitFor(() => {
      expect(result.current.panels[0].status).toBe('done')
    })

    expect(onHistoryAdded).toHaveBeenCalledTimes(1)
  })
})
