import { useState } from "react";
import { X, Trash2, Clock, Coins, Terminal, Copy } from "lucide-react";
import type { HistoryRecord } from "../lib/types";
import { formatUsd } from "../lib/cost";
import { getLanguageLabel } from "../lib/models";

interface Props {
  records: HistoryRecord[];
  developerMode: boolean;
  onClose: () => void;
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  onApplyRecord?: (record: HistoryRecord) => void;
}

function CollapsibleText({
  label,
  text,
  type = "normal",
  onCopy,
}: {
  label: string;
  text: string;
  type?: "normal" | "accent";
  onCopy?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 120;
  const shouldCollapse = text.length > maxLength;
  const displayText = isExpanded || !shouldCollapse ? text : text.slice(0, maxLength) + "...";

  return (
    <div
      style={{
        fontSize: "13px",
        background: type === "accent" ? "rgba(63, 98, 18, 0.03)" : "var(--bg-primary)",
        padding: "8px 10px",
        borderRadius: "6px",
        borderLeft: type === "accent" ? "3.5px solid var(--accent-color)" : "none",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: type === "accent" ? "var(--accent-color)" : "var(--text-secondary)",
          marginBottom: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
        }}
      >
        <span>{label}</span>
        {onCopy && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              padding: 0,
            }}
            title="複製文字"
          >
            <Copy size={12} />
          </button>
        )}
      </div>
      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{displayText}</div>
      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent-color)",
            fontSize: "11px",
            padding: "4px 0 0 0",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isExpanded ? "收合" : "顯示更多"}
        </button>
      )}
    </div>
  );
}

export function HistoryDrawer({
  records,
  developerMode,
  onClose,
  onDeleteRecord,
  onClearHistory,
  onApplyRecord,
}: Props) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <section className="settings-drawer-content" aria-label="歷史紀錄">
      <header className="drawer-header">
        <div className="drawer-title">
          <h2>歷史紀錄</h2>
          <p>查看過去的翻譯紀錄 ({records.length} 筆)</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {records.length > 0 && (
            <button
              type="button"
              className="ghost-button"
              onClick={onClearHistory}
              title="清除全部歷史紀錄"
              style={{
                padding: "6px 10px",
                fontSize: "12px",
                color: "var(--danger-color)",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Trash2 size={14} />
              清除全部
            </button>
          )}
          <button type="button" className="close-btn" onClick={onClose} title="關閉歷史紀錄">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="drawer-body" style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>
        {records.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-secondary)" }}>
            目前沒有歷史紀錄，翻譯完成後會自動記錄在此。
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "12px",
                background: "var(--bg-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                position: "relative",
              }}
            >
              {/* Header: Languages & Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "var(--accent-color)" }}>
                  {getLanguageLabel(record.sourceLanguage)} → {getLanguageLabel(record.targetLanguage)}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {onApplyRecord && (
                    <button
                      type="button"
                      onClick={() => onApplyRecord(record)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "11px",
                        color: "var(--accent-color)",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      套用至面板
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteRecord(record.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                    title="刪除紀錄"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Translation Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <CollapsibleText
                  label="原文"
                  text={record.input}
                  type="normal"
                  onCopy={() => handleCopy(record.input)}
                />
                <CollapsibleText
                  label="譯文"
                  text={record.output}
                  type="accent"
                  onCopy={() => handleCopy(record.output)}
                />
              </div>

              {/* Developer Metadata / Stats */}
              {developerMode && (
                <div
                  style={{
                    marginTop: "4px",
                    paddingTop: "8px",
                    borderTop: "1px dashed var(--border-color)",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Terminal size={12} />
                    <span>模型: {record.provider} / {record.model}</span>
                  </div>
                  {record.durationMs !== undefined && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />
                      <span>耗時: {record.durationMs}ms</span>
                    </div>
                  )}
                  {record.usage && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", gridColumn: "span 2" }}>
                      <Coins size={12} />
                      <span>
                        Tokens: {record.usage.totalTokens} (In: {record.usage.promptTokens} / Out: {record.usage.completionTokens})
                        {record.usage.estimatedCostUsd !== undefined && ` · 估算花費: ${formatUsd(record.usage.estimatedCostUsd)}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", textAlign: "right", marginTop: "2px" }}>
                {new Date(record.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
