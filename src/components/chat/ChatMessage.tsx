import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Bot, User, RotateCcw } from "lucide-react";
import React from "react";
import { renderMarkdown } from "@/lib/markdown";

interface ChatMessageProps {
  message: Message;
  onRetry?: (id: string) => void;
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const isFailed = message.failed === true;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4",
        isAssistant && "app-msg--assistant",
        isFailed && "opacity-70"
      )}
      role="article"
      aria-label={`${isAssistant ? "Tack" : "You"}: ${message.content.slice(0, 50)}${message.content.length > 50 ? "..." : ""}`}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isAssistant ? "app-msg__avatar--bot" : "app-msg__avatar--user"
        )}
        aria-hidden="true"
      >
        {isAssistant ? (
          <Bot className="h-4 w-4 text-white" />
        ) : (
          <User className="h-4 w-4 text-[rgba(240,237,237,0.6)]" />
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        <p className="text-sm font-medium text-[rgba(240,237,237,0.85)]">
          {isAssistant ? "Tack" : "You"}
        </p>
        <div className="max-w-none">
          {isAssistant ? (
            renderMarkdown(message.content)
          ) : (
            <p className="text-sm whitespace-pre-wrap text-[rgba(240,237,237,0.72)]">
              {message.content}
            </p>
          )}
        </div>
        {isFailed && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-destructive" role="alert">
              Failed to send
            </span>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                aria-label="Retry sending message"
                className="flex items-center gap-1 text-xs text-[hsl(255,60%,70%)] hover:text-[hsl(255,60%,80%)] focus:outline-none focus:ring-2 focus:ring-ring rounded transition-colors"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Retry
              </button>
            )}
          </div>
        )}
        {message.metadata?.source_url && (
          <p className="text-xs text-muted-foreground mt-2">
            Source:{" "}
            <a
              href={message.metadata.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(255,60%,70%)] underline focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {message.metadata.source_url}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
