"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Pencil, Trash2, Check, X, MessageSquare, Settings } from "lucide-react";

interface Conversation {
  conversationId: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  isLoading: boolean;
  onOpenSettings: () => void;
}

const Sidebar = memo(function Sidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  isLoading,
  onOpenSettings,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const startEdit = (conv: Conversation) => {
    setEditingId(conv.conversationId);
    setEditTitle(conv.title);
  };

  const confirmEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">✦</span>
          <span className="sidebar-logo-text">GuAI</span>
        </div>
        <button className="new-chat-btn" onClick={onNew}>
          <span>+</span>
          <span>New Chat</span>
        </button>
      </div>

      <div className="sidebar-section-label">Conversations</div>

      <nav className="conv-list">
        {isLoading ? (
          <div className="sidebar-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-item" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-sidebar">
            <MessageSquare size={32} className="empty-icon" />
            <p>No conversations yet</p>
            <span>Start a new chat!</span>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.conversationId}
              className={`conv-item ${currentId === conv.conversationId ? "active" : ""}`}
              onClick={() => onSelect(conv.conversationId)}
            >
              {editingId === conv.conversationId ? (
                <div
                  className="edit-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    ref={inputRef}
                    className="edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                  <button className="icon-btn confirm" onClick={confirmEdit}>
                    <Check size={14} />
                  </button>
                  <button className="icon-btn cancel" onClick={cancelEdit}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="conv-title">{conv.title}</span>
                  <div className="conv-actions">
                    <button
                      className="icon-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(conv);
                      }}
                      title="Rename"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.conversationId);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-settings-btn" onClick={onOpenSettings}>
          <Settings size={18} className="icon" />
          <span>Settings & Config</span>
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
