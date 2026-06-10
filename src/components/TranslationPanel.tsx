import {
  ArrowLeftRight,
  Copy,
  Eraser,
  Loader2,
  Play,
  RefreshCw,
  Square,
  Trash2,
} from "lucide-react";
import { estimateCostUsd, formatUsd } from "../lib/cost";
import {
  getDefaultModel,
  getModelsForProvider,
  languageOptions,
  modeOptions,
  toneOptions,
} from "../lib/models";
import type {
  LanguageCode,
  ProviderId,
  TranslationMode,
  TranslationPanelState,
  TranslationTone,
} from "../lib/types";

interface Props {
  panel: TranslationPanelState;
  onChange: (panel: TranslationPanelState) => void;
  onTranslate: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function TranslationPanel({
  panel,
  onChange,
  onTranslate,
  onCancel,
  onDuplicate,
  onDelete,
  canDelete,
}: Props) {
  const providerModels = getModelsForProvider(panel.provider);
  const estimatedCost = estimateCostUsd(panel.model, panel.input, panel.output);
  const isTranslating = panel.status === "translating";

  function patch(next: Partial<TranslationPanelState>) {
    onChange({ ...panel, ...next });
  }

  function changeProvider(provider: ProviderId) {
    patch({ provider, model: getDefaultModel(provider) });
  }

  function swapLanguages() {
    if (panel.sourceLanguage === "auto") {
      patch({ sourceLanguage: panel.targetLanguage, targetLanguage: "en" });
      return;
    }
    patch({
      sourceLanguage: panel.targetLanguage,
      targetLanguage: panel.sourceLanguage,
      input: panel.output || panel.input,
      output: "",
      status: "idle",
      error: undefined,
    });
  }

  async function copyOutput() {
    if (panel.output) {
      await navigator.clipboard.writeText(panel.output);
    }
  }

  return (
    <article className="translation-panel">
      <header className="panel-header">
        <input
          className="panel-title"
          value={panel.title}
          onChange={(event) => patch({ title: event.target.value })}
          aria-label="面板名稱"
        />
        <div className="icon-row">
          <button type="button" className="icon-button" onClick={onDuplicate} title="複製面板">
            <Copy size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button danger"
            onClick={onDelete}
            disabled={!canDelete}
            title="刪除面板"
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="panel-controls">
        <select value={panel.provider} onChange={(event) => changeProvider(event.target.value as ProviderId)}>
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
        </select>

        <select value={panel.model} onChange={(event) => patch({ model: event.target.value })}>
          {providerModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.tier} · {model.label}
            </option>
          ))}
        </select>

        <select value={panel.mode} onChange={(event) => patch({ mode: event.target.value as TranslationMode })}>
          {modeOptions.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.label}
            </option>
          ))}
        </select>

        <select value={panel.tone} onChange={(event) => patch({ tone: event.target.value as TranslationTone })}>
          {toneOptions.map((tone) => (
            <option key={tone.id} value={tone.id}>
              {tone.label}
            </option>
          ))}
        </select>
      </div>

      <div className="language-row">
        <select
          value={panel.sourceLanguage}
          onChange={(event) => patch({ sourceLanguage: event.target.value as LanguageCode })}
        >
          {languageOptions.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
        <button type="button" className="icon-button swap" onClick={swapLanguages} title="交換語言">
          <ArrowLeftRight size={18} aria-hidden="true" />
        </button>
        <select
          value={panel.targetLanguage}
          onChange={(event) => patch({ targetLanguage: event.target.value as LanguageCode })}
        >
          {languageOptions
            .filter((language) => language.code !== "auto")
            .map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
        </select>
      </div>

      <div className="editor-grid">
        <label className="text-box">
          <span>原文</span>
          <textarea
            value={panel.input}
            placeholder="貼上或輸入要翻譯的內容..."
            onChange={(event) => patch({ input: event.target.value, status: "idle", error: undefined })}
          />
        </label>

        <label className="text-box output">
          <span>譯文</span>
          <textarea value={panel.output} placeholder="翻譯結果會出現在這裡" readOnly />
        </label>
      </div>

      {panel.error ? <div className="panel-error">{panel.error}</div> : null}

      <footer className="panel-footer">
        <div className="cost-line">估算 {formatUsd(estimatedCost)} · 實際費用依供應商帳單為準</div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => patch({ input: "", output: "", status: "idle", error: undefined })}>
            <Eraser size={17} aria-hidden="true" />
            清空
          </button>
          <button type="button" className="ghost-button" onClick={copyOutput} disabled={!panel.output}>
            <Copy size={17} aria-hidden="true" />
            複製
          </button>
          {isTranslating ? (
            <button type="button" className="primary-button stop" onClick={onCancel}>
              <Square size={16} aria-hidden="true" />
              取消
            </button>
          ) : (
            <button type="button" className="primary-button" onClick={onTranslate} disabled={!panel.input.trim()}>
              {panel.status === "done" ? <RefreshCw size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
              翻譯
            </button>
          )}
        </div>
      </footer>

      {isTranslating ? (
        <div className="loading-cover" aria-live="polite">
          <Loader2 className="spin" size={20} aria-hidden="true" />
          翻譯中
        </div>
      ) : null}
    </article>
  );
}
