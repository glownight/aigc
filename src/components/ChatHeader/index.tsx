/**
 * ChatHeader 组件 - 顶部导航栏
 */

import { memo, useMemo } from "react";
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

const ChatHeader = memo(function ChatHeader({
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
  // 计算进度百分比
  const progressPercentage = useMemo(() => {
    const match = progressText.match(/(\d+)%/);
    return match ? match[1] : 0;
  }, [progressText]);

  // 计算是否显示进度条
  const showProgressBar = useMemo(() => {
    return progressText.includes("%");
  }, [progressText]);

  // 计算是否显示操作按钮
  const showQuickActions = useMemo(() => {
    return (
      !engineReady &&
      engineMode === "browser" &&
      progressText.includes("首次") &&
      !downloadPaused
    );
  }, [engineReady, engineMode, progressText, downloadPaused]);

  // 计算引擎状态
  const isEngineReady = useMemo(() => {
    return engineMode === "remote" || engineReady;
  }, [engineMode, engineReady]);

  // 计算显示的模型名称
  const displayModel = useMemo(() => {
    return engineMode === "remote" ? remoteModel || "远程API" : browserModel;
  }, [engineMode, remoteModel, browserModel]);
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
            {showProgressBar && (
              <div className="progress-bar-mini">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            )}

            {/* 仅在首次下载且非移动端时显示操作按钮 */}
            {showQuickActions && (
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

          <span className="ready-dot" data-ready={isEngineReady}></span>
          <span className="engine-indicator">{displayModel}</span>
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
});

export default ChatHeader;
