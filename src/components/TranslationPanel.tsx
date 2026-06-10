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
import {
  languageOptions,
} from "../lib/models";
import type {
  LanguageCode,
  TranslationPanelState,
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
  const isTranslating = panel.status === "translating";

  function patch(next: Partial<TranslationPanelState>) {
    onChange({ ...panel, ...next });
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
          <span className="editor-label">原文</span>
          <textarea
            value={panel.input}
            placeholder="貼上或輸入要翻譯的內容..."
            onChange={(event) => patch({ input: event.target.value, status: "idle", error: undefined })}
          />
        </label>

        <label className="text-box output">
          <span className="editor-label">譯文</span>
          <textarea value={panel.output} placeholder="翻譯結果會出現在這裡" readOnly />
        </label>
      </div>

      {panel.error ? <div className="panel-error">{panel.error}</div> : null}

      <footer className="panel-footer">
        <div className="status-indicator">
          {panel.status === "done" && <span className="status-tag done">翻譯完成</span>}
          {panel.status === "error" && <span className="status-tag error">錯誤</span>}
        </div>
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

