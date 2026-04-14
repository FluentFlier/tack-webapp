"use client";

import { useEffect, useRef } from "react";
import { ChatHistory, ChatInput } from "@/components/chat";
import { LiveRegion } from "@/components/a11y";
import { useChat } from "@/hooks/useChat";
//import { useVoice } from "@/hooks/useVoice";

//Note built in text to speech disabled on 4-14-2026 since it speaks even if a screen reader is in use

export default function ChatPage() {
  const { messages, loading, error, sendMessage } = useChat();
  //const { speak } = useVoice();
  const prevMessageCountRef = useRef(0);

  /*useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        speak(lastMessage.content.slice(0, 500));
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, speak]);*/

  return (
    <div className="flex flex-col h-full">
      <LiveRegion
        message={
          loading
            ? "Tack is thinking..."
            : error
              ? error
              : messages.length > 0
                ? `Tack responded: ${messages[messages.length - 1]?.content.slice(0, 100)}`
                : ""
        }
      />
      <ChatHistory messages={messages} loading={loading} />
      <ChatInput onSend={sendMessage} disabled={loading} />
      {error && (
        <p role="alert" className="px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
