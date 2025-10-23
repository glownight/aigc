/**
 * 主应用组件 - 重构后的版本
 * 采用模块化架构，提高代码可维护性和可读性
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

// Config
import { getRemoteApiConfig, getDefaultEngine } from "./config/env";

// Hooks
import { useSessionStorage } from "./hooks/useSessionStorage";
import { useSession } from "./hooks/useSession";
import { useEngine } from "./hooks/useEngine";
import { useChat } from "./hooks/useChat";
import { useRemoteChat } from "./hooks/useRemoteChat";

// Components
import ChatHeader from "./components/ChatHeader";
import ChatSidebar from "./components/ChatSidebar";
import SuggestionCards from "./components/SuggestionCards";
import ChatMessages from "./components/ChatMessages";
import ChatComposer from "./components/ChatComposer";
import SettingsModal from "./components/SettingsModal";
import LockScreen from "./components/LockScreen";
import ConfirmModal from "./components/ConfirmModal";

// Types
import type {
  EngineMode,
  SessionManager,
  Theme,
  Message,
  RemoteApiConfig,
} from "./types";

function App() {
  // 🔍 打印配置信息（在组件挂载后）
  useEffect(() => {
    console.log("=".repeat(60));
    console.log("[App] 📱 应用已加载");
    console.log("[App] 🔧 当前路径:", window.location.pathname);
    console.log("[App] 💾 存储模式: sessionStorage（会话级存储）");
    console.log("[App] ⚠️  关闭标签页后所有数据将自动清除");
    console.log("=".repeat(60));

    // 检查浏览器兼容性
    const checkBrowserCompatibility = () => {
      const isWebGPUSupported = "gpu" in navigator;
      console.log("[App] 🔍 浏览器兼容性检查:");
      console.log("  • WebGPU 支持:", isWebGPUSupported ? "✅ 是" : "❌ 否");

      if (!isWebGPUSupported) {
        console.warn("[App] ⚠️  浏览器不支持 WebGPU，无法使用本地模型");
        console.warn(
          "[App] 💡 建议：使用 Chrome/Edge 119+ 版本，或使用远程 API 模式"
        );
      }

      console.log(
        "  • User Agent:",
        navigator.userAgent.substring(0, 50) + "..."
      );
    };
    checkBrowserCompatibility();

    // 清理旧的 localStorage 数据（迁移到 sessionStorage 后）
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
        cleanedCount++;
      }
    });
    if (cleanedCount > 0) {
      console.log(`[App] 🧹 已清理 ${cleanedCount} 个旧的 localStorage 数据`);
    }
  }, []);

  // 锁屏状态 - 检查是否已解锁
  const [isLocked, setIsLocked] = useState(() => {
    const unlockToken = sessionStorage.getItem("unlockToken");
    return !unlockToken; // 如果没有解锁令牌，则处于锁定状态
  });

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

  // 会话级存储配置（关闭标签页后自动清除）
  const [sessionManager, setSessionManager] = useSessionStorage<SessionManager>(
    "aigc.sessions",
    {
      sessions: [],
      currentSessionId: "",
    }
  );

  // 引擎模式：默认使用 remote，允许用户自由切换
  const defaultEngineMode = getDefaultEngine();

  // 允许用户选择引擎模式，使用会话存储
  const [engine, setEngine] = useSessionStorage<EngineMode>(
    "aigc.engine",
    defaultEngineMode
  );

  const [theme, setTheme] = useSessionStorage<Theme>("aigc.theme", "black");

  const [browserModel, setBrowserModel] = useSessionStorage(
    "aigc.browserModel",
    "Qwen2.5-0.5B-Instruct-q4f32_1-MLC"
  );

  const [remoteApiConfig, setRemoteApiConfig] =
    useSessionStorage<RemoteApiConfig>(
      "aigc.remoteApiConfig",
      getRemoteApiConfig() // 从环境变量读取配置
    );

  // 🔧 强制更新 API 配置：如果环境变量有配置，覆盖 sessionStorage
  useEffect(() => {
    const envConfig = getRemoteApiConfig();
    if (envConfig.apiKey && envConfig.apiKey !== remoteApiConfig.apiKey) {
      console.log("[App] 🔄 检测到环境变量配置，更新 API 配置");
      setRemoteApiConfig(envConfig);
    }
  }, []); // 只在组件挂载时执行一次

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
  const {
    engineRef,
    engineReady,
    progressText,
    setProgressText,
    initError,
    retry,
  } = useEngine(engine, browserModel, downloadPaused);

  // 下载失败确认弹窗
  const [showRetryModal, setShowRetryModal] = useState(false);

  // 当有初始化错误时显示弹窗
  useEffect(() => {
    if (initError && engine === "browser") {
      setShowRetryModal(true);
    }
  }, [initError, engine]);

  // 聊天逻辑 - 根据引擎模式选择
  const browserChat = useChat(
    engineRef,
    engineReady,
    browserModel,
    sessionMessages,
    updateCurrentSession,
    setProgressText,
    downloadPaused,
    setDownloadPaused
  );

  const remoteChat = useRemoteChat(
    remoteApiConfig,
    sessionMessages,
    updateCurrentSession
  );

  // 根据引擎模式选择对应的聊天逻辑
  const { loading, canSend, handleSend, handleStop } =
    engine === "browser" ? browserChat : remoteChat;

  // 建议卡片
  const suggestions = useMemo(
    () => [
      "介绍一下你自己",
      "你的能力边界是什么",
      "历史上的今天发生了什么",
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

  // 批量删除相关函数 - 使用 useCallback 优化
  const toggleBatchDeleteMode = useCallback(() => {
    setBatchDeleteMode((prev) => !prev);
    setSelectedSessions(new Set());
  }, []);

  const toggleSessionSelection = useCallback((id: string) => {
    setSelectedSessions((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const selectAllSessions = useCallback(() => {
    const allSessionIds = new Set(sessionManager.sessions.map((s) => s.id));
    setSelectedSessions(allSessionIds);
  }, [sessionManager.sessions]);

  const deselectAllSessions = useCallback(() => {
    setSelectedSessions(new Set());
  }, []);

  const handleBatchDelete = useCallback(() => {
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
  }, [selectedSessions, sessionManager, createNewSession, setSessionManager]);

  const handlePauseDownload = useCallback(() => {
    setDownloadPaused(true);
    setProgressText("已暂停，发送消息时自动继续");
  }, [setProgressText]);

  // 解锁处理
  const handleUnlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  // 上锁处理
  const handleLock = useCallback(() => {
    // 清除解锁令牌
    sessionStorage.removeItem("unlockToken");
    // 设置锁定状态
    setIsLocked(true);
  }, []);

  // 发送消息处理
  const handleSendMessage = useCallback(() => {
    if (input.trim()) {
      handleSend(input);
      setInput("");
    }
  }, [input, handleSend]);

  // 自动锁定功能：2小时无操作自动上锁
  useEffect(() => {
    if (isLocked) return; // 如果已锁定，不需要监听

    const AUTO_LOCK_TIME = 2 * 60 * 60 * 1000; // 2小时（毫秒）
    let timeoutId: ReturnType<typeof setTimeout>;

    // 重置计时器
    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        console.log("[自动锁定] 2小时无操作，自动锁定应用");
        handleLock();
      }, AUTO_LOCK_TIME);
    };

    // 用户交互事件列表
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // 监听所有交互事件
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // 初始化计时器
    resetTimer();

    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [isLocked]);

  // 如果处于锁定状态，只显示锁屏
  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className={`app theme-${theme}`}>
      {/* 头部导航 */}
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
        onLock={handleLock}
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
        onSend={handleSendMessage}
        onStop={handleStop}
      />

      {/* 设置弹窗 */}
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

      {/* 下载失败确认弹窗 */}
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
            setEngine("remote"); // 切换到远程模式
            console.log("[App] 用户选择切换到远程 API 模式");
          }}
        />
      )}
    </div>
  );
}

export default App;
