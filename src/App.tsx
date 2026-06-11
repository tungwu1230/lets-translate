import { Plus, Settings2, Github, History } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProviderSettingsPanel } from "./components/ProviderSettingsPanel";
import { TranslationPanel } from "./components/TranslationPanel";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { loadProviderSettings, saveProviderSettings, loadFavoritePairs, saveFavoritePairs } from "./lib/storage";
import { translateText, TranslationError } from "./lib/provider";
import { addHistoryRecord, getHistoryRecords, deleteHistoryRecord as dbDeleteHistoryRecord, clearHistory as dbClearHistory } from "./lib/db";
import { estimateTokens, estimateCostUsd } from "./lib/cost";
import type { ProviderSettings, TranslationPanelState, FavoritePair, LanguageCode, HistoryRecord } from "./lib/types";

function createPanel(
  index: number,
  defaultPair?: { sourceLanguage: LanguageCode; targetLanguage: LanguageCode },
  overrides: Partial<TranslationPanelState> = {}
): TranslationPanelState {
  return {
    id: crypto.randomUUID(),
    title: `翻譯面板 ${index}`,
    sourceLanguage: defaultPair?.sourceLanguage ?? "auto",
    targetLanguage: defaultPair?.targetLanguage ?? "zh-Hant",
    input: "",
    output: "",
    status: "idle",
    ...overrides,
  };
}

export default function App() {
  const [settings, setSettings] = useState<ProviderSettings>(() => loadProviderSettings());
  const [favoritePairs, setFavoritePairs] = useState<FavoritePair[]>(() => loadFavoritePairs());
  
  const [panels, setPanels] = useState<TranslationPanelState[]>(() => {
    const savedFavs = loadFavoritePairs();
    const defaultPair = savedFavs[0] || { sourceLanguage: "zh-Hant", targetLanguage: "en" };
    return [createPanel(1, defaultPair)];
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const abortControllers = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    // Load history from IndexedDB
    getHistoryRecords().then(setHistoryRecords).catch(console.error);
  }, []);

  useEffect(() => {
    saveProviderSettings(settings);
  }, [settings]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === ",") {
        event.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    saveFavoritePairs(favoritePairs);
  }, [favoritePairs]);

  const summary = useMemo(() => {
    const activeCount = panels.filter((panel) => panel.status === "translating").length;
    return { activeCount };
  }, [panels]);

  const isCompareMode = panels.length > 1;

  function updatePanel(nextPanel: TranslationPanelState) {
    setPanels((current) => current.map((panel) => (panel.id === nextPanel.id ? nextPanel : panel)));
  }

  function patchPanel(id: string, patch: Partial<TranslationPanelState>) {
    setPanels((current) =>
      current.map((panel) => (panel.id === id ? { ...panel, ...patch } : panel)),
    );
  }

  function toggleFavoritePair(sourceLanguage: LanguageCode, targetLanguage: LanguageCode) {
    setFavoritePairs((current) => {
      const exists = current.some(
        (p) => p.sourceLanguage === sourceLanguage && p.targetLanguage === targetLanguage
      );
      if (exists) {
        // Remove from favorites
        return current.filter(
          (p) => !(p.sourceLanguage === sourceLanguage && p.targetLanguage === targetLanguage)
        );
      } else {
        // Add to favorites
        return [
          ...current,
          {
            id: crypto.randomUUID(),
            sourceLanguage,
            targetLanguage,
          },
        ];
      }
    });
  }

  function addPanel() {
    const defaultPair = favoritePairs[0] || { sourceLanguage: "zh-Hant", targetLanguage: "en" };
    setPanels((current) => [...current, createPanel(current.length + 1, defaultPair)]);
  }

  function duplicatePanel(panel: TranslationPanelState) {
    setPanels((current) => [
      ...current,
      {
        ...panel,
        id: crypto.randomUUID(),
        title: `${panel.title} 副本`,
        status: "idle",
        error: undefined,
      },
    ]);
  }

  function deletePanel(id: string) {
    cancelTranslation(id);
    setPanels((current) => (current.length > 1 ? current.filter((panel) => panel.id !== id) : current));
  }


  async function runTranslation(panel: TranslationPanelState) {
    cancelTranslation(panel.id);
    const controller = new AbortController();
    abortControllers.current[panel.id] = controller;
    patchPanel(panel.id, { status: "translating", error: undefined, output: "" });

    const startTime = performance.now();
    try {
      const activeModel = settings.provider === "custom" ? settings.customModel : settings.model[settings.provider];
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
          patchPanel(panel.id, { output: chunk });
        },
      });

      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      patchPanel(panel.id, {
        output,
        status: "done",
      });

      // 新增歷史紀錄
      const inputTokens = estimateTokens(panel.input);
      const outputTokens = estimateTokens(output);
      const estimatedCostUsd = settings.provider === "custom" ? undefined : estimateCostUsd(activeModel, panel.input, output);

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
      };

      await addHistoryRecord(record);
      // 重新讀取歷史紀錄
      const updatedRecords = await getHistoryRecords();
      setHistoryRecords(updatedRecords);
    } catch (error) {
      if (controller.signal.aborted) {
        patchPanel(panel.id, { status: "idle" });
        return;
      }

      patchPanel(panel.id, {
        status: "error",
        error: error instanceof TranslationError || error instanceof Error ? error.message : "翻譯失敗，請稍後再試。",
      });
    } finally {
      delete abortControllers.current[panel.id];
    }
  }

  function cancelTranslation(id: string) {
    abortControllers.current[id]?.abort();
    delete abortControllers.current[id];
  }

  async function runAllTranslations() {
    const idlePanels = panels.filter(p => p.input.trim() && p.status !== "translating");
    await Promise.all(idlePanels.map(panel => runTranslation(panel)));
  }

  async function handleDeleteHistory(id: string) {
    try {
      await dbDeleteHistoryRecord(id);
      setHistoryRecords(await getHistoryRecords());
    } catch (err) {
      console.error(err);
    }
  }

  async function handleClearHistory() {
    if (confirm("確定要清除所有翻譯歷史紀錄嗎？")) {
      try {
        await dbClearHistory();
        setHistoryRecords([]);
      } catch (err) {
        console.error(err);
      }
    }
  }

  function handleApplyHistory(record: HistoryRecord) {
    if (panels.length > 0) {
      const firstPanel = panels[0];
      updatePanel({
        ...firstPanel,
        sourceLanguage: record.sourceLanguage,
        targetLanguage: record.targetLanguage,
        input: record.input,
        output: record.output,
        status: "done",
      });
      setIsHistoryOpen(false);
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
              className={`settings-toggle-btn ${isHistoryOpen ? "active" : ""}`}
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              title="歷史紀錄"
            >
              <History size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`settings-toggle-btn ${isSettingsOpen ? "active" : ""}`}
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
                records={historyRecords}
                developerMode={settings.developerMode}
                onClose={() => setIsHistoryOpen(false)}
                onDeleteRecord={handleDeleteHistory}
                onClearHistory={handleClearHistory}
                onApplyRecord={handleApplyHistory}
              />
            </div>
          </div>
        )}

        <section className="toolbar" aria-label="工具列狀態">
        <div>
          <h2>翻譯面板</h2>
          <p>
            {isCompareMode 
              ? `${panels.length} 個面板 · ${summary.activeCount} 個執行中`
              : summary.activeCount > 0 ? "翻譯中..." : "輸入文字即可開始翻譯"
            }
          </p>
        </div>

        <div className="toolbar-actions">
          {isCompareMode && panels.some(p => p.input.trim() && p.status !== "translating") && (
            <button type="button" className="ghost-button translate-all-btn" onClick={runAllTranslations}>
              翻譯全部面板
            </button>
          )}
          <button type="button" className="add-button" onClick={addPanel}>
            <Plus size={18} aria-hidden="true" />
            新增面板
          </button>
        </div>
      </section>

      <section className={`panel-grid ${isCompareMode ? "compare-grid" : "single-grid"}`} aria-label="翻譯面板">
        {panels.map((panel) => (
          <TranslationPanel
            key={panel.id}
            panel={panel}
            onChange={updatePanel}
            onTranslate={() => runTranslation(panel)}
            onCancel={() => cancelTranslation(panel.id)}
            onDelete={() => deletePanel(panel.id)}
            canDelete={panels.length > 1}
            favoritePairs={favoritePairs}
            onToggleFavorite={toggleFavoritePair}
          />
        ))}
      </section>
      </main>
    </div>
  );
}



