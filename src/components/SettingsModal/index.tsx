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
      const newModel = e.target.value;
      const currentModel = browserModel;

      // 如果模型没有改变，直接返回
      if (newModel === currentModel) {
        return;
      }

      // 提示用户切换模型会重新下载
      const confirmSwitch = window.confirm(
        `🔄 切换浏览器模型\n\n` +
          `当前: ${currentModel}\n` +
          `新模型: ${newModel}\n\n` +
          `⚠️ 注意：切换模型需要重新下载模型文件（约200-500MB），这可能需要一些时间。\n\n` +
          `是否继续？`
      );

      if (confirmSwitch) {
        onModelChange(newModel);
      } else {
        // 用户取消，不改变选择（强制刷新组件）
        e.target.value = currentModel;
      }
    },
    [onModelChange, browserModel]
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
                  Qwen2.5-0.5B（轻量级，约234MB）
                </option>
                <option value="Qwen2.5-1.5B-Instruct-q4f16_1-MLC">
                  Qwen2.5-1.5B（平衡版，约900MB）
                </option>
                <option value="Llama-3.2-1B-Instruct-q4f16_1-MLC">
                  Llama 3.2-1B（Meta出品，约600MB）
                </option>
                <option value="Phi-3.5-mini-instruct-q4f16_1-MLC">
                  Phi-3.5-mini（Microsoft出品，约2.3GB）
                </option>
                <option value="gemma-2-2b-it-q4f16_1-MLC">
                  Gemma-2-2B（Google出品，约1.5GB）
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
                💡
                提示：首次使用需下载模型文件，建议从轻量级开始。模型越大，效果越好但下载时间越长。
              </small>
            </div>
          ) : (
            <>
              <div className="field">
                <label>后端网关地址</label>
                <input
                  type="text"
                  value={remoteApiConfig.baseURL}
                  onChange={handleBaseURLChange}
                  placeholder="http://localhost:3001"
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
                  <option value="deepseek-r1">DeepSeek R1（推理模型）</option>
                  <option value="deepseek-r1-250528">
                    DeepSeek R1-250528（推理模型特定版本）
                  </option>
                  <option value="deepseek-reasoner">
                    DeepSeek Reasoner（深度推理，较慢）
                  </option>
                  <option value="deepseek-reasoner-all">
                    DeepSeek Reasoner All（完整推理）
                  </option>
                  <option value="deepseek-v3">DeepSeek V3（最新版本）</option>
                  <option value="deepseek-v3-250324">
                    DeepSeek V3-250324（V3特定版本）
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
                  后端将自动代理到上游模型服务，密钥仅保存在服务端。
                  <br />
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
