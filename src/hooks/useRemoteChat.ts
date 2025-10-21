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

        console.log("[useRemoteChat] 开始发送请求到远程API...");
        console.log("[useRemoteChat] API配置:", {
            baseURL: apiConfig.baseURL,
            model: apiConfig.model,
            hasKey: !!apiConfig.apiKey
        });

        const userMsg: Message = { id: uid(), role: "user", content: text.trim() };
        const newMessages = [...sessionMessages, userMsg];
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

            console.log("[useRemoteChat] 发送消息:", sendMessages);

            // 确保URL格式正确
            let apiURL = apiConfig.baseURL;
            if (!apiURL.endsWith('/')) {
                apiURL += '/';
            }
            apiURL += 'v1/chat/completions';

            console.log("[useRemoteChat] 请求URL:", apiURL);

            const response = await fetch(apiURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiConfig.apiKey}`,
                },
                body: JSON.stringify({
                    model: apiConfig.model,
                    messages: sendMessages,
                    stream: true,
                }),
                signal: controller.signal,
            });

            console.log("[useRemoteChat] 响应状态:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[useRemoteChat] API错误:", errorText);
                throw new Error(`API请求失败: ${response.status} - ${errorText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("无法读取响应流");
            }

            const decoder = new TextDecoder();
            const assistantId = uid();
            let assistantMessage: Message | null = null;
            let hasStartedStreaming = false;

            console.log("[useRemoteChat] 开始读取流式响应...");

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log("[useRemoteChat] 流式响应读取完成");
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter((line) => line.trim() !== "");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);

                        if (data === "[DONE]") {
                            console.log("[useRemoteChat] 收到完成信号");
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed?.choices?.[0]?.delta?.content || "";

                            if (delta) {
                                console.log("[useRemoteChat] 收到内容:", delta);

                                if (!hasStartedStreaming) {
                                    assistantMessage = {
                                        id: assistantId,
                                        role: "assistant" as Role,
                                        content: delta,
                                    };
                                    updateCurrentSession([...newMessages, assistantMessage]);
                                    hasStartedStreaming = true;
                                } else {
                                    assistantMessage!.content += delta;
                                    updateCurrentSession([...newMessages, assistantMessage!]);
                                }
                            }
                        } catch (e) {
                            console.warn("[useRemoteChat] 解析JSON失败:", e, "数据:", data);
                        }
                    }
                }
            }

            console.log("[useRemoteChat] 消息发送完成");
        } catch (e: any) {
            console.error("[useRemoteChat] 请求处理出错:", e);

            if (controller.signal.aborted) {
                console.log("[useRemoteChat] 请求被中止");
                return;
            }

            const errorMsg: Message = {
                id: uid(),
                role: "assistant" as Role,
                content: `请求出错：${e?.message || e}`,
            };
            updateCurrentSession([...newMessages, errorMsg]);
        } finally {
            setLoading(false);
            setAbortController(null);
        }
    }

    // 停止AI回答
    function handleStop() {
        console.log("[useRemoteChat] 执行停止操作...");

        if (abortController) {
            abortController.abort();
        }

        setLoading(false);
        setAbortController(null);
    }

    return {
        loading,
        canSend: !loading,
        handleSend,
        handleStop,
    };
}

