"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, X } from "lucide-react";
import { useState, memo, useCallback } from "react";
import type { Components } from "react-markdown";

interface MessageImage {
  base64: string;
  mimeType: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: MessageImage[];
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

function getImageSrc(img: MessageImage): string {
  return `data:${img.mimeType};base64,${img.base64}`;
}

function MessageImages({ images }: { images: MessageImage[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  return (
    <>
      <div className={`message-images ${images.length === 1 ? "single" : "grid"}`}>
        {images.map((img, idx) => (
          <button
            key={idx}
            className="message-image-thumb"
            onClick={() => setLightboxIdx(idx)}
            aria-label={`View image ${idx + 1}`}
          >
            <img src={getImageSrc(img)} alt={`Attached ${idx + 1}`} />
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div className="lightbox-backdrop" onClick={closeLightbox}>
          <button
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X size={24} />
          </button>
          <img
            src={getImageSrc(images[lightboxIdx])}
            alt="Full size"
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hasImages = message.images && message.images.length > 0;

  return (
    <div className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
      <div className={`message-content ${isUser ? "user-message-content" : "assistant-message-content"}`}>
        <div className={`bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
          <CopyButton
            text={message.content}
            title="Copy message"
            className="copy-btn message-copy-btn"
          />
          {hasImages && <MessageImages images={message.images!} />}
          {isUser ? (
            message.content ? <p className="user-text">{message.content}</p> : null
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
