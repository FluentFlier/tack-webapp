"use client";

import { useEffect, useRef, useState } from "react";
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
  /**
   * Records how many messages existed in the first non-empty render so that
   * pre-loaded history messages are not animated. Any message with an index
   * at or above this count (appended after the initial load) is treated as new.
   * Stays null until the first non-empty messages array arrives.
   *
   * The conversation page passes key={conversationId}, so this component
   * remounts (and this count resets) whenever the user switches conversations
   * — history from a newly opened conversation never animates.
   */
  const [initialCount, setInitialCount] = useState<number | null>(null);

  // Capture the settled initial count once — never overwrite after that.
  useEffect(() => {
    if (initialCount === null && messages.length > 0) {
      setInitialCount(messages.length);
    }
  }, [initialCount, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="app-chat-welcome text-3xl mb-4">Welcome to Tack</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Start a conversation or try a command like{" "}
            <kbd className="app-kbd rounded px-1.5 py-0.5 text-xs font-mono">
              /help
            </kbd>{" "}
            to see what I can do.
          </p>
          <p className="mt-5 rounded-xl border border-[rgba(79,70,229,0.28)] bg-[rgba(79,70,229,0.07)] px-4 py-3 text-left text-xs leading-relaxed text-[rgba(240,244,255,0.72)]">
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
      {messages.map((msg, index) => {
        const isNew = initialCount !== null && index >= initialCount;
        return msg.id === streamingMessageId ? (
          // Suppress per-token announcements while streaming. The full message
          // is announced once via the LiveRegion when streaming completes.
          <div key={msg.id} aria-live="off">
            <ChatMessage message={msg} onRetry={onRetry} loading={loading} isNew={isNew} />
          </div>
        ) : (
          <ChatMessage key={msg.id} message={msg} onRetry={onRetry} loading={loading} isNew={isNew} />
        );
      })}
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
