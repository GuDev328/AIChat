"use client";

import { useRef, useState } from "react";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  sending: boolean;
  onCancel: () => void;
}

export default function ChatInput({ onSend, sending, onCancel }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div className="input-area">
      <div className="input-box">
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message GuAI (Shift+Enter for new line)"
          rows={1}
          disabled={sending}
        />
        <button
          className={`send-btn ${sending ? "cancel" : (!input.trim() ? "disabled" : "")}`}
          onClick={sending ? onCancel : handleSend}
          disabled={!sending && !input.trim()}
          aria-label={sending ? "Cancel generation" : "Send message"}
        >
          {sending ? (
            <Square size={18} className="cancel-icon" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
