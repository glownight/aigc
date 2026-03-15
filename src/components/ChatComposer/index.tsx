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
  const statusHint = loading
    ? "generation active"
    : "enter sends · shift+enter newline";

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
    <footer
      className="composer workspace-composer"
      data-loading={loading ? "true" : "false"}
    >
      <div className="workspace-composer__panel">
        <div className="workspace-composer__body">
          <div className="workspace-composer__field">
            <div className="workspace-composer__field-meta" aria-hidden="true">
              <span className="workspace-composer__prefix">
                {loading ? "stream //" : "prompt //"}
              </span>
              <span className="workspace-composer__hint">{statusHint}</span>
            </div>

            <textarea
              className="workspace-composer__textarea"
              value={input}
              onChange={handleChange}
              placeholder="请输入你的问题，回车发送，Shift+回车换行"
              onKeyDown={handleKeyDown}
              aria-label="消息输入框"
            />
          </div>

          <div className="composer-actions workspace-composer__actions">
            {loading ? (
              <button
                type="button"
                className="btn workspace-composer__button workspace-composer__button--danger"
                onClick={onStop}
              >
                <span className="workspace-composer__button-kicker">HALT</span>
                <span className="workspace-composer__button-label">停止</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn workspace-composer__button workspace-composer__button--send"
                disabled={!canSend}
                onClick={onSend}
              >
                <span className="workspace-composer__button-kicker">SEND</span>
                <span className="workspace-composer__button-label">发送</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
});

export default ChatComposer;
