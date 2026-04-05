"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import { Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface Conversation {
  conversationId: string;
  title: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch conversation list
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Restore last active conversation from localStorage
    const saved = localStorage.getItem("currentConversationId");
    if (saved) setCurrentId(saved);
  }, []);

  // Fetch messages when switching conversation
  useEffect(() => {
    if (!currentId) {
      setMessages([]);
      return;
    }
    localStorage.setItem("currentConversationId", currentId);

    const load = async () => {
      setLoadingMsgs(true);
      try {
        const res = await fetch(`/api/conversations/${currentId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages ?? []);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoadingMsgs(false);
      }
    };
    load();
  }, [currentId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (messageText: string) => {
    if (!messageText || sending) return;

    const convId = currentId ?? uuidv4();
    if (!currentId) setCurrentId(convId);

    // Optimistic update
    const userMsg: Message = { role: "user", content: messageText, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, message: messageText }),
      });
      if (!res.ok) {
        let errStr = "Unknown error";
        try {
           const errData = await res.json();
           errStr = errData.error ?? errStr;
        } catch {}
        throw new Error(errStr);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream from server");

      const decoder = new TextDecoder();
      let assistantMsgText = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", createdAt: new Date().toISOString() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantMsgText += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          newMsgs[lastIdx] = {
            ...newMsgs[lastIdx],
            content: assistantMsgText,
          };
          return newMsgs;
        });
      }

      // Refresh conversation list (title may have changed)
      await fetchConversations();
    } catch (err) {
      const errMsg: Message = {
        role: "assistant",
        content: `⚠️ Error: ${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const createNewConversation = useCallback(() => {
    const newId = uuidv4();
    setCurrentId(newId);
    setMessages([]);
    localStorage.setItem("currentConversationId", newId);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) =>
        prev.filter((c) => c.conversationId !== id)
      );
      if (currentId === id) {
        setCurrentId(null);
        setMessages([]);
        localStorage.removeItem("currentConversationId");
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  }, [currentId]);

  const handleRename = useCallback(async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === id ? { ...c, title } : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to rename", err);
    }
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="app-container">
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        onSelect={setCurrentId}
        onNew={createNewConversation}
        onDelete={handleDelete}
        onRename={handleRename}
        isLoading={loadingConvs}
      />

      <main className="main-panel">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-inner">
            <Bot className="header-icon" size={20} />
            <span className="header-title">
              {currentId
                ? conversations.find((c) => c.conversationId === currentId)?.title ?? "New Conversation"
                : "AIChat"}
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="messages-area">
          {!currentId && !hasMessages ? (
            <div className="welcome-screen">
              <div className="welcome-icon">✦</div>
              <h1 className="welcome-title">Welcome to AIChat</h1>
              <p className="welcome-sub">
                Your AI-powered assistant. Start a conversation below.
              </p>
              <div className="welcome-grid">
                {[
                  "Explain quantum computing",
                  "Write a Python web scraper",
                  "Summarize this article for me",
                  "Help me debug my code",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    className="suggestion-card"
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : loadingMsgs ? (
            <div className="messages-loading">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`skeleton-msg ${i % 2 === 0 ? "right" : "left"}`}
                />
              ))}
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {sending && (
                <div className="message-row assistant-row">
                  <div className="avatar assistant-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="bubble assistant-bubble typing-bubble">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} sending={sending} />
      </main>
    </div>
  );
}
