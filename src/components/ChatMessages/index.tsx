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
  // 过滤系统消息，避免每次都重新计算
  const visibleMessages = useMemo(() => {
    return messages.filter((m: Message) => m.role !== "system");
  }, [messages]);

  return (
    <div className="list" ref={listRef}>
      {visibleMessages.map((m: Message) => (
        <MessageItem key={m.id} message={m} loading={loading} />
      ))}
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
        {message.content ? (
          <MessageContent
            content={message.content}
            role={message.role as "user" | "assistant"}
            isStreaming={isStreaming}
          />
        ) : loading && message.role === "assistant" ? (
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
  );
});

export default ChatMessages;
