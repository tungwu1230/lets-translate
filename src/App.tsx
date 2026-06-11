import { Plus, Settings2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProviderSettingsPanel } from "./components/ProviderSettingsPanel";
import { TranslationPanel } from "./components/TranslationPanel";
import { loadProviderSettings, saveProviderSettings, loadFavoritePairs, saveFavoritePairs } from "./lib/storage";
import { translateText, TranslationError } from "./lib/provider";
import type { ProviderSettings, TranslationPanelState, FavoritePair, LanguageCode } from "./lib/types";

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
  const abortControllers = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    saveProviderSettings(settings);
  }, [settings]);

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
    patchPanel(panel.id, { status: "translating", error: undefined });

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
      });


      patchPanel(panel.id, {
        output,
        status: "done",
      });
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

  return (
    <main className="app-shell">
      <header className="app-navbar">
        <div className="brand-block">
          <div className="mark">OT</div>
          <div>
            <h1>open-translate</h1>
            <p>可並行、多面板的 LLM 翻譯工具</p>
          </div>
        </div>

        <div className="navbar-actions">
          <button
            type="button"
            className={`icon-button settings-toggle-btn ${isSettingsOpen ? "active" : ""}`}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title="開啟設定"
          >
            <Settings2 size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

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
  );
}



