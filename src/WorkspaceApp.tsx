import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import { getDefaultEngine, getRemoteApiConfig } from "./config/env";
import { useChat } from "./hooks/useChat";
import { useEngine } from "./hooks/useEngine";
import { useRemoteChat } from "./hooks/useRemoteChat";
import { useSession } from "./hooks/useSession";
import { useSessionStorage } from "./hooks/useSessionStorage";

import ChatComposer from "./components/ChatComposer";
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import ChatSidebar from "./components/ChatSidebar";
import ConfirmModal from "./components/ConfirmModal";
import SettingsModal from "./components/SettingsModal";
import SuggestionCards from "./components/SuggestionCards";

import type {
  EngineMode,
  Message,
  RemoteApiConfig,
  SessionManager,
  Theme,
} from "./types";

interface WorkspaceAppProps {
  onLock: () => void;
}

function WorkspaceApp({ onLock }: WorkspaceAppProps) {
  useEffect(() => {
    console.log("=".repeat(60));
    console.log("[App] 应用已加载");
    console.log("[App] 当前路径:", window.location.pathname);
    console.log("[App] 存储模式: sessionStorage（会话级存储）");
    console.log("[App] 关闭标签页后所有数据将自动清除");
    console.log("=".repeat(60));

    const checkBrowserCompatibility = () => {
      const isWebGPUSupported = "gpu" in navigator;
      console.log("[App] 浏览器兼容性检查:");
      console.log("  • WebGPU 支持:", isWebGPUSupported ? "✅ 是" : "❌ 否");

      if (!isWebGPUSupported) {
        console.warn("[App] 浏览器不支持 WebGPU，无法使用本地模型");
        console.warn(
          "[App] 建议：使用 Chrome/Edge 119+ 版本，或使用远程 API 模式",
        );
      }

      console.log(
        "  • User Agent:",
        navigator.userAgent.substring(0, 50) + "...",
      );
    };

    checkBrowserCompatibility();

    const oldKeys = [
      "aigc.sessions",
      "aigc.engine",
      "aigc.theme",
      "aigc.browserModel",
      "aigc.remoteApiConfig",
    ];

    let cleanedCount = 0;
    oldKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        cleanedCount += 1;
      }
    });

    if (cleanedCount > 0) {
      console.log(`[App] 已清理 ${cleanedCount} 个旧的 localStorage 数据`);
    }
  }, []);

  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [downloadPaused, setDownloadPaused] = useState(false);
  const [batchDeleteMode, setBatchDeleteMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
    new Set(),
  );

  const [sessionManager, setSessionManager] = useSessionStorage<SessionManager>(
    "aigc.sessions",
    {
      sessions: [],
      currentSessionId: "",
    },
  );

  const [engine, setEngine] = useSessionStorage<EngineMode>(
    "aigc.engine",
    getDefaultEngine(),
  );

  const [theme, setTheme] = useSessionStorage<Theme>("aigc.theme", "black");
  const [browserModel, setBrowserModel] = useSessionStorage(
    "aigc.browserModel",
    "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
  );
  const [remoteApiConfig, setRemoteApiConfig] =
    useSessionStorage<RemoteApiConfig>(
      "aigc.remoteApiConfig",
      getRemoteApiConfig(),
    );

  useEffect(() => {
    const envConfig = getRemoteApiConfig();
    if (envConfig.apiKey && envConfig.apiKey !== remoteApiConfig.apiKey) {
      console.log("[App] 检测到环境变量配置，更新 API 配置");
      setRemoteApiConfig(envConfig);
    }
  }, []);

  const {
    currentSession,
    sessionId,
    createNewSession,
    switchSession,
    deleteSession,
    updateCurrentSession,
  } = useSession(sessionManager, setSessionManager);

  const defaultMessages: Message[] = useMemo(
    () => [
      {
        id: Math.random().toString(36).slice(2),
        role: "system",
        content: "你是一个有帮助的AI智能助手。",
      },
      {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content: "你好，我可以为你提供智能问答服务～",
      },
    ],
    [],
  );

  const sessionMessages = currentSession?.messages || defaultMessages;

  const {
    engineRef,
    engineReady,
    progressText,
    setProgressText,
    initError,
    retry,
  } = useEngine(engine, browserModel, downloadPaused);

  const [showRetryModal, setShowRetryModal] = useState(false);

  useEffect(() => {
    if (initError && engine === "browser") {
      setShowRetryModal(true);
    }
  }, [initError, engine]);

  const browserChat = useChat(
    engineRef,
    engineReady,
    browserModel,
    sessionMessages,
    updateCurrentSession,
    setProgressText,
    downloadPaused,
    setDownloadPaused,
  );

  const remoteChat = useRemoteChat(
    remoteApiConfig,
    sessionMessages,
    updateCurrentSession,
  );

  const { loading, canSend, handleSend, handleStop } =
    engine === "browser" ? browserChat : remoteChat;

  const suggestions = useMemo(
    () => [
      "介绍一下你自己",
      "你的能力边界是什么",
      "历史上的今天发生了什么",
      "生成一份周报提纲",
    ],
    [],
  );

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (browserModel === "qwen2.5-0.5b-instruct-q4f32_1-MLC") {
      setBrowserModel("Qwen2.5-0.5B-Instruct-q4f32_1-MLC");
    }
  }, [browserModel, setBrowserModel]);

  useEffect(() => {
    if (engine === "browser" && !engineReady) {
      setProgressText(
        "首次使用需要下载AI模型缓存（约234MB），这是一次性操作。后续访问将秒开！",
      );
    }
  }, [engine, engineReady]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [sessionMessages, loading]);

  const toggleBatchDeleteMode = useCallback(() => {
    setBatchDeleteMode((prev) => !prev);
    setSelectedSessions(new Set());
  }, []);

  const toggleSessionSelection = useCallback((id: string) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllSessions = useCallback(() => {
    setSelectedSessions(new Set(sessionManager.sessions.map((session) => session.id)));
  }, [sessionManager.sessions]);

  const deselectAllSessions = useCallback(() => {
    setSelectedSessions(new Set());
  }, []);

  const handleBatchDelete = useCallback(() => {
    if (selectedSessions.size === 0) {
      return;
    }

    const sessionsToKeep = sessionManager.sessions.filter(
      (session) => !selectedSessions.has(session.id),
    );

    if (sessionsToKeep.length === 0) {
      createNewSession();
    } else {
      const currentSessionDeleted = selectedSessions.has(
        sessionManager.currentSessionId,
      );

      setSessionManager({
        sessions: sessionsToKeep,
        currentSessionId: currentSessionDeleted
          ? sessionsToKeep[0].id
          : sessionManager.currentSessionId,
      });
    }

    setBatchDeleteMode(false);
    setSelectedSessions(new Set());
  }, [createNewSession, selectedSessions, sessionManager, setSessionManager]);

  const handlePauseDownload = useCallback(() => {
    setDownloadPaused(true);
    setProgressText("已暂停，发送消息时自动继续");
  }, [setProgressText]);

  const handleSendMessage = useCallback(() => {
    if (input.trim()) {
      handleSend(input);
      setInput("");
    }
  }, [handleSend, input]);

  useEffect(() => {
    const autoLockTime = 2 * 60 * 60 * 1000;
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        console.log("[自动锁定] 2小时无操作，自动锁定应用");
        onLock();
      }, autoLockTime);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((eventName) => {
      document.addEventListener(eventName, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach((eventName) => {
        document.removeEventListener(eventName, resetTimer);
      });
    };
  }, [onLock]);

  return (
    <div className={`app theme-${theme}`}>
      <ChatHeader
        progressText={progressText}
        engineReady={engineReady}
        browserModel={browserModel}
        downloadPaused={downloadPaused}
        engineMode={engine}
        remoteModel={remoteApiConfig.model}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onShowSettings={() => setShowSettings(true)}
        onNewSession={() => createNewSession(() => setShowSidebar(false))}
        onPauseDownload={handlePauseDownload}
        onLock={onLock}
      />

      {showSidebar && (
        <ChatSidebar
          sessions={sessionManager.sessions}
          currentSessionId={sessionId || sessionManager.currentSessionId}
          batchDeleteMode={batchDeleteMode}
          selectedSessions={selectedSessions}
          onClose={() => setShowSidebar(false)}
          onCreateNew={() => createNewSession(() => setShowSidebar(false))}
          onSwitchSession={(id) => switchSession(id, () => setShowSidebar(false))}
          onDeleteSession={deleteSession}
          onToggleBatchMode={toggleBatchDeleteMode}
          onToggleSelection={toggleSessionSelection}
          onSelectAll={selectAllSessions}
          onDeselectAll={deselectAllSessions}
          onBatchDelete={handleBatchDelete}
        />
      )}

      <main className="chat">
        {sessionMessages.filter((message: Message) => message.role === "user").length === 0 && (
          <SuggestionCards
            suggestions={suggestions}
            onSelect={(suggestion) => handleSend(suggestion)}
          />
        )}

        <ChatMessages
          messages={sessionMessages}
          loading={loading}
          listRef={listRef}
        />
      </main>

      <ChatComposer
        input={input}
        loading={loading}
        canSend={canSend && input.trim().length > 0}
        onInputChange={setInput}
        onSend={handleSendMessage}
        onStop={handleStop}
      />

      {showSettings && (
        <SettingsModal
          engine={engine}
          theme={theme}
          browserModel={browserModel}
          remoteApiConfig={remoteApiConfig}
          onClose={() => setShowSettings(false)}
          onEngineChange={setEngine}
          onThemeChange={setTheme}
          onModelChange={setBrowserModel}
          onRemoteApiConfigChange={setRemoteApiConfig}
        />
      )}

      {showRetryModal && initError && (
        <ConfirmModal
          title="⚠️ 浏览器本地模型加载失败"
          message={`${initError}\n\n━━━━━━━━━━━━━━━━━━\n\n🔄 点击「重试」：重新尝试加载本地模型\n🌐 点击「切换远程」：使用远程 API（推荐）`}
          confirmText="重试"
          cancelText="切换远程"
          onConfirm={() => {
            setShowRetryModal(false);
            retry();
          }}
          onCancel={() => {
            setShowRetryModal(false);
            setEngine("remote");
            console.log("[App] 用户选择切换到远程 API 模式");
          }}
        />
      )}
    </div>
  );
}

export default WorkspaceApp;
