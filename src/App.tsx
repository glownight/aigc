/**
 * 主应用组件 - 重构后的版本
 * 采用模块化架构，提高代码可维护性和可读性
 */

import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

// Hooks
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSession } from "./hooks/useSession";
import { useEngine } from "./hooks/useEngine";
import { useChat } from "./hooks/useChat";

// Components
import ChatHeader from "./components/ChatHeader";
import ChatSidebar from "./components/ChatSidebar";
import SuggestionCards from "./components/SuggestionCards";
import ChatMessages from "./components/ChatMessages";
import ChatComposer from "./components/ChatComposer";
import SettingsModal from "./components/SettingsModal";

// Types
import type { EngineMode, SessionManager, Theme, Message } from "./types";

function App() {
  // 基础状态
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [downloadPaused, setDownloadPaused] = useState(false);

  // 批量删除功能状态
  const [batchDeleteMode, setBatchDeleteMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
    new Set()
  );

  // 持久化配置
  const [sessionManager, setSessionManager] = useLocalStorage<SessionManager>(
    "aigc.sessions",
    {
      sessions: [],
      currentSessionId: "",
    }
  );

  const [engine, setEngine] = useLocalStorage<EngineMode>(
    "aigc.engine",
    "browser"
  );

  const [theme, setTheme] = useLocalStorage<Theme>("aigc.theme", "black");

  const [browserModel, setBrowserModel] = useLocalStorage(
    "aigc.browserModel",
    "Qwen2.5-0.5B-Instruct-q4f32_1-MLC"
  );

  // 会话管理
  const {
    currentSession,
    sessionId,
    createNewSession,
    switchSession,
    deleteSession,
    updateCurrentSession,
  } = useSession(sessionManager, setSessionManager);

  // 获取当前会话消息
  const defaultMessages: Message[] = useMemo(
    () => [
      {
        id: Math.random().toString(36).slice(2),
        role: "system",
        content: "你是一个有帮助的智能助手。",
      },
      {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content: "你好，我可以为你提供智能问答服务～",
      },
    ],
    []
  );
  const sessionMessages = currentSession?.messages || defaultMessages;

  // 引擎管理
  const { engineRef, engineReady, progressText, setProgressText } = useEngine(
    engine,
    browserModel,
    downloadPaused
  );

  // 聊天逻辑
  const { loading, canSend, handleSend, handleStop } = useChat(
    engineRef,
    engineReady,
    browserModel,
    sessionMessages,
    updateCurrentSession,
    setProgressText,
    downloadPaused,
    setDownloadPaused
  );

  // 建议卡片
  const suggestions = useMemo(
    () => [
      "介绍一下你自己",
      "帮我总结这段文字",
      "把这个段落润色得更专业",
      "生成一份周报提纲",
    ],
    []
  );

  // Refs
  const listRef = useRef<HTMLDivElement>(null);

  // 迁移兼容：老版本小写模型 ID 更正为官方大小写
  useEffect(() => {
    if (browserModel === "qwen2.5-0.5b-instruct-q4f32_1-MLC") {
      setBrowserModel("Qwen2.5-0.5B-Instruct-q4f32_1-MLC");
    }
  }, [browserModel, setBrowserModel]);

  // 启动提示
  useEffect(() => {
    if (engine === "browser" && !engineReady) {
      setProgressText(
        "首次使用需要下载AI模型缓存（约234MB），这是一次性操作。后续访问将秒开！"
      );
    }
  }, [engine, engineReady]);

  // 自动滚动到底部
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [sessionMessages, loading]);

  // 批量删除相关函数
  function toggleBatchDeleteMode() {
    setBatchDeleteMode(!batchDeleteMode);
    setSelectedSessions(new Set());
  }

  function toggleSessionSelection(id: string) {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSessions(newSelected);
  }

  function selectAllSessions() {
    const allSessionIds = new Set(sessionManager.sessions.map((s) => s.id));
    setSelectedSessions(allSessionIds);
  }

  function deselectAllSessions() {
    setSelectedSessions(new Set());
  }

  function handleBatchDelete() {
    if (selectedSessions.size === 0) return;

    const sessionsToKeep = sessionManager.sessions.filter(
      (s) => !selectedSessions.has(s.id)
    );

    // 如果删除后没有会话了，创建一个新的
    if (sessionsToKeep.length === 0) {
      createNewSession();
    } else {
      const currentSessionDeleted = selectedSessions.has(
        sessionManager.currentSessionId
      );
      const newCurrentId = currentSessionDeleted
        ? sessionsToKeep[0].id
        : sessionManager.currentSessionId;

      setSessionManager({
        sessions: sessionsToKeep,
        currentSessionId: newCurrentId,
      });
    }

    setBatchDeleteMode(false);
    setSelectedSessions(new Set());
  }

  function handlePauseDownload() {
    setDownloadPaused(true);
    setProgressText("已暂停，发送消息时自动继续");
  }

  return (
    <div className={`app theme-${theme}`}>
      {/* 头部导航 */}
      <ChatHeader
        progressText={progressText}
        engineReady={engineReady}
        browserModel={browserModel}
        downloadPaused={downloadPaused}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onShowSettings={() => setShowSettings(true)}
        onNewSession={() => createNewSession(() => setShowSidebar(false))}
        onPauseDownload={handlePauseDownload}
      />

      {/* 会话列表侧边栏 */}
      {showSidebar && (
        <ChatSidebar
          sessions={sessionManager.sessions}
          currentSessionId={sessionId || sessionManager.currentSessionId}
          batchDeleteMode={batchDeleteMode}
          selectedSessions={selectedSessions}
          onClose={() => setShowSidebar(false)}
          onCreateNew={() => createNewSession(() => setShowSidebar(false))}
          onSwitchSession={(id) =>
            switchSession(id, () => setShowSidebar(false))
          }
          onDeleteSession={deleteSession}
          onToggleBatchMode={toggleBatchDeleteMode}
          onToggleSelection={toggleSessionSelection}
          onSelectAll={selectAllSessions}
          onDeselectAll={deselectAllSessions}
          onBatchDelete={handleBatchDelete}
        />
      )}

      {/* 主聊天区域 */}
      <main className="chat">
        {/* 建议卡片（仅在没有用户消息时显示） */}
        {sessionMessages.filter((m: Message) => m.role === "user").length ===
          0 && (
          <SuggestionCards
            suggestions={suggestions}
            onSelect={(s) => handleSend(s)}
          />
        )}

        {/* 消息列表 */}
        <ChatMessages
          messages={sessionMessages}
          loading={loading}
          listRef={listRef}
        />
      </main>

      {/* 消息输入框 */}
      <ChatComposer
        input={input}
        loading={loading}
        canSend={canSend && input.trim().length > 0}
        onInputChange={setInput}
        onSend={() => {
          if (input.trim()) {
            handleSend(input);
            setInput("");
          }
        }}
        onStop={handleStop}
      />

      {/* 设置弹窗 */}
      {showSettings && (
        <SettingsModal
          engine={engine}
          theme={theme}
          browserModel={browserModel}
          onClose={() => setShowSettings(false)}
          onEngineChange={setEngine}
          onThemeChange={setTheme}
          onModelChange={setBrowserModel}
        />
      )}
    </div>
  );
}

export default App;
