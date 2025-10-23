/**
 * useChat Hook - 管理聊天逻辑
 */

import { useState, useMemo } from "react";
import type { Message, Role, StreamConfig } from "../types";
import { uid } from "../utils/uid";
import { detectDuplicate } from "../utils/similarity";
import { checkContentQuality, truncateAtSentence } from "../utils/textQuality";
import { loadWebLLMModule, getEngineSingleton } from "../utils/webllm";

// 流式处理优化配置
const STREAM_CONFIG: StreamConfig = {
    maxLength: 20000,
    duplicateThreshold: 0.8,
    qualityCheckInterval: 10,
    minChunkLength: 1,
};

export function useChat(
    engineRef: React.MutableRefObject<any>,
    engineReady: boolean,
    browserModel: string,
    sessionMessages: Message[],
    updateCurrentSession: (messages: Message[]) => void,
    setProgressText: (text: string) => void,
    downloadPaused: boolean,
    setDownloadPaused: (paused: boolean) => void
) {
    const [loading, setLoading] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [engineBusy, setEngineBusy] = useState(false);

    const canSend = useMemo(
        () => !loading && !isProcessing && !engineBusy,
        [loading, isProcessing, engineBusy]
    );

    // 强制引擎重新初始化
    async function forceEngineReinit() {
        console.log("[forceEngineReinit] 开始强制重新初始化引擎...");

        try {
            const singleton = getEngineSingleton();
            singleton.engine = null;
            singleton.model = "";
            singleton.creating = null;

            engineRef.current = null;
            setProgressText("引擎重新初始化中...");

            await new Promise((resolve) => setTimeout(resolve, 1000));

            const mod = await loadWebLLMModule();
            const { CreateMLCEngine } = mod as any;

            const engineConfig: any = {
                initProgressCallback: (report: any) => {
                    const t = report?.text || JSON.stringify(report);
                    setProgressText(`重新初始化: ${t}`);
                },
            };

            const creating = CreateMLCEngine(browserModel, engineConfig);
            singleton.creating = creating;
            const eng = await creating;

            singleton.engine = eng;
            singleton.model = browserModel;
            singleton.creating = null;
            engineRef.current = eng;
            setProgressText("引擎重新初始化完成，可以开始对话。");

            console.log("[forceEngineReinit] 引擎强制重新初始化完成");
        } catch (e) {
            console.error("[forceEngineReinit] 强制重新初始化失败:", e);
            setProgressText("引擎重新初始化失败，请刷新页面。");
            throw e;
        }
    }

    // 发送消息
    async function handleSend(
        text: string,
        retryCount: number = 0
    ): Promise<void> {
        if (
            !(text.trim().length > 0) ||
            loading ||
            isProcessing ||
            engineBusy
        )
            return;

        // 如果下载被暂停，现在恢复下载
        if (downloadPaused) {
            setDownloadPaused(false);
            setProgressText("正在恢复下载，请稍候...");
            setTimeout(() => {
                handleSend(text, retryCount);
            }, 1000);
            return;
        }

        console.log(
            `[handleSend] 开始发送请求... (第${retryCount + 1}次尝试)`
        );

        const userMsg: Message = { id: uid(), role: "user", content: text.trim() };
        const assistantId = uid();

        // 立即创建用户消息和空的 assistant 消息，显示加载状态
        const newMessages = [
            ...sessionMessages,
            userMsg,
            { id: assistantId, role: "assistant" as Role, content: "" } // 空消息用于显示加载动画
        ];

        if (retryCount === 0) {
            updateCurrentSession(newMessages);
        }

        setIsProcessing(true);
        setLoading(true);
        setEngineBusy(true);

        const controller = new AbortController();
        setAbortController(controller);

        // 确保引擎就绪
        if (!engineReady || !engineRef.current) {
            const waitingMsg: Message = {
                id: uid(),
                role: "assistant" as Role,
                content: "本地模型初始化中，请稍候…",
            };
            updateCurrentSession([...newMessages, waitingMsg]);

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
            // assistantId 已在上面创建
            let assistantMessage: Message = {
                id: assistantId,
                role: "assistant" as Role,
                content: ""
            };
            let hasStartedStreaming = false;
            let streamResp;

            console.log("[handleSend] 创建流式请求...");

            try {
                await new Promise((resolve) => setTimeout(resolve, 100));

                console.log("[handleSend] 调用引擎API...");

                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error("引擎请求超时，可能需要重新初始化引擎"));
                    }, 15000);
                });

                const createPromise = eng.chat.completions.create({
                    messages: sendMessages,
                    stream: true,
                });

                streamResp = await Promise.race([createPromise, timeoutPromise]);

                console.log("[handleSend] 流式请求创建成功");
            } catch (error) {
                console.error("[handleSend] 创建流式请求失败:", error);

                if (
                    error instanceof Error &&
                    error.message.includes("超时") &&
                    retryCount < 2
                ) {
                    console.log(
                        `[handleSend] 检测到引擎超时，开始第${retryCount + 2}次自动重试...`
                    );

                    const retryMsg: Message = {
                        id: uid(),
                        role: "assistant" as Role,
                        content: "检测到引擎异常，正在自动重试...",
                    };
                    updateCurrentSession([...newMessages, retryMsg]);

                    await forceEngineReinit();

                    setLoading(false);
                    setAbortController(null);
                    setIsProcessing(false);
                    setEngineBusy(false);

                    setTimeout(() => {
                        handleSend(text, retryCount + 1);
                    }, 1000);
                    return;
                }

                throw error;
            }

            try {
                console.log("[handleSend] 开始处理流式响应...");

                let chunkCount = 0;
                let totalLength = 0;
                let lastContent = "";
                let duplicateCount = 0;
                let isQualityChecked = true;

                for await (const chunk of streamResp) {
                    chunkCount++;

                    if (controller.signal.aborted) {
                        console.log("[handleSend] 检测到中止信号，退出处理");
                        break;
                    }

                    const delta: string = chunk?.choices?.[0]?.delta?.content || "";

                    if (delta && delta.length >= STREAM_CONFIG.minChunkLength) {
                        // 检查长度限制
                        if (totalLength + delta.length > STREAM_CONFIG.maxLength) {
                            console.log("[handleSend] 达到最大长度限制，停止接收");

                            const remainingLength = STREAM_CONFIG.maxLength - totalLength;
                            if (remainingLength > 10) {
                                const truncatedDelta = truncateAtSentence(
                                    delta,
                                    remainingLength
                                );
                                if (truncatedDelta.length > 5) {
                                    if (!hasStartedStreaming) {
                                        assistantMessage.content = truncatedDelta;
                                        hasStartedStreaming = true;
                                    } else {
                                        assistantMessage.content += truncatedDelta;
                                    }
                                    // 更新消息内容（assistant 消息已经在列表中）
                                    updateCurrentSession([
                                        ...sessionMessages,
                                        userMsg,
                                        assistantMessage
                                    ]);
                                }
                            }
                            break;
                        }

                        // 重复检测
                        if (detectDuplicate(lastContent, delta, STREAM_CONFIG.duplicateThreshold)) {
                            duplicateCount++;
                            console.log(
                                `[handleSend] 检测到重复内容 (${duplicateCount}次): "${delta}"`
                            );

                            if (duplicateCount >= 3) {
                                console.log("[handleSend] 连续重复内容过多，停止接收");
                                break;
                            }
                            continue;
                        } else {
                            duplicateCount = 0;
                        }

                        // 质量检查
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
                            assistantMessage.content = delta;
                            hasStartedStreaming = true;
                        } else {
                            assistantMessage.content += delta;
                        }
                        // 更新消息内容（assistant 消息已经在列表中）
                        updateCurrentSession([
                            ...sessionMessages,
                            userMsg,
                            assistantMessage
                        ]);

                        totalLength += delta.length;
                        lastContent = (assistantMessage?.content || "").slice(-100);
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

                        assistantMessage.content = `回答内容质量检查失败（${finalQualityCheck.reason}），请重试。`;
                        updateCurrentSession([...newMessages, assistantMessage]);
                    }
                }

                console.log(
                    `[handleSend] 流式处理完成，总共处理了${chunkCount}个chunk，总长度${totalLength}字符`
                );
            } finally {
                try {
                    if (streamResp && streamResp.return) {
                        await streamResp.return();
                        console.log("[handleSend] 流式响应已关闭");
                    }
                } catch (e) {
                    console.warn("[handleSend] 流式响应关闭时出错:", e);
                }

                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        } catch (e: any) {
            console.error("[handleSend] 请求处理出错:", e);

            if (controller.signal.aborted) {
                console.log("[handleSend] 请求被中止，不显示错误消息");
                return;
            }

            const errorMsg: Message = {
                id: uid(),
                role: "assistant" as Role,
                content: `请求出错：${e?.message || e}`,
            };
            updateCurrentSession([...newMessages, errorMsg]);
        } finally {
            console.log("[handleSend] 清理状态...");

            setLoading(false);
            setAbortController(null);

            setTimeout(() => {
                setIsProcessing(false);
                console.log("[handleSend] 处理状态已重置");
            }, 300);

            setTimeout(() => {
                setEngineBusy(false);
                console.log("[handleSend] 引擎状态已重置");
            }, 1000);
        }
    }

    // 停止AI回答
    function handleStop() {
        console.log("[handleStop] 执行停止操作...");

        if (abortController) {
            console.log("[handleStop] 中止当前请求...");
            abortController.abort();
        }

        setLoading(false);
        setAbortController(null);

        setTimeout(() => {
            console.log("[handleStop] 清理处理状态和空消息...");
            setIsProcessing(false);

            // 清理未完成的空AI消息
            const cleanedMessages = sessionMessages.filter(
                (m: Message) => !(m.role === "assistant" && m.content.trim() === "")
            );
            if (cleanedMessages.length !== sessionMessages.length) {
                console.log("[handleStop] 清理了空的AI消息");
                updateCurrentSession(cleanedMessages);
            }
        }, 300);

        setTimeout(() => {
            setEngineBusy(false);
            console.log("[handleStop] 引擎状态已重置，可以接受新请求");
        }, 1000);
    }

    return {
        loading,
        canSend,
        handleSend,
        handleStop,
    };
}

