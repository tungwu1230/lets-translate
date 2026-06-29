import { renderHook, act, waitFor } from '@testing-library/react'
import { useFavoritePairs } from './useFavoritePairs'
import * as storage from '../lib/storage'

// Mock storage functions
vi.mock('../lib/storage', () => ({
  loadFavoritePairs: vi.fn(),
  saveFavoritePairs: vi.fn(),
}))

describe('useFavoritePairs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load favorite pairs on mount', () => {
    const mockPairs = [
      { id: '1', sourceLanguage: 'en' as const, targetLanguage: 'zh-Hant' as const },
    ]
    vi.mocked(storage.loadFavoritePairs).mockReturnValue(mockPairs)

    const { result } = renderHook(() => useFavoritePairs())

    expect(result.current.favoritePairs).toEqual(mockPairs)
    expect(storage.loadFavoritePairs).toHaveBeenCalledTimes(1)
  })

  it('should return empty array when no favorites saved', () => {
    vi.mocked(storage.loadFavoritePairs).mockReturnValue([])

    const { result } = renderHook(() => useFavoritePairs())

    expect(result.current.favoritePairs).toEqual([])
  })

  it('should add new favorite pair', async () => {
    vi.mocked(storage.loadFavoritePairs).mockReturnValue([])
    vi.mocked(storage.saveFavoritePairs).mockImplementation(() => {})

    const { result } = renderHook(() => useFavoritePairs())

    act(() => {
      result.current.toggleFavoritePair('en' as const, 'zh-Hant' as const)
    })

    await waitFor(() => {
      expect(result.current.favoritePairs).toHaveLength(1)
      expect(result.current.favoritePairs[0].sourceLanguage).toBe('en')
      expect(result.current.favoritePairs[0].targetLanguage).toBe('zh-Hant')
    })

    expect(storage.saveFavoritePairs).toHaveBeenCalled()
  })

  it('should remove existing favorite pair', async () => {
    const existingPair = {
      id: '1',
      sourceLanguage: 'en' as const,
      targetLanguage: 'zh-Hant' as const,
    }
    vi.mocked(storage.loadFavoritePairs).mockReturnValue([existingPair])
    vi.mocked(storage.saveFavoritePairs).mockImplementation(() => {})

    const { result } = renderHook(() => useFavoritePairs())

    expect(result.current.favoritePairs).toHaveLength(1)

    act(() => {
      result.current.toggleFavoritePair('en' as const, 'zh-Hant' as const)
    })

    await waitFor(() => {
      expect(result.current.favoritePairs).toHaveLength(0)
    })

    expect(storage.saveFavoritePairs).toHaveBeenCalled()
  })

  it('should generate unique ID for new favorite pairs', async () => {
    vi.mocked(storage.loadFavoritePairs).mockReturnValue([])
    vi.mocked(storage.saveFavoritePairs).mockImplementation(() => {})

    const { result } = renderHook(() => useFavoritePairs())

    act(() => {
      result.current.toggleFavoritePair('en' as const, 'zh-Hant' as const)
    })

    await waitFor(() => {
      expect(result.current.favoritePairs[0].id).toBeDefined()
      expect(typeof result.current.favoritePairs[0].id).toBe('string')
    })
  })

  it('should auto-save to localStorage on changes', async () => {
    vi.mocked(storage.loadFavoritePairs).mockReturnValue([])
    vi.mocked(storage.saveFavoritePairs).mockImplementation(() => {})

    renderHook(() => useFavoritePairs())

    await waitFor(() => {
      expect(storage.saveFavoritePairs).toHaveBeenCalledTimes(1)
    })
  })
})
