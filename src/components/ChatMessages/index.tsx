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

const ChatMessages = memo(function ChatMessages({
  messages,
  loading,
  listRef,
}: ChatMessagesProps) {
  // 过滤系统消息和空的 AI 消息
  const visibleMessages = useMemo(() => {
    return messages.filter((m: Message) => {
      // 过滤掉系统消息
      if (m.role === "system") return false;
      // 过滤掉内容为空的 AI 消息
      if (m.role === "assistant" && !m.content?.trim()) return false;
      return true;
    });
  }, [messages]);

  return (
    <div className="list" ref={listRef}>
      {visibleMessages.map((m: Message) => (
        <MessageItem key={m.id} message={m} loading={loading} />
      ))}
      {/* 如果正在加载且最后一条不是 AI 消息，显示加载动画 */}
      {loading &&
        (visibleMessages.length === 0 ||
          visibleMessages[visibleMessages.length - 1]?.role !==
            "assistant") && (
          <div className="msg assistant">
            <div className="role">AI</div>
            <div className="bubble">
              <div className="loading-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
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
  const roleLabel = message.role === "user" ? "我" : "AI";
  // 判断是否正在流式输出：loading状态下，AI角色且有内容
  const isStreaming =
    loading && message.role === "assistant" && message.content.length > 0;

  return (
    <div className={`msg ${message.role}`}>
      <div className="role">{roleLabel}</div>
      <div className="bubble">
        <MessageContent
          content={message.content}
          role={message.role as "user" | "assistant"}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
});

export default ChatMessages;
