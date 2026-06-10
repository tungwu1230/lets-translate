import { KeyRound, ShieldCheck } from "lucide-react";
import { modelOptions } from "../lib/models";
import { maskApiKey } from "../lib/storage";
import type { ProviderId, ProviderSettings } from "../lib/types";

interface Props {
  settings: ProviderSettings;
  onChange: (settings: ProviderSettings) => void;
}

const providers: Array<{ id: ProviderId; label: string }> = [
  { id: "openai", label: "OpenAI" },
  { id: "gemini", label: "Gemini" },
];

export function ProviderSettingsPanel({ settings, onChange }: Props) {
  const activeModels = modelOptions.filter((model) => model.provider === settings.provider);
  const activeKey = settings.apiKeys[settings.provider];

  return (
    <section className="settings-band" aria-label="API 設定">
      <div className="settings-main">
        <div className="brand-block">
          <div className="mark">OT</div>
          <div>
            <h1>open-translate</h1>
            <p>可並行、多面板的 LLM 翻譯工作區</p>
          </div>
        </div>

        <div className="provider-controls">
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

          <label className="key-field">
            <KeyRound size={18} aria-hidden="true" />
            <input
              type="password"
              value={activeKey}
              placeholder={`${settings.provider === "openai" ? "OpenAI" : "Gemini"} API key`}
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

          <label className="remember-toggle">
            <input
              type="checkbox"
              checked={settings.rememberKeys}
              onChange={(event) => onChange({ ...settings, rememberKeys: event.target.checked })}
            />
            記住金鑰
          </label>
        </div>
      </div>

      <div className="settings-meta">
        <div className="security-note">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>
            API key 只會從瀏覽器直接送到供應商。{settings.rememberKeys ? `目前會儲存在此瀏覽器：${maskApiKey(activeKey)}` : "預設只保留在目前工作階段。"}
          </span>
        </div>
        <div className="model-strip" aria-label="模型候選">
          {activeModels.map((model) => (
            <span key={model.id} className="model-pill" title={model.notes}>
              {model.tier} · {model.label} · ${model.inputUsdPerMillion}/M in · ${model.outputUsdPerMillion}/M out
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
