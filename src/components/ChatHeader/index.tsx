/**
 * ChatHeader 组件 - 顶部导航栏
 */

import { memo } from "react";
import "./styles.css";

interface ChatHeaderProps {
  remoteModel?: string;
  onToggleSidebar: () => void;
  onShowSettings: () => void;
  onNewSession: () => void;
  onLock: () => void;
}

const ChatHeader = memo(function ChatHeader({
  remoteModel,
  onToggleSidebar,
  onShowSettings,
  onNewSession,
  onLock,
}: ChatHeaderProps) {
  return (
    <header className="header workspace-header">
      <div className="workspace-header__left">
        <button
          className="btn workspace-header__menu"
          type="button"
          onClick={onToggleSidebar}
          aria-label="打开会话列表"
          title="会话列表"
        >
          <span className="workspace-header__menu-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <div className="workspace-header__right">
        <div className="workspace-header__status" aria-live="polite">
          <div className="workspace-header__status-chip">
            <span className="ready-dot" data-ready="true" />
            <span className="engine-indicator">
              {remoteModel || "Remote API"}
            </span>
          </div>
        </div>

        <div className="workspace-header__actions">
          <button
            className="btn workspace-header__action workspace-header__action--emphasis"
            type="button"
            onClick={onNewSession}
          >
            <span className="workspace-header__action-kicker">New</span>
            <span className="workspace-header__action-label">新会话</span>
          </button>

          <button
            className="btn workspace-header__action"
            type="button"
            onClick={onShowSettings}
          >
            <span className="workspace-header__action-kicker">Control</span>
            <span className="workspace-header__action-label">设置</span>
          </button>

          <button
            className="btn workspace-header__action workspace-header__action--lock"
            type="button"
            onClick={onLock}
            title="锁定应用"
            aria-label="锁定应用"
          >
            <span className="workspace-header__action-kicker">Lock</span>
            <span className="workspace-header__action-label">锁定</span>
          </button>
        </div>
      </div>
    </header>
  );
});

export default ChatHeader;
