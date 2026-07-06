"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatHistory, ChatInput } from "@/components/chat";
import { LiveRegion } from "@/components/a11y";
import { useChat } from "@/hooks/useChat";

// Built-in text-to-speech was removed on 2026-04-14: it spoke over active screen readers.

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const {
    messages,
    loading,
    error,
    sendMessage,
    loadMessages,
    retryMessage,
    streaming,
    streamingMessageId,
    streamStatus,
  } = useChat(conversationId);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId, loadMessages]);

  return (
    <div className="flex flex-col h-full">
      <LiveRegion
        message={
          streamStatus
            ? streamStatus
            : loading
              ? "Tack is thinking..."
              : ""
        }
      />
      <ChatHistory
        messages={messages}
        loading={loading}
        streaming={streaming}
        onRetry={retryMessage}
        streamingMessageId={streamingMessageId}
      />
      <ChatInput onSend={sendMessage} disabled={loading} />
      {error && (
        <p role="alert" className="px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
