/**
 * ChatMessages 组件 - 消息列表
 */

import { memo, useMemo } from "react";
import type { Message } from "../../types";
import MessageContent from "../../MessageContent";
import "./styles.css";

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  listRef: React.RefObject<HTMLDivElement>;
}

function getMessageBadge(role: "user" | "assistant") {
  return role === "user" ? "ME" : "AI";
}

function getMessageEyebrow(role: "user" | "assistant") {
  return role === "user" ? "Prompt" : "Assistant";
}

function getMessageState(role: "user" | "assistant", isStreaming: boolean) {
  if (role === "assistant") {
    return isStreaming ? "Streaming" : "Ready";
  }

  return "Sent";
}

const ChatMessages = memo(function ChatMessages({
  messages,
  loading,
  listRef,
}: ChatMessagesProps) {
  // 过滤系统消息和空的 AI 消息，以及欢迎消息（当有用户消息时）
  const visibleMessages = useMemo(() => {
    // 检查是否有用户消息
    const hasUserMessage = messages.some((m: Message) => m.role === "user");

    return messages.filter((m: Message) => {
      // 过滤掉系统消息
      if (m.role === "system") return false;
      // 过滤掉内容为空的 AI 消息
      if (m.role === "assistant" && !m.content?.trim()) return false;
      // 如果已有用户消息，过滤掉欢迎消息
      if (
        hasUserMessage &&
        m.role === "assistant" &&
        m.content === "你好，我可以为你提供智能问答服务～"
      ) {
        return false;
      }
      return true;
    });
  }, [messages]);

  return (
    <div className="list workspace-messages" ref={listRef}>
      {visibleMessages.map((m: Message) => (
        <MessageItem key={m.id} message={m} loading={loading} />
      ))}
      {/* 如果正在加载且最后一条不是 AI 消息，显示加载动画 */}
      {loading &&
        (visibleMessages.length === 0 ||
          visibleMessages[visibleMessages.length - 1]?.role !==
            "assistant") && (
          <div
            className="msg assistant workspace-message workspace-message--assistant workspace-message--pending"
            aria-live="polite"
          >
            <div className="role workspace-message__avatar" aria-hidden="true">
              AI
            </div>
            <div className="bubble workspace-message__bubble">
              <div className="workspace-message__meta">
                <span className="workspace-message__eyebrow">Assistant</span>
                <span className="workspace-message__state workspace-message__state--live">
                  <span
                    className="workspace-message__state-dot"
                    aria-hidden="true"
                  />
                  Streaming
                </span>
              </div>
              <div
                className="loading-indicator workspace-message__loading"
                role="status"
                aria-label="AI 正在生成回复"
              >
                <div className="typing-dots" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div
                  className="workspace-message__loading-copy"
                  aria-hidden="true"
                >
                  <span className="workspace-message__loading-line" />
                  <span className="workspace-message__loading-line workspace-message__loading-line--short" />
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
});

// MessageItem 子组件
interface MessageItemProps {
  message: Message;
  loading: boolean;
}

const MessageItem = memo(function MessageItem({
  message,
  loading,
}: MessageItemProps) {
  const role = message.role === "user" ? "user" : "assistant";
  const roleLabel = getMessageBadge(role);
  // 判断是否正在流式输出：loading状态下，AI角色且有内容
  const isStreaming =
    loading && message.role === "assistant" && message.content.length > 0;
  const stateLabel = getMessageState(role, isStreaming);

  return (
    <div
      className={`msg ${message.role} workspace-message workspace-message--${role} ${
        isStreaming ? "is-streaming" : ""
      }`}
    >
      <div className="role workspace-message__avatar" aria-hidden="true">
        {roleLabel}
      </div>
      <div className="bubble workspace-message__bubble">
        <div className="workspace-message__meta">
          <span className="workspace-message__eyebrow">
            {getMessageEyebrow(role)}
          </span>
          <span
            className={`workspace-message__state ${
              isStreaming ? "workspace-message__state--live" : ""
            }`}
          >
            {isStreaming && (
              <span
                className="workspace-message__state-dot"
                aria-hidden="true"
              />
            )}
            {stateLabel}
          </span>
        </div>
        <MessageContent
          content={message.content}
          role={role}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
});

export default ChatMessages;
