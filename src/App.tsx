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

  // 强制仅使用“浏览器小模型”
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
  const [engineReady, setEngineReady] = useState(false);
  const [progressText, setProgressText] = useState("");

  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Kimi风格：设置弹窗与建议卡片
  const [showSettings, setShowSettings] = useState(false);
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
  }, [messages, loading]);

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
    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      setLoading(true);
      const sendMessages = messages
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
        setMessages((m) => [...m, { id: uid(), role: "assistant", content }]);
      } else {
        if (!engineReady || !engineRef.current) {
          setMessages((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              content: "本地模型初始化中，请稍候…",
            },
          ]);
          return;
        }
        const eng = engineRef.current;
        if (stream) {
          const assistantId = uid();
          setMessages((m) => [
            ...m,
            { id: assistantId, role: "assistant", content: "" },
          ]);
          const streamResp = await eng.chat.completions.create({
            messages: sendMessages,
            stream: true,
          });
          for await (const chunk of streamResp) {
            const delta: string = chunk?.choices?.[0]?.delta?.content || "";
            if (delta) {
              setMessages((prev) =>
                prev.map((mm) =>
                  mm.id === assistantId
                    ? { ...mm, content: mm.content + delta }
                    : mm
                )
              );
            }
          }
        } else {
          const out = await eng.chat.completions.create({
            messages: sendMessages,
          });
          const content: string = out?.choices?.[0]?.message?.content ?? "";
          setMessages((m) => [...m, { id: uid(), role: "assistant", content }]);
        }
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content: `请求出错：${e?.message || e}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setMessages([
      { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
    ]);
  }

  return (
    <div className={`app theme-${theme}`}>
      <header className="header">
        <div className="topbar-right">
          <div className="status-mini">
            <span className="progress-text">{progressText}</span>
            <span className="ready-dot" data-ready={engineReady}></span>
            <span className="engine-indicator">
              {engine === "browser" ? "本地小模型" : "云端API"}
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

      <main className="chat">
        {messages.filter((m) => m.role === "user").length === 0 && (
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
          {messages
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
    </div>
  );
}

export default App;
