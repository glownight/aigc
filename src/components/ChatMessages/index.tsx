/**
 * ChatMessages 组件 - 消息列表
 */

import type { Message } from "../../types";
import MessageContent from "../../MessageContent";
import "./styles.css";

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  listRef: React.RefObject<HTMLDivElement>;
}

export default function ChatMessages({
  messages,
  loading,
  listRef,
}: ChatMessagesProps) {
  return (
    <div className="list" ref={listRef}>
      {messages
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
  );
}
