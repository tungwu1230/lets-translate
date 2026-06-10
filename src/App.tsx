import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProviderSettingsPanel } from "./components/ProviderSettingsPanel";
import { TranslationPanel } from "./components/TranslationPanel";
import { estimateCostUsd } from "./lib/cost";
import { getDefaultModel } from "./lib/models";
import { saveProviderSettings, loadProviderSettings } from "./lib/storage";
import { translateText, TranslationError } from "./lib/provider";
import type { ProviderSettings, TranslationPanelState } from "./lib/types";

function createPanel(index: number, overrides: Partial<TranslationPanelState> = {}): TranslationPanelState {
  const isReplyPanel = index % 2 === 0;
  const provider = overrides.provider ?? "openai";
  return {
    id: crypto.randomUUID(),
    title: isReplyPanel ? "回覆翻譯" : "閱讀翻譯",
    provider,
    model: overrides.model ?? getDefaultModel(provider),
    sourceLanguage: isReplyPanel ? "zh-Hant" : "en",
    targetLanguage: isReplyPanel ? "en" : "zh-Hant",
    mode: "natural",
    tone: "neutral",
    input: "",
    output: "",
    status: "idle",
    ...overrides,
  };
}

export default function App() {
  const [settings, setSettings] = useState<ProviderSettings>(() => loadProviderSettings());
  const [panels, setPanels] = useState<TranslationPanelState[]>(() => [createPanel(1), createPanel(2)]);
  const abortControllers = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    saveProviderSettings(settings);
  }, [settings]);

  const summary = useMemo(() => {
    const activeCount = panels.filter((panel) => panel.status === "translating").length;
    const totalCost = panels.reduce((sum, panel) => sum + estimateCostUsd(panel.model, panel.input, panel.output), 0);
    return { activeCount, totalCost };
  }, [panels]);

  function updatePanel(nextPanel: TranslationPanelState) {
    setPanels((current) => current.map((panel) => (panel.id === nextPanel.id ? nextPanel : panel)));
  }

  function patchPanel(id: string, patch: Partial<TranslationPanelState>) {
    setPanels((current) =>
      current.map((panel) => (panel.id === id ? { ...panel, ...patch } : panel)),
    );
  }

  function addPanel() {
    setPanels((current) => [...current, createPanel(current.length + 1, { provider: settings.provider })]);
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
      const output = await translateText({
        provider: panel.provider,
        apiKey: settings.apiKeys[panel.provider],
        model: panel.model,
        sourceLanguage: panel.sourceLanguage,
        targetLanguage: panel.targetLanguage,
        mode: panel.mode,
        tone: panel.tone,
        text: panel.input,
        signal: controller.signal,
      });

      patchPanel(panel.id, {
        output,
        status: "done",
        lastEstimatedCost: estimateCostUsd(panel.model, panel.input, output),
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

  return (
    <main className="app-shell">
      <ProviderSettingsPanel settings={settings} onChange={setSettings} />

      <section className="toolbar" aria-label="工作區狀態">
        <div>
          <h2>翻譯工作區</h2>
          <p>
            {panels.length} 個面板 · {summary.activeCount} 個執行中 · 預估總成本約 ${summary.totalCost.toFixed(4)}
          </p>
        </div>
        <button type="button" className="add-button" onClick={addPanel}>
          <Plus size={18} aria-hidden="true" />
          新增面板
        </button>
      </section>

      <section className="panel-grid" aria-label="翻譯面板">
        {panels.map((panel) => (
          <TranslationPanel
            key={panel.id}
            panel={panel}
            onChange={updatePanel}
            onTranslate={() => runTranslation(panel)}
            onCancel={() => cancelTranslation(panel.id)}
            onDuplicate={() => duplicatePanel(panel)}
            onDelete={() => deletePanel(panel.id)}
            canDelete={panels.length > 1}
          />
        ))}
      </section>
    </main>
  );
}
