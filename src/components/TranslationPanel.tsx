import {
  ArrowLeftRight,
  Copy,
  CopyPlus,
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
  isCompareMode: boolean;
}



export function TranslationPanel({
  panel,
  onChange,
  onTranslate,
  onCancel,
  onDuplicate,
  onDelete,
  canDelete,
  isCompareMode,
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
      {/* 1. Seamless Integrated Language Selector Row at Top */}
      <div className="lang-selector-row">
        <select
          className="lang-dropdown"
          value={panel.sourceLanguage}
          onChange={(event) => patch({ sourceLanguage: event.target.value as LanguageCode })}
          aria-label="來源語言"
        >
          {languageOptions.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
        
        <button type="button" className="swap-button-circle" onClick={swapLanguages} title="交換語言">
          <ArrowLeftRight size={15} aria-hidden="true" />
        </button>
        
        <select
          className="lang-dropdown"
          value={panel.targetLanguage}
          onChange={(event) => patch({ targetLanguage: event.target.value as LanguageCode })}
          aria-label="目標語言"
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

      {/* 2. Main Editors Split Area */}
      <div className="panel-split">
        {/* Left Side: Input Textarea */}
        <div className="editor-pane input-pane">
          <div className="pane-header-row">
            <span className="pane-tag">原文</span>
            {isCompareMode && (
              <input
                className="panel-title-inline"
                value={panel.title}
                onChange={(event) => patch({ title: event.target.value })}
                aria-label="面板名稱"
              />
            )}
          </div>
          <textarea
            value={panel.input}
            placeholder="貼上或輸入要翻譯的內容..."
            onChange={(event) => patch({ input: event.target.value, status: "idle", error: undefined })}
          />
          
          <div className="pane-footer">
            <span className="word-count">{panel.input.length} 字</span>
            <div className="actions">
              {isCompareMode && (
                <>
                  <button type="button" className="action-btn-icon-only" onClick={onDuplicate} title="複製面板">
                    <CopyPlus size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="action-btn-icon-only danger"
                    onClick={onDelete}
                    disabled={!canDelete}
                    title="刪除面板"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </>
              )}
              <button type="button" className="action-btn-text" onClick={() => patch({ input: "", output: "", status: "idle", error: undefined })}>
                <Eraser size={14} aria-hidden="true" />
                清空
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Output Textarea */}
        <div className="editor-pane output-pane">
          <span className="pane-tag">譯文</span>
          <textarea value={panel.output} placeholder="翻譯結果會出現在這裡..." readOnly />
          
          {panel.error && <div className="panel-error-inline">{panel.error}</div>}

          <div className="pane-footer">
            <span className="word-count status-indicator">
              {panel.status === "done" && <span className="status-dot success">已就緒</span>}
              {panel.status === "error" && <span className="status-dot error">翻譯出錯</span>}
              {panel.status === "idle" && <span className="status-dot">待翻譯</span>}
            </span>
            <div className="actions">

              <button type="button" className="action-btn-text" onClick={copyOutput} disabled={!panel.output}>
                <Copy size={13} aria-hidden="true" />
                複製譯文
              </button>
              {isTranslating ? (
                <button type="button" className="action-btn-text stop" onClick={onCancel}>
                  <Square size={13} aria-hidden="true" />
                  取消
                </button>
              ) : (
                <button type="button" className="action-btn-text accent" onClick={onTranslate} disabled={!panel.input.trim()}>
                  {panel.status === "done" ? <RefreshCw size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
                  翻譯
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isTranslating && (
        <div className="loading-cover" aria-live="polite">
          <Loader2 className="spin" size={20} aria-hidden="true" />
          翻譯中
        </div>
      )}
    </article>
  );
}


