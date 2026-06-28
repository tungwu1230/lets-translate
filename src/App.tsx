import { Plus, Settings2, Github, History } from 'lucide-react'
import { useState } from 'react'
import { ProviderSettingsPanel } from './components/ProviderSettingsPanel'
import { TranslationPanel } from './components/TranslationPanel'
import { HistoryDrawer } from './components/HistoryDrawer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useProviderSettings } from './hooks/useProviderSettings'
import { useFavoritePairs } from './hooks/useFavoritePairs'
import { useTranslationHistory } from './hooks/useTranslationHistory'
import { useTranslationPanels } from './hooks/useTranslationPanels'
import type { TranslationPanelState, HistoryRecord as HistoryRecordType } from './lib/types'

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Hooks
  const { settings, setSettings } = useProviderSettings()
  const { favoritePairs, toggleFavoritePair } = useFavoritePairs()
  const history = useTranslationHistory()
  const panels = useTranslationPanels(settings, favoritePairs, {
    onHistoryAdded: history.refreshHistory,
  })

  // 鍵盤快捷鍵：Cmd/Ctrl + , 切換設定面板
  useKeyboardShortcuts({
    'Cmd+,': () => setIsSettingsOpen((prev) => !prev),
    'Ctrl+,': () => setIsSettingsOpen((prev) => !prev),
  })

  function handleApplyHistory(record: HistoryRecordType) {
    if (panels.panels.length > 0) {
      const firstPanel = panels.panels[0]
      panels.updatePanel({
        ...firstPanel,
        sourceLanguage: record.sourceLanguage,
        targetLanguage: record.targetLanguage,
        input: record.input,
        output: record.output,
        status: 'done',
      })
      setIsHistoryOpen(false)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-block">
            <span className="brand-breadcrumb">Let's Translate</span>
          </div>

          <div className="navbar-actions">
            <a
              href="https://github.com/tungwu1230/lets-translate"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link-btn"
              title="GitHub 專案庫"
            >
              <Github size={16} aria-hidden="true" />
            </a>
            <button
              type="button"
              className={`settings-toggle-btn ${isHistoryOpen ? 'active' : ''}`}
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              title="歷史紀錄"
            >
              <History size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`settings-toggle-btn ${isSettingsOpen ? 'active' : ''}`}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="開啟設定"
            >
              <Settings2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell">
        {isSettingsOpen && (
          <div className="settings-overlay-wrapper">
            <div className="settings-backdrop" onClick={() => setIsSettingsOpen(false)} />
            <div className="settings-drawer">
              <ProviderSettingsPanel
                settings={settings}
                onChange={setSettings}
                onClose={() => setIsSettingsOpen(false)}
              />
            </div>
          </div>
        )}

        {isHistoryOpen && (
          <div className="settings-overlay-wrapper">
            <div className="settings-backdrop" onClick={() => setIsHistoryOpen(false)} />
            <div className="settings-drawer">
              <HistoryDrawer
                records={history.historyRecords}
                developerMode={settings.developerMode}
                onClose={() => setIsHistoryOpen(false)}
                onDeleteRecord={history.deleteHistory}
                onClearHistory={history.clearHistory}
                onApplyRecord={handleApplyHistory}
              />
            </div>
          </div>
        )}

        <section className="toolbar" aria-label="工具列狀態">
          <div>
            <h2>翻譯面板</h2>
            <p>
              {panels.isCompareMode
                ? `${panels.panels.length} 個面板 · ${panels.summary.activeCount} 個執行中`
                : panels.summary.activeCount > 0
                  ? '翻譯中...'
                  : '輸入文字即可開始翻譯'}
            </p>
          </div>

          <div className="toolbar-actions">
            {panels.isCompareMode &&
              panels.panels.some((p) => p.input.trim() && p.status !== 'translating') && (
                <button
                  type="button"
                  className="ghost-button translate-all-btn"
                  onClick={panels.runAllTranslations}
                >
                  翻譯全部面板
                </button>
              )}
            <button type="button" className="add-button" onClick={panels.addPanel}>
              <Plus size={18} aria-hidden="true" />
              新增面板
            </button>
          </div>
        </section>

        <section
          className={`panel-grid ${panels.isCompareMode ? 'compare-grid' : 'single-grid'}`}
          aria-label="翻譯面板"
        >
          {panels.panels.map((panel: TranslationPanelState) => (
            <TranslationPanel
              key={panel.id}
              panel={panel}
              onChange={panels.updatePanel}
              onTranslate={() => panels.runTranslation(panel)}
              onCancel={() => panels.cancelTranslation(panel.id)}
              onDelete={() => panels.deletePanel(panel.id)}
              canDelete={panels.panels.length > 1}
              favoritePairs={favoritePairs}
              onToggleFavorite={toggleFavoritePair}
            />
          ))}
        </section>
      </main>
    </div>
  )
}
