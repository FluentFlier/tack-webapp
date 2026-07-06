"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/types";

interface ChatHistoryProps {
  messages: Message[];
  loading?: boolean;
  /**
   * True while SSE tokens are flowing (first token → terminal event).
   * When streaming, the "Tack is thinking..." indicator is hidden because
   * the growing placeholder message already shows progress.
   */
  streaming?: boolean;
  onRetry?: (id: string) => void;
  /**
   * The id of the message currently being streamed in (e.g. "streaming").
   * That message is wrapped in `aria-live="off"` to prevent screen readers
   * from announcing every incremental token update. Once streaming ends and
   * the placeholder is replaced by the persisted server row, normal log
   * semantics resume.
   */
  streamingMessageId?: string | null;
}

export function ChatHistory({
  messages,
  loading = false,
  streaming = false,
  onRetry,
  streamingMessageId,
}: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="app-chat-welcome text-2xl mb-3">Welcome to Tack</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Start a conversation or try a command like{" "}
            <kbd className="app-kbd rounded px-1.5 py-0.5 text-xs font-mono">
              /help
            </kbd>{" "}
            to see what I can do.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed font-bold">
            Note: The AI features may make mistakes and provide incorrect information, do not blindly trust these features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      role="log"
      aria-label="Chat messages"
    >
      {messages.map((msg) =>
        msg.id === streamingMessageId ? (
          // Suppress per-token announcements while streaming. The full message
          // is announced once via the LiveRegion when streaming completes.
          <div key={msg.id} aria-live="off">
            <ChatMessage message={msg} onRetry={onRetry} loading={loading} />
          </div>
        ) : (
          <ChatMessage key={msg.id} message={msg} onRetry={onRetry} loading={loading} />
        ),
      )}
      {loading && !streaming && (
        <div className="app-chat-thinking flex gap-3 px-4 py-4" role="status">
          <div className="app-msg__avatar--bot flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <span className="app-chat-thinking__dot animate-pulse text-xs" aria-hidden="true">
              •••
            </span>
          </div>
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground">Tack is thinking...</p>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
