/**
 * useRemoteChat Hook - 管理远程API聊天
 */

import { useState } from "react";
import type { Message, Role, RemoteApiConfig } from "../types";
import { uid } from "../utils/uid";

export function useRemoteChat(
    apiConfig: RemoteApiConfig,
    sessionMessages: Message[],
    updateCurrentSession: (messages: Message[]) => void
) {
    const [loading, setLoading] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    // 发送消息到远程API
    async function handleSend(text: string): Promise<void> {
        if (!(text.trim().length > 0) || loading) return;

        if (import.meta.env.DEV) {
            console.log("[useRemoteChat] 🚀 开始请求:", apiConfig.model);
        }

        const userMsg: Message = { id: uid(), role: "user", content: text.trim() };
        const assistantId = uid();

        // 只保存用户消息，不创建空的 assistant 消息
        const newMessages = [
            ...sessionMessages,
            userMsg,
        ];
        updateCurrentSession(newMessages);

        setLoading(true);

        const controller = new AbortController();
        setAbortController(controller);

        try {
            const sendMessages = sessionMessages
                .concat(userMsg)
                .map(({ role, content }: { role: Role; content: string }) => ({
                    role,
                    content,
                }));

            // 确保URL格式正确
            let apiURL = apiConfig.baseURL;
            if (!apiURL.endsWith('/')) {
                apiURL += '/';
            }
            apiURL += 'v1/chat/completions';

            const requestBody = {
                model: apiConfig.model,
                messages: sendMessages,
                stream: true,
            };

            const requestHeaders = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiConfig.apiKey}`,
            };

            // 🚀 性能优化：添加 keepalive 和优先级
            const response = await fetch(apiURL, {
                method: "POST",
                headers: requestHeaders,
                body: JSON.stringify(requestBody),
                signal: controller.signal,
                keepalive: true, // 保持连接以加快后续请求
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[useRemoteChat] ❌ API错误:", response.status, errorText);
                throw new Error(`API请求失败: ${response.status} - ${errorText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("无法读取响应流");
            }

            const decoder = new TextDecoder();
            // assistantId 已在上面创建
            let assistantMessage: Message = {
                id: assistantId,
                role: "assistant" as Role,
                content: ""
            };
            let hasStartedStreaming = false;

            // 🎯 性能优化：批量更新和节流
            let pendingContent = "";
            let lastUpdateTime = Date.now();
            const UPDATE_INTERVAL = 50; // 50ms更新一次，保证流畅
            const MIN_CHARS_TO_UPDATE = 3; // 至少累积3个字符再更新

            const flushPendingContent = () => {
                if (pendingContent) {
                    assistantMessage.content += pendingContent;
                    pendingContent = "";
                    updateCurrentSession([
                        ...newMessages,
                        { ...assistantMessage }
                    ]);
                    lastUpdateTime = Date.now();
                }
            };

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // 确保最后的内容被刷新
                    flushPendingContent();
                    if (import.meta.env.DEV) {
                        console.log("[useRemoteChat] ✅ 响应完成，总长度:", assistantMessage.content.length);
                    }
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter((line) => line.trim() !== "");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);

                        if (data === "[DONE]") {
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed?.choices?.[0]?.delta?.content || "";

                            if (delta) {
                                // 🚀 性能优化：只在开发环境且首次收到内容时打印
                                if (!hasStartedStreaming && import.meta.env.DEV) {
                                    console.log("[useRemoteChat] ✅ 开始接收流式响应");
                                }

                                if (!hasStartedStreaming) {
                                    // 第一次收到内容，创建并立即显示
                                    assistantMessage.content = delta;
                                    hasStartedStreaming = true;
                                    updateCurrentSession([
                                        ...newMessages,
                                        { ...assistantMessage }
                                    ]);
                                    lastUpdateTime = Date.now();
                                } else {
                                    // 累积内容
                                    pendingContent += delta;

                                    const now = Date.now();
                                    const timeSinceLastUpdate = now - lastUpdateTime;

                                    // 满足以下任一条件就更新UI：
                                    // 1. 累积的字符超过阈值
                                    // 2. 距离上次更新超过时间间隔
                                    if (pendingContent.length >= MIN_CHARS_TO_UPDATE ||
                                        timeSinceLastUpdate >= UPDATE_INTERVAL) {
                                        flushPendingContent();
                                    }
                                }
                            }
                        } catch (e) {
                            // 忽略解析错误，继续处理下一个chunk
                        }
                    }
                }
            }

        } catch (e: any) {
            console.error("[useRemoteChat] ❌ 请求失败:", e?.message || e);

            if (controller.signal.aborted) {
                // 请求被中止，清理空的 assistant 消息
                const cleanedMessages = [
                    ...sessionMessages,
                    userMsg
                ].filter(m => !(m.role === "assistant" && !m.content?.trim()));
                updateCurrentSession(cleanedMessages);
                return;
            }

            // 清理空的 assistant 消息，添加错误消息
            const errorMsg: Message = {
                id: uid(),
                role: "assistant" as Role,
                content: `请求出错：${e?.message || e}`,
            };
            updateCurrentSession([...sessionMessages, userMsg, errorMsg]);
        } finally {
            setLoading(false);
            setAbortController(null);
        }
    }

    // 停止AI回答
    function handleStop() {
        if (abortController) {
            abortController.abort();
        }
        setLoading(false);
        setAbortController(null);

        // 清理空的 assistant 消息
        const cleanedMessages = sessionMessages.filter(
            (m: Message) => !(m.role === "assistant" && !m.content?.trim())
        );
        if (cleanedMessages.length !== sessionMessages.length) {
            console.log("[useRemoteChat] 清理了空的AI消息");
            updateCurrentSession(cleanedMessages);
        }
    }

    return {
        loading,
        canSend: !loading,
        handleSend,
        handleStop,
    };
}

