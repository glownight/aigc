/**
 * SettingsModal 组件 - 设置弹窗
 */

import type { EngineMode, Theme } from "../../types";
import "./styles.css";

interface SettingsModalProps {
  engine: EngineMode;
  theme: Theme;
  browserModel: string;
  onClose: () => void;
  onEngineChange: (engine: EngineMode) => void;
  onThemeChange: (theme: Theme) => void;
  onModelChange: (model: string) => void;
}

export default function SettingsModal({
  engine,
  browserModel,
  onClose,
  onEngineChange,
  onModelChange,
}: SettingsModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
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
            <select
              value={engine}
              onChange={(e) => onEngineChange(e.target.value as EngineMode)}
            >
              <option value="browser">AI大模型</option>
            </select>
          </div>

          {/* 主题选择已注释，保留代码结构
          <div className="field">
            <label>主题</label>
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as Theme)}
            >
              <option value="blue">蓝色</option>
              <option value="pink">粉色</option>
              <option value="green">绿色</option>
              <option value="yellow">黄色</option>
              <option value="black">黑色</option>
            </select>
          </div> 
          */}

          <div className="field">
            <label>AI大模型</label>
            <select
              value={browserModel}
              onChange={(e) => onModelChange(e.target.value)}
            >
              <option value="Qwen2.5-0.5B-Instruct-q4f32_1-MLC">
                Qwen2.5-0.5B
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
