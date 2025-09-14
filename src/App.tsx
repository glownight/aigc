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
import "./App.css";

export type Role = "user" | "assistant" | "system";
export type Message = { id: string; role: Role; content: string };
export type EngineMode = "remote" | "browser";

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
      currentSessionId: ""
    }
  );

  // 初始化默认会话
  useEffect(() => {
    if (sessionManager.sessions.length === 0) {
      const defaultSession: Session = {
        id: uid(),
        title: "新对话",
        messages: [
          { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
          { id: uid(), role: "assistant", content: "你好，我可以为你提供智能问答服务～" }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setSessionManager({
        sessions: [defaultSession],
        currentSessionId: defaultSession.id
      });
    }
  }, []);

  // 获取当前会话
  const currentSession = sessionManager.sessions.find(s => s.id === sessionManager.currentSessionId);
  
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
  const [stream, setStream] = useLocalStorage("aigc.stream", true);

  // 浏览器小模型（web-llm）配置（仅保留体积最小的选项，避免误选大模型导致初始化耗时）
  const [browserModel, setBrowserModel] = useLocalStorage(
    "aigc.browserModel",
    "Qwen2.5-0.5B-Instruct-q4f32_1-MLC"
  );
  // 模型来源：默认在线源 / 本地内置路径
  const [modelSource, setModelSource] = useLocalStorage<"default" | "local">(
    "aigc.modelSource",
    "default"
  );
  // 当选择“本地”时，配置模型根路径与 wasm 库路径（可放 public/models 下）
  const [localModelBase, setLocalModelBase] = useLocalStorage(
    "aigc.localModelBase",
    "/models/qwen2.5-0.5b-instruct-q4f32_1-MLC"
  );
  const [localModelLib, setLocalModelLib] = useLocalStorage(
    "aigc.localModelLib",
    "/models/qwen2.5-0.5b-instruct-q4f32_1-MLC/model.wasm"
  );

  const engineRef = useRef<any | null>(null);

  // 会话操作函数
  const createNewSession = () => {
    const newSession: Session = {
      id: uid(),
      title: "新对话",
      messages: [
        { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
        { id: uid(), role: "assistant", content: "你好，我可以为你提供智能问答服务～" }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessionManager(prev => ({
      sessions: [newSession, ...prev.sessions],
      currentSessionId: newSession.id
    }));
  };

  const switchSession = (sessionId: string) => {
    setSessionManager(prev => ({
      ...prev,
      currentSessionId: sessionId
    }));
  };

  const deleteSession = (sessionId: string) => {
    setSessionManager(prev => {
      const newSessions = prev.sessions.filter(s => s.id !== sessionId);
      let newCurrentId = prev.currentSessionId;
      
      // 如果删除的是当前会话，切换到第一个会话
      if (sessionId === prev.currentSessionId && newSessions.length > 0) {
        newCurrentId = newSessions[0].id;
      }
      
      return {
        sessions: newSessions,
        currentSessionId: newCurrentId
      };
    });
  };

  const updateCurrentSession = (messages: Message[]) => {
    if (!currentSession) return;
    
    // 自动生成会话标题（基于第一条用户消息）
    let newTitle = currentSession.title;
    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length === 1 && currentSession.title === "新对话") {
      const firstUserMessage = userMessages[0].content;
      // 取前20个字符作为标题，去掉换行符
      newTitle = firstUserMessage.replace(/\n/g, " ").slice(0, 20);
      if (firstUserMessage.length > 20) {
        newTitle += "...";
      }
    }
    
    setSessionManager(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => 
        s.id === currentSession.id 
          ? { ...s, messages, updatedAt: Date.now(), title: newTitle }
          : s
      )
    }));
  };
  const [engineReady, setEngineReady] = useState(false);
  const [progressText, setProgressText] = useState("");

  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Kimi风格：设置弹窗与建议卡片
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
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
  void [
    setEngine,
    setTheme,
    setStream,
    setModelSource,
    setLocalModelBase,
    setLocalModelLib,
    showSettings,
  ];

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
    if (engine === "remote") {
      // 远程API无需初始化
      engineRef.current = null;
      setEngineReady(true);
      setProgressText("云端 API 已就绪");
      return;
    } else if (engine !== "browser") {
      engineRef.current = null;
      setEngineReady(false);
      setProgressText("");
      return;
    }
    let cancelled = false;
    setEngineReady(false);
    setProgressText(
      modelSource === "local"
        ? "从本地内置模型源加载…（首次访问会拷贝到浏览器缓存）"
        : "准备加载本地模型…（首次会下载较大文件，请耐心等待，二次打开将使用缓存）"
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

        // 在使用“本地内置路径”时做一次前置校验，路径无效则自动回退到默认在线源并提示
        if (modelSource === "local") {
          const ok = await (async () => {
            try {
              const baseUrl = new URL(
                localModelBase,
                location.origin
              ).toString();
              const libUrl = new URL(localModelLib, location.origin).toString();
              // 简短可中止的 HEAD 探测，避免长时间卡住
              const ac = new AbortController();
              const timer = setTimeout(() => ac.abort(), 3000);
              const r = await fetch(libUrl, {
                method: "HEAD",
                signal: ac.signal,
              });
              clearTimeout(timer);
              // 200-299 视为可用
              return r.ok && !!baseUrl && !!libUrl;
            } catch {
              return false;
            }
          })();

          if (!ok) {
            if (!cancelled) {
              setProgressText(
                "检测到本地模型路径无效，已自动回退到默认在线源。"
              );
              setModelSource("default");
            }
            return;
          }
        }

        // 构建引擎配置（将进度回调与可选 appConfig 合并到第二个参数）
        const engineConfig: any = {
          initProgressCallback: (report: any) => {
            if (cancelled) return;
            const t = report?.text || JSON.stringify(report);
            setProgressText(t);
          },
          ...(modelSource === "local"
            ? {
                appConfig: {
                  model_list: [
                    {
                      model: localModelBase,
                      model_id: browserModel,
                      model_lib: localModelLib,
                    },
                  ],
                },
              }
            : {}),
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
  }, [engine, browserModel, modelSource, localModelBase, localModelLib]);

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

      if (engine === "remote") {
        // 调用后端代理（Vercel Serverless/Edge）
        const resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: sendMessages, stream: false }),
        });
        if (!resp.ok) throw new Error(`后端错误：${resp.status}`);
        const data = await resp.json();
        const content: string =
          data?.choices?.[0]?.message?.content || data?.content || "";
        const assistantMsg = { id: uid(), role: "assistant", content };
        updateCurrentSession([...newMessages, assistantMsg]);
      } else {
        if (!engineReady || !engineRef.current) {
          const waitingMsg = {
            id: uid(),
            role: "assistant",
            content: "本地模型初始化中，请稍候…",
          };
          updateCurrentSession([...newMessages, waitingMsg]);
          return;
        }
        const eng = engineRef.current;
        if (stream) {
          const assistantId = uid();
          let currentMessages = [...newMessages, { id: assistantId, role: "assistant", content: "" }];
          updateCurrentSession(currentMessages);
          
          const streamResp = await eng.chat.completions.create({
            messages: sendMessages,
            stream: true,
          });
          for await (const chunk of streamResp) {
            const delta: string = chunk?.choices?.[0]?.delta?.content || "";
            if (delta) {
              currentMessages = currentMessages.map((mm) =>
                mm.id === assistantId
                  ? { ...mm, content: mm.content + delta }
                  : mm
              );
              updateCurrentSession(currentMessages);
            }
          }
        } else {
          const out = await eng.chat.completions.create({
            messages: sendMessages,
          });
          const content: string = out?.choices?.[0]?.message?.content ?? "";
          const assistantMsg = { id: uid(), role: "assistant", content };
          updateCurrentSession([...newMessages, assistantMsg]);
        }
      }
    } catch (e: any) {
      const errorMsg = {
        id: uid(),
        role: "assistant",
        content: `请求出错：${e?.message || e}`,
      };
      updateCurrentSession([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    createNewSession();
  }

  return (
    <div className={`app theme-${theme}`}>
      <header className="header">
        <div className="topbar-left">
          <button className="btn ghost" onClick={() => setShowSidebar(!showSidebar)}>
            ☰
          </button>
        </div>
        <div className="topbar-right">
          <div className="status-mini">
            <span className="progress-text">{progressText}</span>
            <span className="ready-dot" data-ready={engineReady}></span>
            <span className="engine-indicator">
              {engine === "browser" ? "浏览器模型" : "云端API"}
            </span>
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
              <button className="btn ghost" onClick={createNewSession}>
                + 新建
              </button>
            </div>
            <div className="session-list">
              {sessionManager.sessions.map((session) => (
                <div
                  key={session.id}
                  className={`session-item ${
                    session.id === sessionManager.currentSessionId ? "active" : ""
                  }`}
                  onClick={() => {
                    switchSession(session.id);
                    setShowSidebar(false);
                  }}
                >
                  <div className="session-title">{session.title}</div>
                  <div className="session-time">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </div>
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
                  {m.content || (loading && m.role === "assistant" ? "…" : "")}
                </div>
              </div>
            ))}
          {loading && <div className="loading">AI 正在思考中…</div>}
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
                  <option value="browser">浏览器模型</option>
                  <option value="remote">云端API</option>
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

              {engine === "browser" && (
                <>
                  <div className="field">
                    <label>浏览器模型</label>
                    <select
                      value={browserModel}
                      onChange={(e) => setBrowserModel(e.target.value)}
                    >
                      <option value="Qwen2.5-0.5B-Instruct-q4f32_1-MLC">
                        Qwen2.5-0.5B (浏览器内运行)
                      </option>
                    </select>
                  </div>

                  <div className="field">
                    <label>模型来源</label>
                    <select
                      value={modelSource}
                      onChange={(e) => setModelSource(e.target.value as any)}
                    >
                      <option value="default">默认在线源</option>
                      <option value="local">本地内置路径</option>
                    </select>
                  </div>

                  {modelSource === "local" && (
                    <div className="row">
                      <div className="field">
                        <label>模型根路径</label>
                        <input
                          type="text"
                          value={localModelBase}
                          onChange={(e) => setLocalModelBase(e.target.value)}
                          placeholder="/models/qwen2.5-0.5b-instruct-q4f32_1-MLC"
                        />
                      </div>
                      <div className="field">
                        <label>WASM库路径</label>
                        <input
                          type="text"
                          value={localModelLib}
                          onChange={(e) => setLocalModelLib(e.target.value)}
                          placeholder="/models/qwen2.5-0.5b-instruct-q4f32_1-MLC/model.wasm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="field">
                    <label>
                      <input
                        type="checkbox"
                        checked={stream}
                        onChange={(e) => setStream(e.target.checked)}
                        style={{ marginRight: "8px" }}
                      />
                      启用流式输出
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
