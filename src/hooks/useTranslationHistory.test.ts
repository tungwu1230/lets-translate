import { renderHook, act, waitFor } from '@testing-library/react'
import { useTranslationHistory } from './useTranslationHistory'
import * as db from '../lib/db'
import type { HistoryRecord } from '../lib/types'

// Mock db functions
vi.mock('../lib/db', () => ({
  getHistoryRecords: vi.fn(),
  deleteHistoryRecord: vi.fn(),
  clearHistory: vi.fn(),
}))

describe('useTranslationHistory', () => {
  const mockRecords: HistoryRecord[] = [
    {
      id: '1',
      createdAt: '2024-01-01T00:00:00.000Z',
      sourceLanguage: 'en',
      targetLanguage: 'zh-Hant',
      input: 'Hello',
      output: '你好',
      provider: 'openai',
      model: 'gpt-5.4-nano',
      durationMs: 1000,
      usage: {
        promptTokens: 5,
        completionTokens: 3,
        totalTokens: 8,
        estimatedCostUsd: 0.00001,
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load history records on mount', async () => {
    vi.mocked(db.getHistoryRecords).mockResolvedValue(mockRecords)

    const { result } = renderHook(() => useTranslationHistory())

    await waitFor(() => {
      expect(result.current.historyRecords).toEqual(mockRecords)
    })

    expect(db.getHistoryRecords).toHaveBeenCalledTimes(1)
  })

  it('should return empty array when no history', async () => {
    vi.mocked(db.getHistoryRecords).mockResolvedValue([])

    const { result } = renderHook(() => useTranslationHistory())

    await waitFor(() => {
      expect(result.current.historyRecords).toEqual([])
    })
  })

  it('should delete history record', async () => {
    vi.mocked(db.getHistoryRecords).mockResolvedValue(mockRecords)
    vi.mocked(db.deleteHistoryRecord).mockResolvedValue(undefined)

    const { result } = renderHook(() => useTranslationHistory())

    await waitFor(() => {
      expect(result.current.historyRecords).toHaveLength(1)
    })

    act(() => {
      result.current.deleteHistory('1')
    })

    await waitFor(() => {
      expect(db.deleteHistoryRecord).toHaveBeenCalledWith('1')
    })
  })

  it('should clear all history', async () => {
    vi.mocked(db.getHistoryRecords).mockResolvedValue(mockRecords)
    vi.mocked(db.clearHistory).mockResolvedValue(undefined)

    const { result } = renderHook(() => useTranslationHistory())

    await waitFor(() => {
      expect(result.current.historyRecords).toHaveLength(1)
    })

    act(() => {
      result.current.clearHistory()
    })

    await waitFor(() => {
      expect(result.current.historyRecords).toHaveLength(0)
      expect(db.clearHistory).toHaveBeenCalled()
    })
  })

  it('should refresh history records', async () => {
    vi.mocked(db.getHistoryRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockRecords)

    const { result } = renderHook(() => useTranslationHistory())

    await waitFor(() => {
      expect(result.current.historyRecords).toHaveLength(0)
    })

    act(() => {
      result.current.refreshHistory()
    })

    await waitFor(() => {
      expect(result.current.historyRecords).toHaveLength(1)
    })

    expect(db.getHistoryRecords).toHaveBeenCalledTimes(2)
  })
})
