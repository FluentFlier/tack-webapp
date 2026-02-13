"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/types";

interface ChatHistoryProps {
  messages: Message[];
  loading?: boolean;
}

export function ChatHistory({ messages, loading = false }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Welcome to Tack</h2>
          <p className="text-muted-foreground">
            Start a conversation or try a command like{" "}
            <kbd className="rounded border px-1.5 py-0.5 text-xs font-mono">
              /help
            </kbd>{" "}
            to see what I can do.
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
      aria-live="polite"
    >
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {loading && (
        <div className="flex gap-3 px-4 py-4 bg-muted/50" role="status">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-primary text-primary-foreground">
            <span className="animate-pulse text-xs" aria-hidden="true">
              ...
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
