/**
 * ChatHeader 组件 - 顶部导航栏
 */

import { memo } from "react";
import "./styles.css";

interface ChatHeaderProps {
  statusText: string;
  remoteModel?: string;
  onToggleSidebar: () => void;
  onShowSettings: () => void;
  onNewSession: () => void;
  onLock: () => void;
}

const ChatHeader = memo(function ChatHeader({
  statusText,
  remoteModel,
  onToggleSidebar,
  onShowSettings,
  onNewSession,
  onLock,
}: ChatHeaderProps) {
  return (
    <header className="header">
      <div className="topbar-left">
        <button className="btn ghost" onClick={onToggleSidebar}>
          ☰
        </button>
      </div>
      <div className="topbar-right">
        <div className="status-mini">
          <div className="progress-container">
            <span className="progress-text">{statusText}</span>
          </div>

          <span className="ready-dot" data-ready="true"></span>
          <span className="engine-indicator">{remoteModel || "Remote API"}</span>
        </div>
        <button className="btn danger" onClick={onNewSession}>
          新会话
        </button>
        <button className="btn ghost" onClick={onShowSettings}>
          设置
        </button>
        <button className="btn ghost" onClick={onLock} title="锁定应用">
          🔒
        </button>
      </div>
    </header>
  );
});

export default ChatHeader;
