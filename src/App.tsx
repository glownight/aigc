// 懒加载 web-llm 模块 - 只在真正需要时加载
let webllmModulePromise: Promise<any> | null = null;

const loadWebLLMModule = async () => {
  if (!webllmModulePromise) {
    console.log("开始按需加载 WebLLM 模块...");
    webllmModulePromise = import("@mlc-ai/web-llm");
  }
  return webllmModulePromise;
};
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
        const existingSession = sessionManager.sessions.find(
          (s) => s.id === sessionId
        );
        if (existingSession) {
          // 如果会话存在，切换到该会话
          if (sessionManager.currentSessionId !== sessionId) {
            setSessionManager((prev) => ({
              ...prev,
              currentSessionId: sessionId,
            }));
          }
        } else {
          // 如果会话不存在，跳转到第一个会话
          navigate(`/chat/${sessionManager.sessions[0].id}`, { replace: true });
        }
      } else {
        // 如果没有sessionId，跳转到当前会话或第一个会话
        const targetId =
          sessionManager.currentSessionId || sessionManager.sessions[0].id;
        navigate(`/chat/${targetId}`, { replace: true });
      }
    }
  }, [sessionId, sessionManager.sessions.length]);

  // 获取当前会话（优先使用URL参数）
  const currentSession = sessionManager.sessions.find(
    (s) => s.id === (sessionId || sessionManager.currentSessionId)
  );

  // 使用当前会话的消息，如果没有当前会话则使用默认消息
  const defaultMessages: Message[] = [
    { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
    {
      id: uid(),
      role: "assistant",
      content: "你好，我可以为你提供智能问答服务～",
    },
  ];
  const sessionMessages = currentSession?.messages || defaultMessages;

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
  const [downloadPaused, setDownloadPaused] = useState(false); // 下载暂停状态

  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // 防止重复请求
  const [engineBusy, setEngineBusy] = useState(false); // 引擎忙碌状态
  const [forceEngineReset] = useState(false); // 强制引擎重置

  // 流式处理优化配置
  const STREAM_CONFIG = {
    maxLength: 20000, // 最大回答长度
    duplicateThreshold: 0.8, // 重复检测阈值
    qualityCheckInterval: 10, // 每N个chunk检查一次质量
    minChunkLength: 1, // 最小有效chunk长度
  };
  const listRef = useRef<HTMLDivElement>(null);
  // Kimi风格：设置弹窗与建议卡片
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  // 批量删除功能状态
  const [batchDeleteMode, setBatchDeleteMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
    new Set()
  );
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
    // 添加首页加载优化提示
    if (engine === "browser" && !engineReady) {
      setProgressText(
        "首次使用需要下载AI模型缓存（约234MB），这是一次性操作。后续访问将秒开！"
      );
    }
  }, [engine, engineReady]);

  // 初始化/重建 web-llm 引擎
  useEffect(() => {
    if (engine !== "browser") {
      engineRef.current = null;
      setEngineReady(false);
      setProgressText("");
      setDownloadPaused(false);
      return;
    }

    // 如果下载被暂停，不启动初始化
    if (downloadPaused) {
      return;
    }

    let cancelled = false;
    setEngineReady(false);
    setProgressText(
      "首次下载会要约234MB数据，请耐心等待。后续使用将会非常快速！"
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
          setProgressText("模型已就绪（复用缓存实例）");
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

        // 确保 web-llm 模块在需要时才加载
        setProgressText("正在加载 AI 模块...");
        const mod = await loadWebLLMModule();
        const { CreateMLCEngine } = mod as any;

        // 构建引擎配置
        const engineConfig: any = {
          initProgressCallback: (report: any) => {
            if (cancelled) return;

            // 解析进度报告
            let displayText = report?.text || JSON.stringify(report);

            // 优化进度显示
            if (displayText.includes("Fetching param cached")) {
              const match = displayText.match(/(\d+)MB.*?(\d+)%.*?(\d+) sec/);
              if (match) {
                const [, mb, percent, seconds] = match;
                displayText = `首次下载模型数据: ${mb}MB (${percent}%) - 已用时${seconds}秒`;

                // 添加鼓励性提示
                if (parseInt(percent) > 50) {
                  displayText += " - 即将完成！";
                } else if (parseInt(percent) > 20) {
                  displayText += " - 进展顺利";
                }
              }
            } else if (displayText.includes("Loading model")) {
              displayText = "正在加载模型文件...";
            } else if (displayText.includes("Compiling")) {
              displayText = "正在编译模型，马上就好...";
            }

            setProgressText(displayText);
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
  }, [engine, browserModel, downloadPaused]); // 添加 downloadPaused 依赖

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading && !isProcessing && !engineBusy,
    [input, loading, isProcessing, engineBusy]
  );

  // 流式处理优化函数
  const detectDuplicate = (
    text: string,
    newChunk: string,
    threshold: number = STREAM_CONFIG.duplicateThreshold
  ): boolean => {
    if (!text || !newChunk || newChunk.length < 3) return false;

    // 检查最后50个字符中是否包含重复内容
    const recentText = text.slice(-50);
    const similarity = calculateSimilarity(recentText, newChunk);

    return similarity > threshold;
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  };

  const checkContentQuality = (
    content: string
  ): { isValid: boolean; reason?: string } => {
    // 检查内容质量
    if (!content || content.trim().length === 0) {
      return { isValid: false, reason: "内容为空" };
    }

    // 检查是否包含太多重复字符
    const repeatPattern = /(.)\1{5,}/g;
    if (repeatPattern.test(content)) {
      return { isValid: false, reason: "内容包含过多重复字符" };
    }

    // 检查是否包含异常字符
    const invalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
    if (invalidChars.test(content)) {
      return { isValid: false, reason: "内容包含异常字符" };
    }

    return { isValid: true };
  };

  const truncateAtSentence = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;

    // 在句子边界截断
    const truncated = text.substring(0, maxLength);
    const sentenceEnd = /[\u3002\uff01\uff1f\.\!\?]\s*/g;
    let lastSentenceEnd = -1;
    let match;

    while ((match = sentenceEnd.exec(truncated)) !== null) {
      lastSentenceEnd = match.index + match[0].length;
    }

    if (lastSentenceEnd > maxLength * 0.7) {
      return truncated.substring(0, lastSentenceEnd);
    }

    // 如果没有合适的句子边界，在词边界截断
    const wordEnd = /\s+/g;
    let lastWordEnd = -1;

    while ((match = wordEnd.exec(truncated)) !== null) {
      lastWordEnd = match.index;
    }

    if (lastWordEnd > maxLength * 0.8) {
      return truncated.substring(0, lastWordEnd) + "...";
    }

    return truncated + "...";
  };
  async function forceEngineReinit() {
    console.log("[forceEngineReinit] 开始强制重新初始化引擎...");

    try {
      // 清理全局单例
      if (__g.__mlc_singleton) {
        __g.__mlc_singleton.engine = null;
        __g.__mlc_singleton.model = "";
        __g.__mlc_singleton.creating = null;
      }

      // 清理当前引擎引用
      engineRef.current = null;
      setEngineReady(false);
      setProgressText("引擎重新初始化中...");

      // 等待一段时间让引擎完全清理
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 重新创建引擎
      // 确保 web-llm 模块已加载
      const mod = await loadWebLLMModule();
      const { CreateMLCEngine } = mod as any;

      const engineConfig: any = {
        initProgressCallback: (report: any) => {
          const t = report?.text || JSON.stringify(report);
          setProgressText(`重新初始化: ${t}`);
        },
      };

      const creating = CreateMLCEngine(browserModel, engineConfig);
      __g.__mlc_singleton.creating = creating;
      const eng = await creating;

      __g.__mlc_singleton.engine = eng;
      __g.__mlc_singleton.model = browserModel;
      __g.__mlc_singleton.creating = null;
      engineRef.current = eng;
      setEngineReady(true);
      setProgressText("引擎重新初始化完成，可以开始对话。");

      console.log("[forceEngineReinit] 引擎强制重新初始化完成");
    } catch (e) {
      console.error("[forceEngineReinit] 强制重新初始化失败:", e);
      setProgressText("引擎重新初始化失败，请刷新页面。");
      throw e;
    }
  }

  async function handleSend(
    overrideText?: string,
    retryCount?: number
  ): Promise<void> {
    const text = overrideText ?? input;
    const currentRetryCount = retryCount || 0;
    if (
      !(text.trim().length > 0) ||
      loading ||
      isProcessing ||
      engineBusy ||
      forceEngineReset
    )
      return;

    // 如果下载被暂停，现在恢复下载
    if (downloadPaused) {
      setDownloadPaused(false);
      setProgressText("正在恢复下载，请稍候...");
      // 触发重新初始化，传递文本给后续操作
      setTimeout(() => {
        handleSend(text, currentRetryCount);
      }, 1000);
      return;
    }

    console.log(
      `[handleSend] 开始发送请求... (第${currentRetryCount + 1}次尝试)`
    );

    const userMsg: Message = { id: uid(), role: "user", content: text.trim() };
    const newMessages = [...sessionMessages, userMsg];

    // 只有在第一次尝试时才更新会话和清空输入
    if (currentRetryCount === 0) {
      updateCurrentSession(newMessages);
      setInput("");
    }

    // 设置所有保护状态
    setIsProcessing(true);
    setLoading(true);
    setEngineBusy(true);

    // 创建新的AbortController
    const controller = new AbortController();
    setAbortController(controller);

    // 确保引擎就绪的最终检查
    if (!engineReady || !engineRef.current) {
      const waitingMsg: Message = {
        id: uid(),
        role: "assistant" as Role,
        content: "本地模型初始化中，请稍候…",
      };
      updateCurrentSession([...newMessages, waitingMsg]);

      // 清理状态
      setLoading(false);
      setAbortController(null);
      setTimeout(() => {
        setIsProcessing(false);
        setEngineBusy(false);
      }, 500);
      return;
    }

    try {
      const sendMessages = sessionMessages
        .concat(userMsg)
        .map(({ role, content }: { role: Role; content: string }) => ({
          role,
          content,
        }));

      const eng = engineRef.current;
      const assistantId = uid();
      let assistantMessage: Message | null = null;
      let hasStartedStreaming = false;
      let streamResp;

      console.log("[handleSend] 创建流式请求...");

      try {
        // 强制等待一小段时间，确保引擎状态稳定
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("[handleSend] 调用引擎API...");

        // 添加超时机制，防止引擎无限等待
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("引擎请求超时，可能需要重新初始化引擎"));
          }, 15000); // 15秒超时
        });

        const createPromise = eng.chat.completions.create({
          messages: sendMessages,
          stream: true,
        });

        // 使用Promise.race实现超时机制
        streamResp = await Promise.race([createPromise, timeoutPromise]);

        console.log(
          "[handleSend] 流式请求创建成功，返回对象:",
          typeof streamResp
        );
        console.log(
          "[handleSend] 检查流式响应是否为异步迭代器:",
          streamResp && typeof streamResp[Symbol.asyncIterator] === "function"
        );
      } catch (error) {
        console.error("[handleSend] 创建流式请求失败:", error);

        // 如果是超时错误且重试次数少于2次，自动重试
        if (
          error instanceof Error &&
          error.message.includes("超时") &&
          currentRetryCount < 2
        ) {
          console.log(
            `[handleSend] 检测到引擎超时，开始第${
              currentRetryCount + 2
            }次自动重试...`
          );

          // 显示重试提示
          const retryMsg: Message = {
            id: uid(),
            role: "assistant" as Role,
            content: "检测到引擎异常，正在自动重试...",
          };
          updateCurrentSession([...newMessages, retryMsg]);

          // 强制重新初始化引擎
          await forceEngineReinit();

          // 清理状态并重试
          setLoading(false);
          setAbortController(null);
          setIsProcessing(false);
          setEngineBusy(false);

          // 等待一段时间让引擎稳定，然后重试
          setTimeout(() => {
            handleSend(text, currentRetryCount + 1);
          }, 1000);
          return;
        }

        throw error;
      }

      try {
        console.log("[handleSend] 开始处理流式响应，准备迭代...");

        let chunkCount = 0;
        let totalLength = 0;
        let lastContent = "";
        let duplicateCount = 0;
        let isQualityChecked = true;

        for await (const chunk of streamResp) {
          chunkCount++;
          console.log(`[handleSend] 接收到第${chunkCount}个chunk:`, chunk);

          // 检查是否被中止
          if (controller.signal.aborted) {
            console.log("[handleSend] 检测到中止信号，退出处理");
            break;
          }

          const delta: string = chunk?.choices?.[0]?.delta?.content || "";
          console.log(`[handleSend] 解析得到delta内容: "${delta}"`);

          if (delta && delta.length >= STREAM_CONFIG.minChunkLength) {
            // 检查长度限制
            if (totalLength + delta.length > STREAM_CONFIG.maxLength) {
              console.log("[handleSend] 达到最大长度限制，停止接收");

              // 在适当位置截断
              const remainingLength = STREAM_CONFIG.maxLength - totalLength;
              if (remainingLength > 10) {
                const truncatedDelta = truncateAtSentence(
                  delta,
                  remainingLength
                );
                if (truncatedDelta.length > 5) {
                  // 更新最后一个有效内容
                  if (!hasStartedStreaming) {
                    assistantMessage = {
                      id: assistantId,
                      role: "assistant" as Role,
                      content: truncatedDelta,
                    };
                    const messagesWithAssistant = [
                      ...newMessages,
                      assistantMessage,
                    ];
                    updateCurrentSession(messagesWithAssistant);
                    hasStartedStreaming = true;
                  } else {
                    assistantMessage!.content += truncatedDelta;
                    const currentMessages = [...newMessages, assistantMessage!];
                    updateCurrentSession(currentMessages);
                  }
                }
              }
              break;
            }

            // 重复检测
            if (detectDuplicate(lastContent, delta)) {
              duplicateCount++;
              console.log(
                `[handleSend] 检测到重复内容 (${duplicateCount}次): "${delta}"`
              );

              // 如果连续3次重复，停止接收
              if (duplicateCount >= 3) {
                console.log("[handleSend] 连续重复内容过多，停止接收");
                break;
              }
              continue; // 跳过这个重复的chunk
            } else {
              duplicateCount = 0; // 重置重复计数
            }

            // 质量检查（每N个chunk检查一次）
            if (chunkCount % STREAM_CONFIG.qualityCheckInterval === 0) {
              const currentContent = (assistantMessage?.content || "") + delta;
              const qualityCheck = checkContentQuality(currentContent);

              if (!qualityCheck.isValid) {
                console.log(
                  `[handleSend] 内容质量检查失败: ${qualityCheck.reason}`
                );
                isQualityChecked = false;
                break;
              }
            }

            // 更新内容
            if (!hasStartedStreaming) {
              console.log("[handleSend] 开始接收内容，创建助手消息");
              assistantMessage = {
                id: assistantId,
                role: "assistant" as Role,
                content: delta,
              };
              const messagesWithAssistant = [...newMessages, assistantMessage];
              updateCurrentSession(messagesWithAssistant);
              hasStartedStreaming = true;
            } else {
              // 更新内容
              assistantMessage!.content += delta;
              const currentMessages = [...newMessages, assistantMessage!];
              updateCurrentSession(currentMessages);
            }

            totalLength += delta.length;
            lastContent = (assistantMessage?.content || "").slice(-100); // 保留最后100个字符用于重复检测
          }
        }

        // 最终质量检查
        if (assistantMessage && isQualityChecked) {
          const finalQualityCheck = checkContentQuality(
            assistantMessage.content
          );
          if (!finalQualityCheck.isValid) {
            console.log(
              `[handleSend] 最终质量检查失败: ${finalQualityCheck.reason}`
            );

            // 更新为错误消息
            assistantMessage.content = `回答内容质量检查失败（${finalQualityCheck.reason}），请重试。`;
            const currentMessages = [...newMessages, assistantMessage];
            updateCurrentSession(currentMessages);
          }
        }

        console.log(
          `[handleSend] 流式处理完成，总共处理了${chunkCount}个chunk，总长度${totalLength}字符`
        );
      } finally {
        // 确保流式响应被正确关闭
        try {
          if (streamResp && streamResp.return) {
            await streamResp.return();
            console.log("[handleSend] 流式响应已关闭");
          }
        } catch (e) {
          console.warn("[handleSend] 流式响应关闭时出错:", e);
        }

        // 强制等待引擎完全清理内部状态
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (e: any) {
      console.error("[handleSend] 请求处理出错:", e);

      // 检查是否被中止
      if (controller.signal.aborted) {
        console.log("[handleSend] 请求被中止，不显示错误消息");
        return;
      }

      // 显示错误消息
      const errorMsg: Message = {
        id: uid(),
        role: "assistant" as Role,
        content: `请求出错：${e?.message || e}`,
      };
      updateCurrentSession([...newMessages, errorMsg]);
    } finally {
      console.log("[handleSend] 清理状态...");

      // 立即清理UI状态
      setLoading(false);
      setAbortController(null);

      // 延迟重置处理状态，确保所有异步操作完成
      setTimeout(() => {
        setIsProcessing(false);
        console.log("[handleSend] 处理状态已重置");
      }, 300);

      // 延迟更长时间重置引擎忙碌状态，确保引擎完全就绪
      setTimeout(() => {
        setEngineBusy(false);
        console.log("[handleSend] 引擎状态已重置");
      }, 1000);
    }
  }

  // 停止AI回答的功能
  function handleStop() {
    console.log("[handleStop] 执行停止操作...");

    if (abortController) {
      console.log("[handleStop] 中止当前请求...");
      abortController.abort();
    }

    // 立即清理UI状态
    setLoading(false);
    setAbortController(null);

    // 延迟清理处理状态和空消息，给异步操作一些时间完成
    setTimeout(() => {
      console.log("[handleStop] 清理处理状态和空消息...");
      setIsProcessing(false);

      // 清理未完成的空AI消息
      if (currentSession) {
        const cleanedMessages = sessionMessages.filter(
          (m: Message) => !(m.role === "assistant" && m.content.trim() === "")
        );
        if (cleanedMessages.length !== sessionMessages.length) {
          console.log("[handleStop] 清理了空的AI消息");
          updateCurrentSession(cleanedMessages);
        }
      }
    }, 300);

    // 延迟更长时间重置引擎状态，确保引擎完全就绪
    setTimeout(() => {
      setEngineBusy(false);
      console.log("[handleStop] 引擎状态已重置，可以接受新请求");

      // 简化重置逻辑，不再自动强制重置
      console.log(
        "[handleStop] 停止操作完成，如果再次发送失败将自动重新初始化引擎"
      );
    }, 1000);
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
                engine === "browser" &&
                progressText.includes("首次") && (
                  <div className="loading-tips-compact">
                    <div className="quick-actions">
                      <button
                        className="btn-mini ghost"
                        onClick={() => {
                          setDownloadPaused(true);
                          setProgressText("已暂停，发送消息时自动继续");
                        }}
                        title="暂停下载"
                      >
                        暂停
                      </button>
                    </div>
                  </div>
                )}
            </div>

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
              <div
                className={`sidebar-actions ${
                  batchDeleteMode ? "batch-mode" : ""
                }`}
              >
                {!batchDeleteMode ? (
                  <>
                    <button
                      className="btn ghost"
                      onClick={toggleBatchDeleteMode}
                    >
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
                      onClick={
                        selectedSessions.size === sessionManager.sessions.length
                          ? deselectAllSessions
                          : selectAllSessions
                      }
                    >
                      {selectedSessions.size === sessionManager.sessions.length
                        ? "取消全选"
                        : "全选"}
                    </button>
                    <button
                      className="btn danger"
                      onClick={handleBatchDelete}
                      disabled={selectedSessions.size === 0}
                    >
                      删除({selectedSessions.size})
                    </button>
                    <button
                      className="btn ghost"
                      onClick={toggleBatchDeleteMode}
                    >
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
                    session.id ===
                    (sessionId || sessionManager.currentSessionId)
                      ? "active"
                      : ""
                  } ${batchDeleteMode ? "batch-mode" : ""}`}
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
        {sessionMessages.filter((m: Message) => m.role === "user").length ===
          0 && (
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
            .filter((m: Message) => m.role !== "system")
            .map((m: Message) => (
              <div key={m.id} className={`msg ${m.role}`}>
                <div className="role">{m.role === "user" ? "我" : "AI"}</div>
                <div className="bubble">
                  {m.content ? (
                    <MessageContent
                      content={m.content}
                      role={m.role as "user" | "assistant"}
                    />
                  ) : loading && m.role === "assistant" ? (
                    <div className="loading-indicator">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  ) : (
                    ""
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
              if (loading) {
                handleStop();
              } else {
                handleSend();
              }
            }
          }}
        />
        <div className="composer-actions">
          {loading ? (
            <button className="btn danger" onClick={handleStop}>
              停止
            </button>
          ) : (
            <button disabled={!canSend} onClick={() => handleSend()}>
              发送
            </button>
          )}
        </div>
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
