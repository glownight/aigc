/**
 * useRemoteChat Hook - 管理远程 API 聊天
 */

import { useState } from "react";
import type { Message, Role, RemoteApiConfig } from "../types";
import { uid } from "../utils/uid";

function normalizeRemoteChatEndpoint(rawBaseURL: string): string {
  const trimmed = rawBaseURL.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "/api/chat";
  }

  if (/^(\/|\.\/|\.\.\/)/.test(trimmed)) {
    return trimmed;
  }

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/.*)?$/i.test(trimmed)
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    const hasKnownPath =
      normalizedPath.endsWith("/chat/completions") || normalizedPath.endsWith("/responses");

    if (!hasKnownPath) {
      parsed.pathname = normalizedPath.endsWith("/v1")
        ? `${normalizedPath}/responses`
        : normalizedPath.length > 0
          ? `${normalizedPath}/v1/responses`
          : "/v1/responses";
    }

    return parsed.toString();
  } catch {
    return withScheme;
  }
}

function extractErrorMessage(errorText: string): string {
  const trimmed = errorText.trim();
  if (!trimmed) {
    return "服务器未返回错误详情";
  }

  try {
    const parsed = JSON.parse(trimmed) as { error?: string; message?: string };
    return parsed.error || parsed.message || trimmed;
  } catch {
    return trimmed;
  }
}

function formatRequestError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (/Failed to fetch/i.test(rawMessage)) {
    return "无法连接到 /api/chat。请确认开发服务器已重启，并在 .env.local 中设置 OPENAI_API_KEY，或在设置里填入 clp key。";
  }

  if (/Missing API key/i.test(rawMessage)) {
    return "未检测到可用的 API Key。请在 .env.local 中设置 OPENAI_API_KEY，或在设置里填入 clp key。";
  }

  return rawMessage;
}

export function useRemoteChat(
  apiConfig: RemoteApiConfig,
  sessionMessages: Message[],
  updateCurrentSession: (messages: Message[]) => void,
) {
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  async function handleSend(text: string): Promise<void> {
    if (!(text.trim().length > 0) || loading) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[useRemoteChat] start request:", apiConfig.model);
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

      const apiURL = normalizeRemoteChatEndpoint(apiConfig.baseURL);
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (apiConfig.apiKey.trim()) {
        requestHeaders.Authorization = `Bearer ${apiConfig.apiKey.trim()}`;
      }

      const response = await fetch(apiURL, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          model: apiConfig.model,
          messages: sendMessages,
          stream: true,
        }),
        signal: controller.signal,
        keepalive: true,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const message = extractErrorMessage(errorText);
        console.error("[useRemoteChat] API error:", response.status, message);
        throw new Error(`API 请求失败 (${response.status}): ${message}`);
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
      let streamBuffer = "";
      const updateInterval = 50;
      const minCharsToUpdate = 3;

      const flushPendingContent = () => {
        if (!pendingContent) {
          return;
        }

        assistantMessage.content += pendingContent;
        pendingContent = "";
        updateCurrentSession([...newMessages, { ...assistantMessage }]);
        lastUpdateTime = Date.now();
      };

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          streamBuffer += decoder.decode(value, { stream: !done });
        }

        const eventBlocks = streamBuffer.split("\n\n");
        streamBuffer = done ? "" : eventBlocks.pop() || "";

        if (done) {
          for (const block of eventBlocks) {
            const dataLines = block
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.startsWith("data: "))
              .map((line) => line.slice(6));

            for (const data of dataLines) {
              if (data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data) as {
                  type?: string;
                  delta?: string;
                  error?: { message?: string };
                  message?: string;
                  choices?: Array<{ delta?: { content?: string } }>;
                };

                if (parsed.type === "error") {
                  throw new Error(parsed.error?.message || parsed.message || "流式响应出错");
                }

                const delta =
                  parsed.choices?.[0]?.delta?.content ||
                  (parsed.type === "response.output_text.delta" ? parsed.delta || "" : "");

                if (!delta) {
                  continue;
                }

                if (!hasStartedStreaming) {
                  assistantMessage.content = delta;
                  hasStartedStreaming = true;
                  updateCurrentSession([...newMessages, { ...assistantMessage }]);
                  lastUpdateTime = Date.now();
                } else {
                  pendingContent += delta;
                }
              } catch (error) {
                console.warn("[useRemoteChat] skipped stream event:", error);
              }
            }
          }

          flushPendingContent();
          if (import.meta.env.DEV) {
            console.log("[useRemoteChat] response completed:", assistantMessage.content.length);
          }
          break;
        }

        for (const block of eventBlocks) {
          const dataLines = block
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.startsWith("data: "))
            .map((line) => line.slice(6));

          for (const data of dataLines) {
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data) as {
                type?: string;
                delta?: string;
                error?: { message?: string };
                message?: string;
                choices?: Array<{ delta?: { content?: string } }>;
              };

              if (parsed.type === "error") {
                throw new Error(parsed.error?.message || parsed.message || "流式响应出错");
              }

              const delta =
                parsed.choices?.[0]?.delta?.content ||
                (parsed.type === "response.output_text.delta" ? parsed.delta || "" : "");

              if (!delta) {
                continue;
              }

              if (!hasStartedStreaming && import.meta.env.DEV) {
                console.log("[useRemoteChat] start streaming response");
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
                pendingContent.length >= minCharsToUpdate ||
                timeSinceLastUpdate >= updateInterval
              ) {
                flushPendingContent();
              }
            } catch (error) {
              console.warn("[useRemoteChat] skipped stream event:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("[useRemoteChat] request failed:", error);

      if (controller.signal.aborted) {
        const cleanedMessages = [...sessionMessages, userMsg].filter(
          (message) => !(message.role === "assistant" && !message.content?.trim()),
        );
        updateCurrentSession(cleanedMessages);
        return;
      }

      const errorMsg: Message = {
        id: uid(),
        role: "assistant" as Role,
        content: `请求出错：${formatRequestError(error)}`,
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
      (message: Message) => !(message.role === "assistant" && !message.content?.trim()),
    );
    if (cleanedMessages.length !== sessionMessages.length) {
      console.log("[useRemoteChat] cleaned empty assistant message");
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
