"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

export interface AppConfig {
  mongoUri: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  maxContext: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  mongoUri: "mongodb://127.0.0.1:27017/aichat",
  apiUrl: "https://llm.chiasegpu.vn/v1/chat/completions",
  apiKey: "",
  model: "claude-sonnet-4.6",
  maxContext: 30,
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
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>
            <div className="input-field">
              <label>API Endpoint URL</label>
              <input
                type="text"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
              />
            </div>
            <div className="input-group-row">
              <div className="input-field">
                <label>Model Name</label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                />
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
                      maxContext: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={() => {
              onSave(config);
              onClose();
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
