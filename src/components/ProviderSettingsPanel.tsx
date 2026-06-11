import { KeyRound, ShieldCheck, X } from "lucide-react";
import { modelOptions, modeOptions, toneOptions } from "../lib/models";
import { maskApiKey } from "../lib/storage";
import type { ProviderId, ProviderSettings, TranslationMode, TranslationTone } from "../lib/types";

interface Props {
  settings: ProviderSettings;
  onChange: (settings: ProviderSettings) => void;
  onClose: () => void;
}

const providers: Array<{ id: ProviderId; label: string }> = [
  { id: "openai", label: "OpenAI" },
  { id: "gemini", label: "Gemini" },
  { id: "custom", label: "Custom" },
];

export function ProviderSettingsPanel({ settings, onChange, onClose }: Props) {
  const activeModels = modelOptions.filter((model) => model.provider === settings.provider);
  const activeKey = settings.apiKeys[settings.provider];
  const activeModelId = settings.model[settings.provider];
  const isCustom = settings.provider === "custom";

  return (
    <section className="settings-drawer-content" aria-label="設定">
      <header className="drawer-header">
        <div className="drawer-title">
          <h2>設定</h2>
          <p>調整 API 供應商、翻譯偏好與模型設定</p>
        </div>
        <button type="button" className="close-btn" onClick={onClose} title="關閉設定">
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="drawer-body">
        {/* Section 1: API Provider & Key */}
        <div className="settings-group">
          <h3>API 供應商</h3>
          <div className="provider-row">
            <div className="segmented" role="tablist" aria-label="API 供應商">
              {providers.map((provider) => (
                <button
                  type="button"
                  key={provider.id}
                  className={settings.provider === provider.id ? "active" : ""}
                  onClick={() => onChange({ ...settings, provider: provider.id })}
                >
                  {provider.label}
                </button>
              ))}
            </div>

          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
            <label className="remember-toggle">
              <input
                type="checkbox"
                checked={settings.rememberKeys}
                onChange={(event) => onChange({ ...settings, rememberKeys: event.target.checked })}
              />
              記住金鑰
            </label>

            <label className="remember-toggle">
              <input
                type="checkbox"
                checked={settings.stream}
                onChange={(event) => onChange({ ...settings, stream: event.target.checked })}
              />
              啟用串流模式
            </label>
          </div>

          <label className="key-field">
            <KeyRound size={18} aria-hidden="true" />
            <input
              type="password"
              value={activeKey}
              placeholder={`${isCustom ? "API Key (選填)" : settings.provider === "openai" ? "OpenAI" : "Gemini"} API key`}
              onChange={(event) =>
                onChange({
                  ...settings,
                  apiKeys: {
                    ...settings.apiKeys,
                    [settings.provider]: event.target.value,
                  },
                })
              }
            />
          </label>
          
          <div className="security-note">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>
              API key 只會儲存在此瀏覽器中：{maskApiKey(activeKey) || "尚未輸入"}
            </span>
          </div>
        </div>

        {/* Section 2: Custom API Configuration */}
        {isCustom && (
          <div className="settings-group">
            <h3>自訂 API 設定</h3>
            
            <div className="config-item">
              <label>API Endpoint (端點 URL)</label>
              <input 
                type="text"
                className="text-input"
                style={{
                  width: "100%",
                  height: "42px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "0 12px",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  outline: "none"
                }}
                value={settings.customEndpoint}
                placeholder="https://api.openai.com/v1/chat/completions"
                onChange={(event) => onChange({ ...settings, customEndpoint: event.target.value })}
              />
            </div>

            <div className="config-item" style={{ marginTop: "12px" }}>
              <label>模型名稱 (Model Name)</label>
              <input 
                type="text"
                className="text-input"
                style={{
                  width: "100%",
                  height: "42px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "0 12px",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  outline: "none"
                }}
                value={settings.customModel}
                placeholder="gpt-4o"
                onChange={(event) => onChange({ ...settings, customModel: event.target.value })}
              />
            </div>
          </div>
        )}

        {/* Section 3: Model Selector (for pre-defined API providers) */}
        {!isCustom && (
          <div className="settings-group">
            <h3>模型選擇</h3>
            <div className="select-container">
              <select 
                value={activeModelId} 
                onChange={(event) => onChange({
                  ...settings,
                  model: {
                    ...settings.model,
                    [settings.provider]: event.target.value
                  }
                })}
              >
                {activeModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.tier} · {model.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="model-strip" aria-label="模型資訊">
              {activeModels.map((model) => (
                <span key={model.id} className={`model-pill ${activeModelId === model.id ? "active-pill" : ""}`} title={model.notes}>
                  {model.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Translation Config */}
        <div className="settings-group">
          <h3>翻譯模式與語氣</h3>
          
          <div className="config-grid">
            <div className="config-item">
              <label>翻譯風格</label>
              <select 
                value={settings.mode} 
                onChange={(event) => onChange({ ...settings, mode: event.target.value as TranslationMode })}
              >
                {modeOptions.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="config-item">
              <label>翻譯語氣</label>
              <select 
                value={settings.tone} 
                onChange={(event) => onChange({ ...settings, tone: event.target.value as TranslationTone })}
              >
                {toneOptions.map((tone) => (
                  <option key={tone.id} value={tone.id}>
                    {tone.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Developer Mode */}
        <div className="settings-group">
          <h3>開發人員設定</h3>
          <label className="remember-toggle" style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={settings.developerMode}
              onChange={(event) => onChange({ ...settings, developerMode: event.target.checked })}
            />
            <span>啟用開發人員模式 (顯示詳細的 Token 消耗、翻譯時間與估算花費)</span>
          </label>
        </div>
      </div>
    </section>
  );
}


