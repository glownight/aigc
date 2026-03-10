/**
 * useRemoteChat Hook - 管理远程 API 聊天
 * 远程模式只调用后端网关 /api/chat
 */

import { useState } from "react";
import type { Message, Role, RemoteApiConfig } from "../types";
import { uid } from "../utils/uid";

function buildChatEndpoint(baseURL: string): string {
  const trimmed = baseURL.trim();
  if (!trimmed) {
    return "/api/chat";
  }
  return `${trimmed.replace(/\/+$/, "")}/api/chat`;
}

export function useRemoteChat(
  apiConfig: RemoteApiConfig,
  sessionMessages: Message[],
  updateCurrentSession: (messages: Message[]) => void,
) {
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  async function handleSend(text: string): Promise<void> {
    if (!(text.trim().length > 0) || loading) return;

    if (import.meta.env.DEV) {
      console.log("[useRemoteChat] Start request with model:", apiConfig.model);
    }

    const userMsg: Message = { id: uid(), role: "user", content: text.trim() };
    const assistantId = uid();

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

      const requestBody = {
        model: apiConfig.model,
        messages: sendMessages,
        stream: true,
      };

      const response = await fetch(buildChatEndpoint(apiConfig.baseURL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        keepalive: true,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useRemoteChat] API error:", response.status, errorText);
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      const decoder = new TextDecoder();
      let assistantMessage: Message = {
        id: assistantId,
        role: "assistant" as Role,
        content: "",
      };
      let hasStartedStreaming = false;

      let pendingContent = "";
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 50;
      const MIN_CHARS_TO_UPDATE = 3;

      const flushPendingContent = () => {
        if (pendingContent) {
          assistantMessage.content += pendingContent;
          pendingContent = "";
          updateCurrentSession([...newMessages, { ...assistantMessage }]);
          lastUpdateTime = Date.now();
        }
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          flushPendingContent();
          if (import.meta.env.DEV) {
            console.log(
              "[useRemoteChat] Response completed, total length:",
              assistantMessage.content.length,
            );
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue;
          }

          const data = line.slice(6);

          if (data === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content || "";

            if (!delta) {
              continue;
            }

            if (!hasStartedStreaming && import.meta.env.DEV) {
              console.log("[useRemoteChat] Streaming response received");
            }

            if (!hasStartedStreaming) {
              assistantMessage.content = delta;
              hasStartedStreaming = true;
              updateCurrentSession([...newMessages, { ...assistantMessage }]);
              lastUpdateTime = Date.now();
              continue;
            }

            pendingContent += delta;

            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTime;

            if (
              pendingContent.length >= MIN_CHARS_TO_UPDATE ||
              timeSinceLastUpdate >= UPDATE_INTERVAL
            ) {
              flushPendingContent();
            }
          } catch {
            // 忽略不符合 SSE JSON 的片段
          }
        }
      }
    } catch (e: any) {
      console.error("[useRemoteChat] request failed:", e?.message || e);

      if (controller.signal.aborted) {
        const cleanedMessages = [...sessionMessages, userMsg].filter(
          (m) => !(m.role === "assistant" && !m.content?.trim()),
        );
        updateCurrentSession(cleanedMessages);
        return;
      }

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

  function handleStop() {
    if (abortController) {
      abortController.abort();
    }
    setLoading(false);
    setAbortController(null);

    const cleanedMessages = sessionMessages.filter(
      (m: Message) => !(m.role === "assistant" && !m.content?.trim()),
    );
    if (cleanedMessages.length !== sessionMessages.length) {
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
