/**
 * ChatHeader 组件 - 顶部导航栏
 */

import "./styles.css";

interface ChatHeaderProps {
  progressText: string;
  engineReady: boolean;
  browserModel: string;
  downloadPaused: boolean;
  engineMode?: "browser" | "remote";
  remoteModel?: string;
  onToggleSidebar: () => void;
  onShowSettings: () => void;
  onNewSession: () => void;
  onPauseDownload: () => void;
  onLock: () => void;
}

export default function ChatHeader({
  progressText,
  engineReady,
  browserModel,
  downloadPaused,
  engineMode = "browser",
  remoteModel,
  onToggleSidebar,
  onShowSettings,
  onNewSession,
  onPauseDownload,
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
            <span className="progress-text">{progressText}</span>

            {/* 进度条 */}
            {progressText.includes("%") && (
              <div className="progress-bar-mini">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progressText.match(/(\d+)%/)?.[1] || 0}%`,
                  }}
                ></div>
              </div>
            )}

            {/* 仅在首次下载且非移动端时显示操作按钮 */}
            {!engineReady &&
              engineMode === "browser" &&
              progressText.includes("首次") &&
              !downloadPaused && (
                <div className="loading-tips-compact">
                  <div className="quick-actions">
                    <button
                      className="btn-mini ghost"
                      onClick={onPauseDownload}
                      title="暂停下载"
                    >
                      暂停
                    </button>
                  </div>
                </div>
              )}
          </div>

          <span
            className="ready-dot"
            data-ready={engineMode === "remote" || engineReady}
          ></span>
          <span className="engine-indicator">
            {engineMode === "remote" ? remoteModel || "远程API" : browserModel}
          </span>
        </div>
        <button className="btn ghost" onClick={onLock} title="锁定应用">
          🔒
        </button>
        <button className="btn ghost" onClick={onShowSettings}>
          设置
        </button>
        <button className="btn danger" onClick={onNewSession}>
          新会话
        </button>
      </div>
    </header>
  );
}
