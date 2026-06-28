import { useMemo, useRef, useState } from 'react'
import { translateText, TranslationError } from '../lib/provider'
import { addHistoryRecord } from '../lib/db'
import { estimateTokens, estimateCostUsd } from '../lib/cost'
import { DEFAULT_LANGUAGE_PAIR } from '../constants/defaults'
import type {
  ProviderSettings,
  TranslationPanelState,
  FavoritePair,
  LanguageCode,
  HistoryRecord,
} from '../lib/types'

interface Options {
  onHistoryAdded?: () => void
}

export function useTranslationPanels(
  settings: ProviderSettings,
  favoritePairs: FavoritePair[],
  options: Options = {}
) {
  const [panels, setPanels] = useState<TranslationPanelState[]>(() => {
    const defaultPair = favoritePairs[0] || DEFAULT_LANGUAGE_PAIR
    return [createPanel(1, defaultPair)]
  })

  const abortControllers = useRef<Record<string, AbortController>>({})

  const summary = useMemo(() => {
    const activeCount = panels.filter((panel) => panel.status === 'translating').length
    return { activeCount }
  }, [panels])

  const isCompareMode = panels.length > 1

  function updatePanel(nextPanel: TranslationPanelState) {
    setPanels((current) => current.map((panel) => (panel.id === nextPanel.id ? nextPanel : panel)))
  }

  function patchPanel(id: string, patch: Partial<TranslationPanelState>) {
    setPanels((current) =>
      current.map((panel) => (panel.id === id ? { ...panel, ...patch } : panel))
    )
  }

  function addPanel() {
    const defaultPair = favoritePairs[0] || DEFAULT_LANGUAGE_PAIR
    setPanels((current) => [...current, createPanel(current.length + 1, defaultPair)])
  }

  // 預留給未來「複製面板」功能
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function duplicatePanel(panel: TranslationPanelState) {
    setPanels((current) => [
      ...current,
      {
        ...panel,
        id: crypto.randomUUID(),
        title: `${panel.title} 副本`,
        status: 'idle',
        error: undefined,
      },
    ])
  }

  function deletePanel(id: string) {
    cancelTranslation(id)
    setPanels((current) =>
      current.length > 1 ? current.filter((panel) => panel.id !== id) : current
    )
  }

  async function runTranslation(panel: TranslationPanelState) {
    cancelTranslation(panel.id)
    const controller = new AbortController()
    abortControllers.current[panel.id] = controller
    patchPanel(panel.id, { status: 'translating', error: undefined, output: '' })

    const startTime = performance.now()
    try {
      const activeModel =
        settings.provider === 'custom' ? settings.customModel : settings.model[settings.provider]

      const output = await translateText({
        provider: settings.provider,
        apiKey: settings.apiKeys[settings.provider],
        model: activeModel,
        sourceLanguage: panel.sourceLanguage,
        targetLanguage: panel.targetLanguage,
        mode: settings.mode,
        tone: settings.tone,
        text: panel.input,
        signal: controller.signal,
        customEndpoint: settings.customEndpoint,
        stream: settings.stream,
        onChunk: (chunk) => {
          patchPanel(panel.id, { output: chunk })
        },
      })

      const endTime = performance.now()
      const durationMs = Math.round(endTime - startTime)

      patchPanel(panel.id, {
        output,
        status: 'done',
      })

      // 新增歷史紀錄
      const inputTokens = estimateTokens(panel.input)
      const outputTokens = estimateTokens(output)
      const estimatedCostUsd =
        settings.provider === 'custom'
          ? undefined
          : estimateCostUsd(activeModel, panel.input, output)

      const record: HistoryRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        sourceLanguage: panel.sourceLanguage,
        targetLanguage: panel.targetLanguage,
        input: panel.input,
        output: output,
        provider: settings.provider,
        model: activeModel,
        durationMs,
        usage: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens: inputTokens + outputTokens,
          estimatedCostUsd,
        },
      }

      await addHistoryRecord(record)
      options.onHistoryAdded?.()
    } catch (error) {
      if (controller.signal.aborted) {
        patchPanel(panel.id, { status: 'idle' })
        return
      }

      patchPanel(panel.id, {
        status: 'error',
        error:
          error instanceof TranslationError || error instanceof Error
            ? error.message
            : '翻譯失敗，請稍後再試。',
      })
    } finally {
      delete abortControllers.current[panel.id]
    }
  }

  function cancelTranslation(id: string) {
    abortControllers.current[id]?.abort()
    delete abortControllers.current[id]
  }

  async function runAllTranslations() {
    const idlePanels = panels.filter((p) => p.input.trim() && p.status !== 'translating')
    await Promise.all(idlePanels.map((panel) => runTranslation(panel)))
  }

  return {
    panels,
    updatePanel,
    addPanel,
    deletePanel,
    runTranslation,
    cancelTranslation,
    runAllTranslations,
    summary,
    isCompareMode,
  }
}

function createPanel(
  index: number,
  defaultPair?: { sourceLanguage: LanguageCode; targetLanguage: LanguageCode },
  overrides: Partial<TranslationPanelState> = {}
): TranslationPanelState {
  return {
    id: crypto.randomUUID(),
    title: `翻譯面板 ${index}`,
    sourceLanguage: defaultPair?.sourceLanguage ?? 'auto',
    targetLanguage: defaultPair?.targetLanguage ?? 'zh-Hant',
    input: '',
    output: '',
    status: 'idle',
    ...overrides,
  }
}
