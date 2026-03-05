/**
 * ChatComposer 组件 - 消息输入框
 */

import { memo, useCallback } from "react";
import "./styles.css";

interface ChatComposerProps {
  input: string;
  loading: boolean;
  canSend: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}

const ChatComposer = memo(function ChatComposer({
  input,
  loading,
  canSend,
  onInputChange,
  onSend,
  onStop,
}: ChatComposerProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange(e.target.value);
    },
    [onInputChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (loading) {
          onStop();
        } else {
          onSend();
        }
      }
    },
    [loading, onSend, onStop]
  );

  return (
    <footer className="composer">
      <textarea
        value={input}
        onChange={handleChange}
        placeholder="请输入你的问题，回车发送，Shift+回车换行"
        onKeyDown={handleKeyDown}
      />
      <div className="composer-actions">
        {loading ? (
          <button className="btn danger" onClick={onStop}>
            停止
          </button>
        ) : (
          <button disabled={!canSend} onClick={onSend}>
            发送
          </button>
        )}
      </div>
    </footer>
  );
});

export default ChatComposer;
