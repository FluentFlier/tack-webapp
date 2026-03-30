"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/types";
import { Sparkles } from "lucide-react";

interface ChatHistoryProps {
  messages: Message[];
  loading?: boolean;
}

export function ChatHistory({ messages, loading }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-6">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-2xl font-medium italic mb-3">Welcome to Tack</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Your accessible AI assistant for the web. Ask me anything or share a URL to get started.
          </p>
          <p className="text-sm text-muted-foreground/70">
            Type{" "}
            <kbd className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted border border-border text-xs font-mono text-foreground">
              /help
            </kbd>{" "}
            for available commands
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      <div className="max-w-3xl mx-auto py-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-3 px-6 py-5" role="status" aria-label="Tack is thinking">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="sr-only">Tack is thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
