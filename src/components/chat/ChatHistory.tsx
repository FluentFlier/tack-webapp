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
          <h2 className="app-chat-welcome text-2xl mb-3">Welcome to Tack</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Start a conversation or try a command like{" "}
            <kbd className="app-kbd rounded px-1.5 py-0.5 text-xs font-mono">
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
