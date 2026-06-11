import {
  ArrowLeftRight,
  Copy,
  Eraser,
  Loader2,
  Play,
  RefreshCw,
  Square,
  Star,
  X,
} from "lucide-react";
import {
  languageOptions,
  getLanguageLabel,
} from "../lib/models";
import { LanguageSelector } from "./LanguageSelector";
import type { TranslationPanelState, FavoritePair, LanguageCode } from "../lib/types";

interface Props {
  panel: TranslationPanelState;
  onChange: (panel: TranslationPanelState) => void;
  onTranslate: () => void;
  onCancel: () => void;
  onDelete: () => void;
  canDelete: boolean;
  favoritePairs: FavoritePair[];
  onToggleFavorite: (source: LanguageCode, target: LanguageCode) => void;
}


export function TranslationPanel({
  panel,
  onChange,
  onTranslate,
  onCancel,
  onDelete,
  canDelete,
  favoritePairs,
  onToggleFavorite,
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

  const isFavorite = favoritePairs.some(
    (p) => p.sourceLanguage === panel.sourceLanguage && p.targetLanguage === panel.targetLanguage
  );

  const MAX_CHARS = 5000;

  return (
    <article className="translation-panel">
      {/* 1. Close (Delete) Button at Top Right when multiple panels exist */}
      {canDelete && (
        <button
          type="button"
          className="panel-close-btn"
          onClick={onDelete}
          title="刪除面板"
          aria-label="刪除面板"
        >
          <X size={16} />
        </button>
      )}

      {/* 2. Seamless Integrated Language Selector Row at Top */}
      <div className="lang-selector-row">
        <LanguageSelector
          value={panel.sourceLanguage}
          onChange={(code) => patch({ sourceLanguage: code })}
        />
        
        <button type="button" className="swap-button-circle" onClick={swapLanguages} title="交換語言">
          <ArrowLeftRight size={15} aria-hidden="true" />
        </button>
        
        <LanguageSelector
          value={panel.targetLanguage}
          onChange={(code) => patch({ targetLanguage: code })}
          excludeAuto
        />
      </div>

      {/* 2.5 Favorites Bar */}
      <div className="favorites-bar">
        <span className="favorites-label">常用：</span>
        <div className="favorites-chips">
          {favoritePairs.map((pair) => {
            const isCurrent =
              pair.sourceLanguage === panel.sourceLanguage &&
              pair.targetLanguage === panel.targetLanguage;
            return (
              <button
                type="button"
                key={pair.id}
                className={`favorite-chip ${isCurrent ? "active" : ""}`}
                onClick={() =>
                  patch({
                    sourceLanguage: pair.sourceLanguage,
                    targetLanguage: pair.targetLanguage,
                    status: "idle",
                    error: undefined,
                  })
                }
              >
                {getLanguageLabel(pair.sourceLanguage)} → {getLanguageLabel(pair.targetLanguage)}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={`favorite-star-btn ${isFavorite ? "active" : ""}`}
          onClick={() => onToggleFavorite(panel.sourceLanguage, panel.targetLanguage)}
          title={isFavorite ? "取消收藏此組合" : "收藏此組合"}
        >
          <Star size={13} fill={isFavorite ? "var(--accent-color)" : "none"} aria-hidden="true" />
        </button>
      </div>


      {/* 3. Main Editors Split Area */}
      <div className="panel-split">
        {/* Left Side: Input Textarea */}
        <div className="editor-pane input-pane">
          <span className="pane-tag">原文</span>
          <textarea
            value={panel.input}
            maxLength={MAX_CHARS}
            placeholder="貼上或輸入要翻譯的內容..."
            onChange={(event) => patch({ input: event.target.value, status: "idle", error: undefined })}
          />
          
          <div className="pane-footer">
            <span className={`word-count ${panel.input.length >= MAX_CHARS ? "limit-reached" : ""}`}>
              {panel.input.length} / {MAX_CHARS} 字
            </span>
            <div className="actions">
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




