import { useEffect, useState } from 'react'
import { loadProviderSettings, saveProviderSettings } from '../lib/storage'
import type { ProviderSettings } from '../lib/types'

export function useProviderSettings() {
  const [settings, setSettings] = useState<ProviderSettings>(() => loadProviderSettings())

  // 自動保存到 localStorage
  useEffect(() => {
    saveProviderSettings(settings)
  }, [settings])

  return {
    settings,
    setSettings,
  }
}
