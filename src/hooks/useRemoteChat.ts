/**
 * useRemoteChat Hook - 管理远程 API 聊天
 */

import { useRef, useState } from "react";
import type { Message, RemoteApiConfig, Role } from "../types";
import { uid } from "../utils/uid";

type StreamEventPayload = {
  type?: string;
  delta?: string;
  error?: { message?: string };
  message?: string;
  choices?: Array<{ delta?: { content?: string } }>;
};

type ErrorResponsePayload = {
  error?: string;
  message?: string;
  diagnostics?: {
    hasOpenAIApiKey?: boolean;
    hasCodexForMeApiKey?: boolean;
    hasUpstreamApiKey?: boolean;
    hasSuanliApiKey?: boolean;
    hasBearerToken?: boolean;
  };
};

type ActiveRequestState = {
  controller: AbortController;
  latestMessages: Message[];
  syncMessages: (messages: Message[]) => void;
};

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

function formatDiagnostics(diagnostics: NonNullable<ErrorResponsePayload["diagnostics"]>): string {
  return [
    `OPENAI_API_KEY=${diagnostics.hasOpenAIApiKey ? "yes" : "no"}`,
    `CODEX_FOR_ME_API_KEY=${diagnostics.hasCodexForMeApiKey ? "yes" : "no"}`,
    `UPSTREAM_API_KEY=${diagnostics.hasUpstreamApiKey ? "yes" : "no"}`,
    `SUANLI_API_KEY=${diagnostics.hasSuanliApiKey ? "yes" : "no"}`,
    `Authorization=${diagnostics.hasBearerToken ? "yes" : "no"}`,
  ].join(", ");
}

function extractErrorMessage(errorText: string): string {
  const trimmed = errorText.trim();
  if (!trimmed) {
    return "服务器未返回错误详情";
  }

  try {
    const parsed = JSON.parse(trimmed) as ErrorResponsePayload;

    if (parsed.error && parsed.diagnostics) {
      return `${parsed.error} (${formatDiagnostics(parsed.diagnostics)})`;
    }

    return parsed.error || parsed.message || trimmed;
  } catch {
    return trimmed;
  }
}

function formatRequestError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (/Failed to fetch/i.test(rawMessage)) {
    return "无法连接到 /api/chat。请确认开发服务器已重启，或检查线上部署是否可访问。";
  }

  if (/Missing API key/i.test(rawMessage)) {
    return "未检测到可用的 API Key。Vercel 部署请打开 /api/env-check，确认 hasOpenAIApiKey 在 Production 中为 true；或者在设置里手动填入 clp key。";
  }

  return rawMessage;
}

function isEmptyAssistantMessage(message: Message): boolean {
  return message.role === "assistant" && !message.content.trim();
}

function stripEmptyAssistantMessages(messages: Message[]): Message[] {
  const cleanedMessages = messages.filter((message) => !isEmptyAssistantMessage(message));
  return cleanedMessages.length === messages.length ? messages : cleanedMessages;
}

function getStreamDataLines(block: string): string[] {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6));
}

function getStreamDelta(data: string): string {
  const parsed = JSON.parse(data) as StreamEventPayload;

  if (parsed.type === "error") {
    throw new Error(parsed.error?.message || parsed.message || "流式响应出错");
  }

  return (
    parsed.choices?.[0]?.delta?.content ||
    (parsed.type === "response.output_text.delta" ? parsed.delta || "" : "")
  );
}

export function useRemoteChat(
  apiConfig: RemoteApiConfig,
  sessionMessages: Message[],
  updateCurrentSession: (messages: Message[]) => void,
) {
  const [loading, setLoading] = useState(false);
  const activeRequestRef = useRef<ActiveRequestState | null>(null);

  async function handleSend(text: string): Promise<void> {
    if (!(text.trim().length > 0) || loading) {
      return;
    }

    const userMsg: Message = { id: uid(), role: "user", content: text.trim() };
    const assistantId = uid();
    const newMessages = [...sessionMessages, userMsg];
    const controller = new AbortController();
    const syncMessages = (messages: Message[]) => {
      if (activeRequestRef.current?.controller === controller) {
        activeRequestRef.current.latestMessages = messages;
      }

      updateCurrentSession(messages);
    };

    activeRequestRef.current = {
      controller,
      latestMessages: newMessages,
      syncMessages,
    };

    syncMessages(newMessages);
    setLoading(true);

    let flushPendingContentForCleanup: (() => void) | null = null;

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
        role: "assistant",
        content: "",
      };
      let hasStartedStreaming = false;
      let pendingContent = "";
      let lastUpdateTime = Date.now();
      let streamBuffer = "";
      const updateInterval = 50;
      const minCharsToUpdate = 3;

      const syncAssistantMessage = () => {
        syncMessages([...newMessages, { ...assistantMessage }]);
        lastUpdateTime = Date.now();
      };

      const flushPendingContent = () => {
        if (!pendingContent) {
          return;
        }

        assistantMessage.content += pendingContent;
        pendingContent = "";
        syncAssistantMessage();
      };

      flushPendingContentForCleanup = flushPendingContent;

      const processEventBlocks = (eventBlocks: string[]) => {
        for (const block of eventBlocks) {
          const dataLines = getStreamDataLines(block);

          for (const data of dataLines) {
            if (data === "[DONE]") {
              continue;
            }

            try {
              const delta = getStreamDelta(data);

              if (!delta) {
                continue;
              }

              if (!hasStartedStreaming) {
                assistantMessage.content = delta;
                hasStartedStreaming = true;
                syncAssistantMessage();
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
              if (error instanceof SyntaxError) {
                console.warn("[useRemoteChat] skipped stream event:", error);
                continue;
              }

              throw error;
            }
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          streamBuffer += decoder.decode(value, { stream: true });
        }

        if (done) {
          streamBuffer += decoder.decode();
        }

        const eventBlocks = streamBuffer.split("\n\n");
        streamBuffer = done ? "" : eventBlocks.pop() || "";
        processEventBlocks(eventBlocks);

        if (done) {
          flushPendingContent();
          break;
        }
      }
    } catch (error) {
      console.error("[useRemoteChat] request failed:", error);
      flushPendingContentForCleanup?.();

      if (controller.signal.aborted) {
        const latestMessages =
          activeRequestRef.current?.controller === controller
            ? activeRequestRef.current.latestMessages
            : newMessages;
        const cleanedMessages = stripEmptyAssistantMessages(latestMessages);

        if (cleanedMessages !== latestMessages) {
          syncMessages(cleanedMessages);
        }
        return;
      }

      const errorMsg: Message = {
        id: uid(),
        role: "assistant",
        content: `请求出错：${formatRequestError(error)}`,
      };
      syncMessages([...newMessages, errorMsg]);
    } finally {
      if (activeRequestRef.current?.controller === controller) {
        activeRequestRef.current = null;
        setLoading(false);
      }
    }
  }

  function handleStop() {
    const activeRequest = activeRequestRef.current;
    if (!activeRequest) {
      return;
    }

    activeRequest.controller.abort();
    setLoading(false);

    const cleanedMessages = stripEmptyAssistantMessages(activeRequest.latestMessages);
    if (cleanedMessages !== activeRequest.latestMessages) {
      activeRequest.syncMessages(cleanedMessages);
    }
  }

  return {
    loading,
    canSend: !loading,
    handleSend,
    handleStop,
  };
}
