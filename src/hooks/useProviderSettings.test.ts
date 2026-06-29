import { renderHook, act, waitFor } from '@testing-library/react'
import { useProviderSettings } from './useProviderSettings'
import * as storage from '../lib/storage'
import type { ProviderSettings } from '../lib/types'

// Mock storage functions
vi.mock('../lib/storage', () => ({
  loadProviderSettings: vi.fn(),
  saveProviderSettings: vi.fn(),
}))

describe('useProviderSettings', () => {
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
    stream: true,
    developerMode: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load settings on mount', () => {
    vi.mocked(storage.loadProviderSettings).mockReturnValue(mockSettings)

    const { result } = renderHook(() => useProviderSettings())

    expect(result.current.settings).toEqual(mockSettings)
    expect(storage.loadProviderSettings).toHaveBeenCalledTimes(1)
  })

  it('should update settings', () => {
    vi.mocked(storage.loadProviderSettings).mockReturnValue(mockSettings)

    const { result } = renderHook(() => useProviderSettings())

    act(() => {
      result.current.setSettings((prev) => ({
        ...prev,
        provider: 'gemini',
      }))
    })

    expect(result.current.settings.provider).toBe('gemini')
  })

  it('should auto-save to localStorage on changes', async () => {
    vi.mocked(storage.loadProviderSettings).mockReturnValue(mockSettings)
    vi.mocked(storage.saveProviderSettings).mockImplementation(() => {})

    renderHook(() => useProviderSettings())

    await waitFor(() => {
      expect(storage.saveProviderSettings).toHaveBeenCalledTimes(1)
    })
  })

  it('should save after settings update', async () => {
    vi.mocked(storage.loadProviderSettings).mockReturnValue(mockSettings)
    vi.mocked(storage.saveProviderSettings).mockImplementation(() => {})

    const { result } = renderHook(() => useProviderSettings())

    act(() => {
      result.current.setSettings((prev) => ({
        ...prev,
        stream: false,
      }))
    })

    await waitFor(() => {
      expect(storage.saveProviderSettings).toHaveBeenCalled()
      expect(result.current.settings.stream).toBe(false)
    })
  })
})
