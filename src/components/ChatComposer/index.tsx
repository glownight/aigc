/**
 * ChatComposer 组件 - 消息输入框
 */

import "./styles.css";

interface ChatComposerProps {
  input: string;
  loading: boolean;
  canSend: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}

export default function ChatComposer({
  input,
  loading,
  canSend,
  onInputChange,
  onSend,
  onStop,
}: ChatComposerProps) {
  return (
    <footer className="composer">
      <textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="请输入你的问题，回车发送，Shift+回车换行"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (loading) {
              onStop();
            } else {
              onSend();
            }
          }
        }}
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
}
