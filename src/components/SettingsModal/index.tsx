/**
 * SettingsModal 组件 - 设置弹窗
 */

import { memo, useCallback } from "react";
import type { EngineMode, Theme, RemoteApiConfig } from "../../types";
import "./styles.css";

interface SettingsModalProps {
  engine: EngineMode;
  theme: Theme;
  browserModel: string;
  remoteApiConfig: RemoteApiConfig;
  onClose: () => void;
  onEngineChange: (engine: EngineMode) => void;
  onThemeChange: (theme: Theme) => void;
  onModelChange: (model: string) => void;
  onRemoteApiConfigChange: (config: RemoteApiConfig) => void;
}

const SettingsModal = memo(function SettingsModal({
  engine,
  browserModel,
  remoteApiConfig,
  onClose,
  onEngineChange,
  onModelChange,
  onRemoteApiConfigChange,
}: SettingsModalProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleEngineChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newEngine = e.target.value as EngineMode;

      // 检查浏览器是否支持 WebGPU
      if (newEngine === "browser" && !("gpu" in navigator)) {
        alert(
          "⚠️ 浏览器不支持 WebGPU\n\n" +
            "当前浏览器无法运行本地模型。\n\n" +
            "请使用以下浏览器之一：\n" +
            "• Chrome 119+ 版本\n" +
            "• Edge 119+ 版本\n\n" +
            "或继续使用远程 API 模式。"
        );
        return;
      }

      onEngineChange(newEngine);
    },
    [onEngineChange]
  );

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onModelChange(e.target.value);
    },
    [onModelChange]
  );

  const handleBaseURLChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onRemoteApiConfigChange({
        ...remoteApiConfig,
        baseURL: e.target.value,
      });
    },
    [remoteApiConfig, onRemoteApiConfigChange]
  );

  const handleApiKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onRemoteApiConfigChange({
        ...remoteApiConfig,
        apiKey: e.target.value,
      });
    },
    [remoteApiConfig, onRemoteApiConfigChange]
  );

  const handleRemoteModelSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onRemoteApiConfigChange({
        ...remoteApiConfig,
        model: e.target.value,
      });
    },
    [remoteApiConfig, onRemoteApiConfigChange]
  );

  const handleRemoteModelInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onRemoteApiConfigChange({
        ...remoteApiConfig,
        model: e.target.value,
      });
    },
    [remoteApiConfig, onRemoteApiConfigChange]
  );
  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">设置</h2>
          <button className="btn ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="settings">
          <div className="field">
            <label>引擎模式</label>
            <select value={engine} onChange={handleEngineChange}>
              <option value="browser">浏览器本地模型</option>
              <option value="remote">远程API</option>
            </select>
          </div>

          {engine === "browser" ? (
            <div className="field">
              <label>浏览器模型</label>
              <select value={browserModel} onChange={handleModelChange}>
                <option value="Qwen2.5-0.5B-Instruct-q4f32_1-MLC">
                  Qwen2.5-0.5B
                </option>
              </select>
            </div>
          ) : (
            <>
              <div className="field">
                <label>API地址</label>
                <input
                  type="password"
                  value={remoteApiConfig.baseURL}
                  onChange={handleBaseURLChange}
                  placeholder="https://api.openai.com"
                />
              </div>
              <div className="field">
                <label>API密钥</label>
                <input
                  type="password"
                  value={remoteApiConfig.apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="sk-..."
                />
              </div>
              <div className="field">
                <label>模型名称</label>
                <select
                  value={remoteApiConfig.model}
                  onChange={handleRemoteModelSelectChange}
                >
                  <option value="deepseek-chat">
                    DeepSeek Chat（快速响应）
                  </option>
                  <option value="deepseek-reasoner">
                    DeepSeek Reasoner（深度推理，较慢）
                  </option>
                </select>
                <small
                  style={{
                    color: "#999",
                    fontSize: "12px",
                    marginTop: "8px",
                    display: "block",
                    lineHeight: "1.5",
                  }}
                >
                  💡 <strong>Chat</strong>：快速响应，适合日常对话
                  <br />
                  🧠 <strong>Reasoner</strong>
                  ：深度推理，适合复杂问题（响应较慢）
                </small>
                <small
                  style={{
                    color: "#999",
                    fontSize: "12px",
                    marginTop: "12px",
                    display: "block",
                  }}
                >
                  或输入自定义模型名称：
                </small>
                <input
                  type="text"
                  value={remoteApiConfig.model}
                  onChange={handleRemoteModelInputChange}
                  placeholder="如：gpt-4, claude-3等"
                  style={{ marginTop: "8px" }}
                />
              </div>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn primary" onClick={onClose}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
});

export default SettingsModal;
