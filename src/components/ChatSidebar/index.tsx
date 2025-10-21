/**
 * ChatSidebar 组件 - 会话列表侧边栏
 */

import { memo, useCallback, useMemo } from "react";
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

const ChatSidebar = memo(function ChatSidebar({
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
  // 计算是否全选
  const isAllSelected = useMemo(() => {
    return selectedSessions.size === sessions.length;
  }, [selectedSessions.size, sessions.length]);

  // 优化点击处理
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      if (batchDeleteMode) {
        onToggleSelection(sessionId);
      } else {
        onSwitchSession(sessionId);
      }
    },
    [batchDeleteMode, onToggleSelection, onSwitchSession]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      if (sessions.length > 1) {
        onDeleteSession(sessionId);
      }
    },
    [sessions.length, onDeleteSession]
  );

  const handleSelectAllToggle = useCallback(() => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [isAllSelected, onDeselectAll, onSelectAll]);
  return (
    <div className="sidebar-backdrop" onClick={handleBackdropClick}>
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
                <button className="btn ghost" onClick={handleSelectAllToggle}>
                  {isAllSelected ? "取消全选" : "全选"}
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
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === currentSessionId}
              batchDeleteMode={batchDeleteMode}
              isSelected={selectedSessions.has(session.id)}
              canDelete={sessions.length > 1}
              onClick={handleSessionClick}
              onToggleSelection={onToggleSelection}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// SessionItem 子组件，避免每次渲染都重新创建
interface SessionItemProps {
  session: Session;
  isActive: boolean;
  batchDeleteMode: boolean;
  isSelected: boolean;
  canDelete: boolean;
  onClick: (sessionId: string) => void;
  onToggleSelection: (sessionId: string) => void;
  onDelete: (e: React.MouseEvent, sessionId: string) => void;
}

const SessionItem = memo(function SessionItem({
  session,
  isActive,
  batchDeleteMode,
  isSelected,
  canDelete,
  onClick,
  onToggleSelection,
  onDelete,
}: SessionItemProps) {
  const handleClick = useCallback(() => {
    onClick(session.id);
  }, [onClick, session.id]);

  const handleCheckboxChange = useCallback(() => {
    onToggleSelection(session.id);
  }, [onToggleSelection, session.id]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      onDelete(e, session.id);
    },
    [onDelete, session.id]
  );

  const formattedDate = useMemo(() => {
    return new Date(session.updatedAt).toLocaleDateString();
  }, [session.updatedAt]);

  return (
    <div
      className={`session-item ${isActive ? "active" : ""} ${
        batchDeleteMode ? "batch-mode" : ""
      }`}
      onClick={handleClick}
    >
      {batchDeleteMode && (
        <div className="session-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="session-content">
        <div className="session-title">{session.title}</div>
        <div className="session-time">{formattedDate}</div>
      </div>
      {!batchDeleteMode && canDelete && (
        <button className="session-delete" onClick={handleDeleteClick}>
          ×
        </button>
      )}
    </div>
  );
});

export default ChatSidebar;
