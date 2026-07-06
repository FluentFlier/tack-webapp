import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Bot, User, RotateCcw } from "lucide-react";
import React from "react";
import { renderMarkdown } from "@/lib/markdown";

interface ChatMessageProps {
  message: Message;
  onRetry?: (id: string) => void;
  loading?: boolean;
  /** When true the message entrance animation plays. False for pre-loaded history. */
  isNew?: boolean;
}

export function ChatMessage({ message, onRetry, loading, isNew }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const isFailed = message.failed === true;

  // Strip block-level markdown markers so the aria-label reads naturally
  // (e.g. "## Introduction" becomes "Introduction", "- item" becomes "item").
  const plainContent = message.content.replace(
    /^#{1,6}\s+|^[-*]\s+|^\d+\.\s+|\*\*/gm,
    ""
  );
  const ariaSnippet =
    plainContent.slice(0, 50) + (plainContent.length > 50 ? "..." : "");

  return (
    <div
      className={cn(
        "flex gap-3 px-6",
        isNew && "app-msg-enter",
        isAssistant ? "app-msg--assistant" : "app-msg--user",
        isFailed && "opacity-70"
      )}
      role="article"
      aria-label={`${isAssistant ? "Tack" : "You"}: ${ariaSnippet}`}
    >
      {/* Avatar dot — aria-hidden, purely decorative */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          isAssistant ? "app-msg__avatar--bot" : "app-msg__avatar--user"
        )}
        aria-hidden="true"
      >
        {isAssistant ? (
          <Bot className="h-4 w-4 text-white" aria-hidden="true" />
        ) : (
          <User className="h-4 w-4" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-hidden">
        <p
          className={cn(
            "app-msg__speaker",
            isAssistant ? "app-msg__speaker--bot" : "app-msg__speaker--user"
          )}
        >
          {isAssistant ? "Tack" : "You"}
        </p>

        <div className="max-w-none">
          {isAssistant ? (
            renderMarkdown(message.content)
          ) : (
            <p className="text-[0.9375rem] leading-[1.78] whitespace-pre-wrap text-foreground italic">
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
                disabled={loading}
                aria-label="Retry sending message"
                className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:text-[hsl(var(--accent-strong))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="text-[hsl(var(--primary))] underline underline-offset-2 hover:text-[hsl(var(--accent-strong))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-colors"
            >
              {message.metadata.source_url}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
