import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4",
        isAssistant && "bg-muted/50"
      )}
      role="article"
      aria-label={`${isAssistant ? "Tack" : "You"}: ${message.content.slice(0, 50)}${message.content.length > 50 ? "..." : ""}`}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          isAssistant ? "bg-primary text-primary-foreground" : "bg-background"
        )}
        aria-hidden="true"
      >
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <p className="text-sm font-medium">
          {isAssistant ? "Tack" : "You"}
        </p>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.metadata?.source_url && (
          <p className="text-xs text-muted-foreground">
            Source:{" "}
            <a
              href={message.metadata.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {message.metadata.source_url}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
