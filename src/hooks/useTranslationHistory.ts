import { useEffect, useState } from 'react'
import {
  getHistoryRecords,
  deleteHistoryRecord as dbDeleteHistoryRecord,
  clearHistory as dbClearHistory,
} from '../lib/db'
import type { HistoryRecord } from '../lib/types'

export function useTranslationHistory() {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])

  // 載入歷史紀錄
  useEffect(() => {
    getHistoryRecords().then(setHistoryRecords).catch(console.error)
  }, [])

  async function deleteHistory(id: string) {
    try {
      await dbDeleteHistoryRecord(id)
      setHistoryRecords(await getHistoryRecords())
    } catch (err) {
      console.error(err)
    }
  }

  async function clearHistory() {
    try {
      await dbClearHistory()
      setHistoryRecords([])
    } catch (err) {
      console.error(err)
    }
  }

  function refreshHistory() {
    getHistoryRecords().then(setHistoryRecords).catch(console.error)
  }

  return {
    historyRecords,
    deleteHistory,
    clearHistory,
    refreshHistory,
  }
}
