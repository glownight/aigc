/**
 * ChatSidebar 组件 - 会话列表侧边栏
 */

import type { Session } from "../../types";
import "./styles.css";

interface ChatSidebarProps {
  sessions: Session[];
  currentSessionId: string;
  batchDeleteMode: boolean;
  selectedSessions: Set<string>;
  onClose: () => void;
  onCreateNew: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onToggleBatchMode: () => void;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchDelete: () => void;
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  batchDeleteMode,
  selectedSessions,
  onClose,
  onCreateNew,
  onSwitchSession,
  onDeleteSession,
  onToggleBatchMode,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
}: ChatSidebarProps) {
  return (
    <div className="sidebar-backdrop" onClick={onClose}>
      <div className="sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <h3>历史会话</h3>
          <div
            className={`sidebar-actions ${batchDeleteMode ? "batch-mode" : ""}`}
          >
            {!batchDeleteMode ? (
              <>
                <button className="btn ghost" onClick={onToggleBatchMode}>
                  批量删除
                </button>
                <button className="btn ghost" onClick={onCreateNew}>
                  + 新建
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn ghost"
                  onClick={
                    selectedSessions.size === sessions.length
                      ? onDeselectAll
                      : onSelectAll
                  }
                >
                  {selectedSessions.size === sessions.length
                    ? "取消全选"
                    : "全选"}
                </button>
                <button
                  className="btn danger"
                  onClick={onBatchDelete}
                  disabled={selectedSessions.size === 0}
                >
                  删除({selectedSessions.size})
                </button>
                <button className="btn ghost" onClick={onToggleBatchMode}>
                  取消
                </button>
              </>
            )}
          </div>
        </div>
        <div className="session-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${
                session.id === currentSessionId ? "active" : ""
              } ${batchDeleteMode ? "batch-mode" : ""}`}
              onClick={() => {
                if (batchDeleteMode) {
                  onToggleSelection(session.id);
                } else {
                  onSwitchSession(session.id);
                }
              }}
            >
              {batchDeleteMode && (
                <div className="session-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSessions.has(session.id)}
                    onChange={() => onToggleSelection(session.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="session-content">
                <div className="session-title">{session.title}</div>
                <div className="session-time">
                  {new Date(session.updatedAt).toLocaleDateString()}
                </div>
              </div>
              {!batchDeleteMode && (
                <button
                  className="session-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (sessions.length > 1) {
                      onDeleteSession(session.id);
                    }
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
