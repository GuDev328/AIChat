"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  ChangeEvent,
  KeyboardEvent,
  DragEvent,
  ClipboardEvent,
} from "react";
import { Send, Square, ImagePlus, X } from "lucide-react";

export interface AttachedImage {
  base64: string;
  mimeType: string;
  preview: string; // object URL for preview
}

interface ChatInputProps {
  onSend: (message: string, images?: AttachedImage[]) => void;
  sending: boolean;
  onCancel: () => void;
  focusSignal?: number;
}

const MAX_TEXTAREA_HEIGHT = 160;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

function fileToAttachedImage(file: File): Promise<AttachedImage> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error(`Unsupported image type: ${file.type}`));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error(`Image too large (max 5MB): ${file.name}`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // dataUrl = "data:image/png;base64,xxxx"
      const base64 = dataUrl.split(",")[1];
      resolve({
        base64,
        mimeType: file.type,
        preview: URL.createObjectURL(file),
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({
  onSend,
  sending,
  onCancel,
  focusSignal = 0,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  };

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) =>
      ALLOWED_TYPES.includes(f.type),
    );
    if (fileArr.length === 0) return;

    try {
      const newImages = await Promise.all(fileArr.map(fileToAttachedImage));
      setImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      console.error("Failed to process images:", err);
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && images.length === 0) || sending) return;

    onSend(trimmed, images.length > 0 ? images : undefined);
    setInput("");
    // Cleanup preview URLs
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Paste image from clipboard
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    },
    [addFiles],
  );

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        addFiles(files);
      }
    },
    [addFiles],
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
        e.target.value = ""; // reset so same file can be selected again
      }
    },
    [addFiles],
  );

  useEffect(() => {
    resizeTextarea();
  }, [input]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [focusSignal]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInputEmpty = input.trim().length === 0 && images.length === 0;

  return (
    <div
      className={`input-area ${isDragging ? "input-area-dragging" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-overlay-content">
            <ImagePlus size={25} />
            <span>Drop images here</span>
          </div>
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="image-preview-strip">
          {images.map((img, idx) => (
            <div key={idx} className="image-preview-item">
              <img src={img.preview} alt={`Attached ${idx + 1}`} />
              <button
                className="image-preview-remove"
                onClick={() => removeImage(idx)}
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="input-box">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          aria-label="Attach image"
          title="Attach image"
        >
          <ImagePlus size={18} />
        </button>

        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Message GuAI"
          rows={1}
          disabled={sending}
        />

        <button
          type="button"
          className={`send-btn ${sending ? "cancel" : isInputEmpty ? "disabled" : ""}`}
          onClick={sending ? onCancel : handleSend}
          disabled={!sending && isInputEmpty}
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
