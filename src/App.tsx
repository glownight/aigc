// 预加载 web-llm 模块，加快初始化（在页面 JS 加载后立即开始请求模块资源）
const webllmModulePromise = import("@mlc-ai/web-llm");
// 在全局保存一个引擎单例，避免在 HMR/路由切换/二次进入页面时重复初始化
const __g: any = globalThis as any;
if (!__g.__mlc_singleton) {
  __g.__mlc_singleton = {
    engine: null as any,
    model: "",
    creating: null as Promise<any> | null,
  };
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MessageContent from "./MessageContent";
import "./App.css";

export type Role = "user" | "assistant" | "system";
export type Message = { id: string; role: Role; content: string };
export type EngineMode = "browser";

// 会话相关类型
export type Session = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

export type SessionManager = {
  sessions: Session[];
  currentSessionId: string;
};

const uid = () => Math.random().toString(36).slice(2);

function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(val));
  }, [key, val]);
  return [val, setVal] as const;
}

function App() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([
    { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
    {
      id: uid(),
      role: "assistant",
      content: "你好，我可以为你提供智能问答服务～",
    },
  ]);
  const [input, setInput] = useState("");

  // 会话管理
  const [sessionManager, setSessionManager] = useLocalStorage<SessionManager>(
    "aigc.sessions",
    {
      sessions: [],
      currentSessionId: "",
    }
  );

  // 初始化默认会话并处理URL路由
  useEffect(() => {
    if (sessionManager.sessions.length === 0) {
      const defaultSession: Session = {
        id: uid(),
        title: "新对话",
        messages: [
          { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
          {
            id: uid(),
            role: "assistant",
            content: "你好，我可以为你提供智能问答服务～",
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessionManager({
        sessions: [defaultSession],
        currentSessionId: defaultSession.id,
      });
      // 如果URL没有sessionId，跳转到默认会话
      if (!sessionId) {
        navigate(`/chat/${defaultSession.id}`, { replace: true });
      }
    } else {
      // 处理URL中的sessionId
      if (sessionId) {
        const existingSession = sessionManager.sessions.find(s => s.id === sessionId);
        if (existingSession) {
          // 如果会话存在，切换到该会话
          if (sessionManager.currentSessionId !== sessionId) {
            setSessionManager(prev => ({
              ...prev,
              currentSessionId: sessionId
            }));
          }
        } else {
          // 如果会话不存在，跳转到第一个会话
          navigate(`/chat/${sessionManager.sessions[0].id}`, { replace: true });
        }
      } else {
        // 如果没有sessionId，跳转到当前会话或第一个会话
        const targetId = sessionManager.currentSessionId || sessionManager.sessions[0].id;
        navigate(`/chat/${targetId}`, { replace: true });
      }
    }
  }, [sessionId, sessionManager.sessions.length]);

  // 获取当前会话（优先使用URL参数）
  const currentSession = sessionManager.sessions.find(
    (s) => s.id === (sessionId || sessionManager.currentSessionId)
  );

  // 使用当前会话的消息，如果没有当前会话则使用默认消息
  const sessionMessages = currentSession?.messages || messages;

  // 强制仅使用"浏览器小模型"
  const [engine, setEngine] = useLocalStorage<EngineMode>(
    "aigc.engine",
    "browser"
  );

  // 主题（采用 iPhone 15 配色：blue/pink/green/yellow/black）
  const [theme, setTheme] = useLocalStorage<
    "blue" | "pink" | "green" | "yellow" | "black"
  >("aigc.theme", "black");

  // 远程 API 配置（不再使用，仅保留类型占位，避免变更多处逻辑）
  // const [apiBase] = useLocalStorage('aigc.apiBase', 'https://api.openai.com')
  // const [apiKey] = useLocalStorage('aigc.apiKey', '')
  // const [model] = useLocalStorage('aigc.model', 'gpt-3.5-turbo')
  // 浏览器小模型（web-llm）配置
  const [browserModel, setBrowserModel] = useLocalStorage(
    "aigc.browserModel",
    "Qwen2.5-0.5B-Instruct-q4f32_1-MLC"
  );

  const engineRef = useRef<any | null>(null);

  // 会话操作函数
  const createNewSession = () => {
    const newSession: Session = {
      id: uid(),
      title: "新对话",
      messages: [
        { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
        {
          id: uid(),
          role: "assistant",
          content: "你好，我可以为你提供智能问答服务～",
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessionManager((prev) => ({
      sessions: [newSession, ...prev.sessions],
      currentSessionId: newSession.id,
    }));
    // 关闭侧边栏
    setShowSidebar(false);
    // 跳转到新会话的URL
    navigate(`/chat/${newSession.id}`);
  };

  const switchSession = (sessionId: string) => {
    setSessionManager((prev) => ({
      ...prev,
      currentSessionId: sessionId,
    }));
    // 关闭侧边栏
    setShowSidebar(false);
    // 跳转到指定会话的URL
    navigate(`/chat/${sessionId}`);
  };

  const deleteSession = (sessionId: string) => {
    setSessionManager((prev) => {
      const newSessions = prev.sessions.filter((s) => s.id !== sessionId);
      let newCurrentId = prev.currentSessionId;

      // 如果删除的是当前会话，切换到第一个会话
      if (sessionId === prev.currentSessionId && newSessions.length > 0) {
        newCurrentId = newSessions[0].id;
        // 跳转到新的当前会话
        navigate(`/chat/${newCurrentId}`);
      }

      return {
        sessions: newSessions,
        currentSessionId: newCurrentId,
      };
    });
  };

  const updateCurrentSession = (messages: Message[]) => {
    if (!currentSession) return;

    // 自动生成会话标题（基于第一条用户消息）
    let newTitle = currentSession.title;
    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length === 1 && currentSession.title === "新对话") {
      const firstUserMessage = userMessages[0].content;
      // 取前20个字符作为标题，去掉换行符
      newTitle = firstUserMessage.replace(/\n/g, " ").slice(0, 20);
      if (firstUserMessage.length > 20) {
        newTitle += "...";
      }
    }

    setSessionManager((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === currentSession.id
          ? { ...s, messages, updatedAt: Date.now(), title: newTitle }
          : s
      ),
    }));
  };
  const [engineReady, setEngineReady] = useState(false);
  const [progressText, setProgressText] = useState("");

  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Kimi风格：设置弹窗与建议卡片
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  // 批量删除功能状态
  const [batchDeleteMode, setBatchDeleteMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const suggestions = useMemo(
    () => [
      "介绍一下你自己",
      "帮我总结这段文字",
      "把这个段落润色得更专业",
      "生成一份周报提纲",
    ],
    []
  );

  // 读取这些变量以规避 TS noUnusedLocals（它们在 JSX/事件中会被使用）
  void [setEngine, setTheme, showSettings];

  // 始终滚到底部
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [sessionMessages, loading]);

  // 迁移兼容：老版本小写模型 ID 更正为官方大小写
  useEffect(() => {
    if (browserModel === "qwen2.5-0.5b-instruct-q4f32_1-MLC") {
      setBrowserModel("Qwen2.5-0.5B-Instruct-q4f32_1-MLC");
    }
  }, [browserModel, setBrowserModel]);

  // 启动时强制本地小模型（覆盖旧的 localStorage 值）并立即初始化
  useEffect(() => {
    // 不再强制为 browser，允许 remote
  }, []);

  // 初始化/重建 web-llm 引擎
  useEffect(() => {
    if (engine !== "browser") {
      engineRef.current = null;
      setEngineReady(false);
      setProgressText("");
      return;
    }
    let cancelled = false;
    setEngineReady(false);
    setProgressText(
      "准备加载本地模型…（首次会下载较大文件，请耐心等待，二次打开将使用缓存）"
    );
    (async () => {
      try {
        // 若已有单例且模型一致，直接复用，几乎无等待
        if (
          __g.__mlc_singleton.engine &&
          __g.__mlc_singleton.model === browserModel
        ) {
          engineRef.current = __g.__mlc_singleton.engine;
          setEngineReady(true);
          setProgressText("模型已就绪（复用缓存实例）。");
          return;
        }
        // 如果正在创建，等待同一个 Promise，避免并行创建
        if (__g.__mlc_singleton.creating) {
          setProgressText("模型正在准备（共享创建过程）…");
          const eng = await __g.__mlc_singleton.creating;
          if (!cancelled) {
            engineRef.current = eng;
            setEngineReady(true);
            setProgressText("模型已就绪。");
          }
          return;
        }

        const mod = await webllmModulePromise;
        const { CreateMLCEngine } = mod as any;

        // 构建引擎配置
        const engineConfig: any = {
          initProgressCallback: (report: any) => {
            if (cancelled) return;
            const t = report?.text || JSON.stringify(report);
            setProgressText(t);
          },
        };

        const creating = CreateMLCEngine(browserModel, engineConfig);
        __g.__mlc_singleton.creating = creating;
        const eng = await creating;
        if (!cancelled) {
          __g.__mlc_singleton.engine = eng;
          __g.__mlc_singleton.model = browserModel;
          __g.__mlc_singleton.creating = null;
          engineRef.current = eng;
          setEngineReady(true);
          setProgressText("模型已就绪，可以开始对话。");
        }
      } catch (e: any) {
        __g.__mlc_singleton.creating = null;
        if (!cancelled) {
          setProgressText(`初始化失败：${e?.message || e}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [engine, browserModel]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  async function handleSend(overrideText?: string) {
    const text = overrideText ?? input;
    if (!(text.trim().length > 0) || loading) return;
    const userMsg: Message = { id: uid(), role: "user", content: text.trim() };
    const newMessages = [...sessionMessages, userMsg];
    updateCurrentSession(newMessages);
    setInput("");

    try {
      setLoading(true);
      const sendMessages = sessionMessages
        .concat(userMsg)
        .map(({ role, content }) => ({ role, content }));

      if (!engineReady || !engineRef.current) {
        const waitingMsg: Message = {
          id: uid(),
          role: "assistant" as Role,
          content: "本地模型初始化中，请稍候…",
        };
        updateCurrentSession([...newMessages, waitingMsg]);
        return;
      }
      const eng = engineRef.current;
      const assistantId = uid();
      let currentMessages: Message[] = [
        ...newMessages,
        { id: assistantId, role: "assistant" as Role, content: "" },
      ];
      updateCurrentSession(currentMessages);

      const streamResp = await eng.chat.completions.create({
        messages: sendMessages,
        stream: true,
      });
      for await (const chunk of streamResp) {
        const delta: string = chunk?.choices?.[0]?.delta?.content || "";
        if (delta) {
          currentMessages = currentMessages.map((mm) =>
            mm.id === assistantId ? { ...mm, content: mm.content + delta } : mm
          );
          updateCurrentSession(currentMessages);
        }
      }
    } catch (e: any) {
      const errorMsg: Message = {
        id: uid(),
        role: "assistant" as Role,
        content: `请求出错：${e?.message || e}`,
      };
      updateCurrentSession([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  // 批量删除相关函数
  function toggleBatchDeleteMode() {
    setBatchDeleteMode(!batchDeleteMode);
    setSelectedSessions(new Set()); // 清空选中列表
  }

  function toggleSessionSelection(sessionId: string) {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  }

  function selectAllSessions() {
    const allSessionIds = new Set(sessionManager.sessions.map(s => s.id));
    setSelectedSessions(allSessionIds);
  }

  function deselectAllSessions() {
    setSelectedSessions(new Set());
  }

  function handleBatchDelete() {
    if (selectedSessions.size === 0) return;
    
    const sessionsToKeep = sessionManager.sessions.filter(
      s => !selectedSessions.has(s.id)
    );
    
    // 如果删除后没有会话了，创建一个新的
    if (sessionsToKeep.length === 0) {
      const newSession: Session = {
        id: uid(),
        title: "新对话",
        messages: [
          { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
          {
            id: uid(),
            role: "assistant",
            content: "你好，我可以为你提供智能问答服务～",
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessionManager({
        sessions: [newSession],
        currentSessionId: newSession.id,
      });
      navigate(`/chat/${newSession.id}`);
    } else {
      // 如果当前会话被删除，切换到第一个剩余的会话
      const currentSessionDeleted = selectedSessions.has(sessionManager.currentSessionId);
      const newCurrentId = currentSessionDeleted ? sessionsToKeep[0].id : sessionManager.currentSessionId;
      
      setSessionManager({
        sessions: sessionsToKeep,
        currentSessionId: newCurrentId,
      });
      
      if (currentSessionDeleted) {
        navigate(`/chat/${newCurrentId}`);
      }
    }
    
    // 重置批量删除模式
    setBatchDeleteMode(false);
    setSelectedSessions(new Set());
  }

  function handleClear() {
    createNewSession();
  }

  return (
    <div className={`app theme-${theme}`}>
      <header className="header">
        <div className="topbar-left">
          <button
            className="btn ghost"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            ☰
          </button>
        </div>
        <div className="topbar-right">
          <div className="status-mini">
            <span className="progress-text">{progressText}</span>
            <span className="ready-dot" data-ready={engineReady}></span>
            <span className="engine-indicator">{browserModel}</span>
          </div>
          <button className="btn ghost" onClick={() => setShowSettings(true)}>
            设置
          </button>
          <button className="btn danger" onClick={handleClear}>
            新会话
          </button>
        </div>
      </header>

      {/* 会话列表侧边栏 */}
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)}>
          <div className="sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <h3>历史会话</h3>
              <div className="sidebar-actions">
                {!batchDeleteMode ? (
                  <>
                    <button className="btn ghost" onClick={toggleBatchDeleteMode}>
                      批量删除
                    </button>
                    <button className="btn ghost" onClick={createNewSession}>
                      + 新建
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn ghost" 
                      onClick={selectedSessions.size === sessionManager.sessions.length ? deselectAllSessions : selectAllSessions}
                    >
                      {selectedSessions.size === sessionManager.sessions.length ? '取消全选' : '全选'}
                    </button>
                    <button 
                      className="btn danger" 
                      onClick={handleBatchDelete}
                      disabled={selectedSessions.size === 0}
                    >
                      删除({selectedSessions.size})
                    </button>
                    <button className="btn ghost" onClick={toggleBatchDeleteMode}>
                      取消
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="session-list">
              {sessionManager.sessions.map((session) => (
                <div
                  key={session.id}
                  className={`session-item ${
                    session.id === (sessionId || sessionManager.currentSessionId)
                      ? "active"
                      : ""
                  } ${
                    batchDeleteMode ? "batch-mode" : ""
                  }`}
                  onClick={() => {
                    if (batchDeleteMode) {
                      toggleSessionSelection(session.id);
                    } else {
                      switchSession(session.id);
                    }
                  }}
                >
                  {batchDeleteMode && (
                    <div className="session-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSessions.has(session.id)}
                        onChange={() => toggleSessionSelection(session.id)}
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
                        if (sessionManager.sessions.length > 1) {
                          deleteSession(session.id);
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
      )}

      <main className="chat">
        {sessionMessages.filter((m) => m.role === "user").length === 0 && (
          <div className="suggestions">
            {suggestions.map((s) => (
              <button
                key={s}
                className="suggestion-card"
                onClick={() => handleSend(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="list" ref={listRef}>
          {sessionMessages
            .filter((m) => m.role !== "system")
            .map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                <div className="role">{m.role === "user" ? "我" : "AI"}</div>
                <div className="bubble">
                  {m.content ? (
                    <MessageContent content={m.content} role={m.role as "user" | "assistant"} />
                  ) : (
                    loading && m.role === "assistant" ? (
                      <div className="loading-indicator">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    ) : ""
                  )}
                </div>
              </div>
            ))}

        </div>
      </main>

      <footer className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="请输入你的问题，回车发送，Shift+回车换行"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button disabled={!canSend} onClick={() => handleSend()}>
          {loading ? "发送中…" : "发送"}
        </button>
      </footer>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">设置</h2>
              <button
                className="btn ghost"
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>
            <div className="settings">
              <div className="field">
                <label>引擎模式</label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value as EngineMode)}
                >
                  <option value="browser">AI大模型</option>
                </select>
              </div>
              {/* 
              <div className="field">
                <label>主题</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                >
                  <option value="blue">蓝色</option>
                  <option value="pink">粉色</option>
                  <option value="green">绿色</option>
                  <option value="yellow">黄色</option>
                  <option value="black">黑色</option>
                </select>
              </div> */}

              <div className="field">
                <label>AI大模型</label>
                <select
                  value={browserModel}
                  onChange={(e) => setBrowserModel(e.target.value)}
                >
                  <option value="Qwen2.5-0.5B-Instruct-q4f32_1-MLC">
                    Qwen2.5-0.5B
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
