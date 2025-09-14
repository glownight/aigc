import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import './MessageContent.css';
// 导入highlight.js的CSS主题
import 'highlight.js/styles/vs2015.css';

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant';
}

const MessageContent: React.FC<MessageContentProps> = ({ content, role }) => {
  // 对用户消息进行简单处理
  if (role === 'user') {
    return (
      <div className="message-content user-content">
        {content.split('\n').map((line, index) => (
          <div key={index} className="user-line">
            {line || '\u00A0'} {/* 空行使用不间断空格 */}
          </div>
        ))}
      </div>
    );
  }

  // 对AI消息使用Markdown渲染
  return (
    <div className="message-content assistant-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义组件样式
          h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
          h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
          h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
          h4: ({ children }) => <h4 className="md-h4">{children}</h4>,
          h5: ({ children }) => <h5 className="md-h5">{children}</h5>,
          h6: ({ children }) => <h6 className="md-h6">{children}</h6>,
          p: ({ children }) => <p className="md-paragraph">{children}</p>,
          ul: ({ children }) => <ul className="md-list">{children}</ul>,
          ol: ({ children }) => <ol className="md-list md-ordered-list">{children}</ol>,
          li: ({ children }) => <li className="md-list-item">{children}</li>,
          blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
          code: ({ children, className }) => {
            const inline = !className || !className.includes('language-');
            return inline ? (
              <code className="md-inline-code">{children}</code>
            ) : (
              <code className="md-code-block">{children}</code>
            );
          },
          pre: ({ children }) => <pre className="md-pre">{children}</pre>,
          table: ({ children }) => <table className="md-table">{children}</table>,
          thead: ({ children }) => <thead className="md-thead">{children}</thead>,
          tbody: ({ children }) => <tbody className="md-tbody">{children}</tbody>,
          tr: ({ children }) => <tr className="md-tr">{children}</tr>,
          th: ({ children }) => <th className="md-th">{children}</th>,
          td: ({ children }) => <td className="md-td">{children}</td>,
          strong: ({ children }) => <strong className="md-strong">{children}</strong>,
          em: ({ children }) => <em className="md-em">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} className="md-link" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          hr: () => <hr className="md-hr" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent;