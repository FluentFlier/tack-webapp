import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Sparkles, User, ExternalLink } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const sources = message.metadata?.sources;

  return (
    <div
      className={cn(
        "flex gap-3 px-6 py-5 transition-colors",
        isAssistant && "bg-card/30"
      )}
      role="article"
      aria-label={`${isAssistant ? "Tack" : "You"}: ${message.content.slice(0, 50)}${message.content.length > 50 ? "..." : ""}`}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
          isAssistant
            ? "bg-primary/10 border-primary/20"
            : "bg-muted border-border"
        )}
        aria-hidden="true"
      >
        {isAssistant ? (
          <Sparkles className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 space-y-1.5 overflow-hidden min-w-0">
        <p className={cn(
          "text-sm font-medium",
          isAssistant ? "font-serif italic text-primary" : "text-muted-foreground"
        )}>
          {isAssistant ? "Tack" : "You"}
        </p>
        <div className="text-[0.9375rem] leading-relaxed">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5" aria-label="Sources">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sources</p>
            <ul className="list-none space-y-1">
              {sources.map((source: { title: string; url: string }, i: number) => (
                <li key={i}>
                  <a
                    href={`/reader?url=${encodeURIComponent(source.url)}`}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 focus:outline-none focus:ring-2 focus:ring-ring rounded transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {source.title || source.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!sources && message.metadata?.source_url && (
          <p className="text-xs text-muted-foreground mt-2">
            Source:{" "}
            <a
              href={`/reader?url=${encodeURIComponent(message.metadata.source_url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 focus:outline-none focus:ring-2 focus:ring-ring rounded"
            >
              {message.metadata.source_url}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
