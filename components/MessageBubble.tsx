"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState, memo } from "react";
import type { Components } from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface MessageBubbleProps {
  message: Message;
}

function CopyButton({
  text,
  title = "Copy",
  className = "copy-btn",
}: {
  text: string;
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={className} onClick={handleCopy} title={title}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

// Extract components outside to maintain a stable reference and avoid re-creating on every render
const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");
    if (match) {
      return (
        <div className="code-block-wrapper">
          <div className="code-block-header">
            <span className="code-lang">{match[1]}</span>
            <CopyButton text={codeString} />
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: "0 0 8px 8px",
              fontSize: "0.82rem",
            }}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  },
};

const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
      <div className={`message-content ${isUser ? "user-message-content" : "assistant-message-content"}`}>
        <div className={`bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
          <CopyButton
            text={message.content}
            title="Copy message"
            className="copy-btn message-copy-btn"
          />
          {isUser ? (
            <p className="user-text">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;
