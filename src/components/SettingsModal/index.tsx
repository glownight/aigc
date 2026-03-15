/**
 * SettingsModal 组件 - 设置弹窗
 */

import { memo, useCallback } from "react";
import type { RemoteApiConfig } from "../../types";
import "./styles.css";

interface SettingsModalProps {
  remoteApiConfig: RemoteApiConfig;
  onClose: () => void;
  onRemoteApiConfigChange: (config: RemoteApiConfig) => void;
}

const SettingsModal = memo(function SettingsModal({
  remoteApiConfig,
  onClose,
  onRemoteApiConfigChange,
}: SettingsModalProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleApiKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onRemoteApiConfigChange({
        ...remoteApiConfig,
        apiKey: e.target.value,
      });
    },
    [remoteApiConfig, onRemoteApiConfigChange],
  );

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">设置</h2>
          <button className="btn ghost" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings">
          <div className="field">
            <label>运行模式</label>
            <input type="text" value="同源代理 /api/chat" disabled />
          </div>

          <div className="field">
            <label>服务商</label>
            <input type="text" value={remoteApiConfig.providerName || "codex-for-me"} disabled />
          </div>

          <div className="field">
            <label>上游地址</label>
            <input
              type="text"
              value={remoteApiConfig.upstreamBaseURL || "https://api-vip.codex-for.me/v1"}
              disabled
            />
          </div>

          <div className="field">
            <label>模型名称</label>
            <input type="text" value={remoteApiConfig.model} disabled />
          </div>

          <div className="field">
            <label>API Key</label>
            <input
              type="password"
              value={remoteApiConfig.apiKey}
              onChange={handleApiKeyChange}
              placeholder="clp-..."
            />
            <small
              style={{
                color: "#999",
                fontSize: "12px",
                marginTop: "8px",
                display: "block",
                lineHeight: "1.6",
              }}
            >
              只需要提供一个 key。
              <br />
              推荐把 key 写到项目根目录 <code>.env.local</code> 的{" "}
              <code>OPENAI_API_KEY</code>，这里留空也能用。
            </small>
          </div>
        </div>

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
