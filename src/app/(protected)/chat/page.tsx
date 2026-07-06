"use client";

import { ChatHistory, ChatInput } from "@/components/chat";
import { LiveRegion } from "@/components/a11y";
import { useChat } from "@/hooks/useChat";

// Built-in text-to-speech was removed on 2026-04-14: it spoke over active screen readers.

export default function ChatPage() {
  const { messages, loading, error, sendMessage, retryMessage } = useChat();

  return (
    <div className="flex flex-col h-full">
      <LiveRegion
        message={
          loading
            ? "Tack is thinking..."
            : messages.length > 0
              ? `Tack responded: ${messages[messages.length - 1]?.content.slice(0, 100)}`
              : ""
        }
      />
      <ChatHistory messages={messages} loading={loading} onRetry={retryMessage} />
      <ChatInput onSend={sendMessage} disabled={loading} />
      {error && (
        <p role="alert" className="px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
