"use client";

import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface AppConfig {
  mongoUri: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  visionModel: string;
  combineModels?: boolean;
  maxContext: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  mongoUri: "mongodb://127.0.0.1:27017/aichat",
  apiUrl: "https://llm.chiasegpu.vn/v1/chat/completions",
  apiKey: "",
  model: "claude-sonnet-4.6",
  visionModel: "gpt-5.4",
  combineModels: false,
  maxContext: 20,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AppConfig) => void;
  currentConfig: AppConfig;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}: SettingsModalProps) {
  const [config, setConfig] = useState<AppConfig>(currentConfig);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const isFormValid =
    config.mongoUri.trim() !== "" &&
    config.apiUrl.trim() !== "" &&
    config.apiKey.trim() !== "" &&
    config.model.trim() !== "" &&
    config.visionModel.trim() !== "" &&
    typeof config.maxContext === "number" &&
    config.maxContext > 0 &&
    !isNaN(config.maxContext);

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="icon-btn cancel" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <h3>Database Connections</h3>
            <div className="input-field">
              <label>MongoDB Connection URI</label>
              <input
                type="text"
                value={config.mongoUri}
                onChange={(e) =>
                  setConfig({ ...config, mongoUri: e.target.value })
                }
                placeholder="mongodb://127.0.0.1:27017/aichat"
              />
              <p className="helper-text">
                Local or Atlas URI to store your chat history.
              </p>
            </div>
          </div>

          <div className="setting-group">
            <h3>AI Provider (LLM API)</h3>
            <div className="input-field">
              <label>API Key</label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) =>
                  setConfig({ ...config, apiKey: e.target.value })
                }
                placeholder="sk-..."
              />
            </div>
            <div className="input-field">
              <label>API Endpoint URL</label>
              <input
                type="text"
                value={config.apiUrl}
                onChange={(e) =>
                  setConfig({ ...config, apiUrl: e.target.value })
                }
              />
            </div>
            <div className="input-field">
              <label>Main Model</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) =>
                  setConfig({ ...config, model: e.target.value })
                }
              />
            </div>
            <div className="input-field">
              <label>Vision Model</label>
              <input
                type="text"
                value={config.visionModel || ""}
                onChange={(e) =>
                  setConfig({ ...config, visionModel: e.target.value })
                }
                placeholder="Model for image processing"
              />
            </div>
            <div
              className="input-field"
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: "8px",
                marginTop: "-4px",
              }}
            >
              <input
                type="checkbox"
                id="combineModels"
                checked={config.combineModels || false}
                onChange={(e) =>
                  setConfig({ ...config, combineModels: e.target.checked })
                }
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "var(--accent)",
                  marginTop: "3px",
                }}
              />
              <label
                htmlFor="combineModels"
                style={{
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                Check when you want to use vision model just in 1 msg
                <br />
                Uncheck when you want to use vision model in all msg if it has
                images
              </label>
            </div>
            <div className="input-field">
              <label>Max Context Messages</label>
              <input
                type="number"
                min={1}
                max={200}
                value={config.maxContext}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxContext: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-btn"
            disabled={!isFormValid}
            style={{
              opacity: isFormValid ? 1 : 0.5,
              cursor: isFormValid ? "pointer" : "not-allowed"
            }}
            onClick={() => {
              if (isFormValid) {
                onSave(config);
                onClose();
              }
            }}
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
