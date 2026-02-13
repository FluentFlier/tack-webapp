"use client";

import { useState, useCallback } from "react";
import { parseCommand, COMMANDS } from "@/lib/commands";
import type { Message } from "@/types";

export function useChat(initialConversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (input: string) => {
      setError(null);

      // Check for slash commands
      const parsed = parseCommand(input);

      if (parsed.isCommand && parsed.command) {
        const result = parsed.command.execute(parsed.args || "");

        // Handle local-only commands
        if (result === "__COMMAND__:clear") {
          setMessages([]);
          setConversationId(undefined);
          return;
        }

        // Handle /help command locally
        if (parsed.command.name === "help") {
          const helpId = crypto.randomUUID();
          const userMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "user",
            content: input,
            metadata: { command: "help" },
            created_at: new Date().toISOString(),
          };
          const assistantMsg: Message = {
            id: helpId,
            conversation_id: conversationId || "",
            role: "assistant",
            content: `Available commands:\n\n${COMMANDS.map((cmd) => `${cmd.usage} — ${cmd.description}`).join("\n")}`,
            metadata: { command: "help" },
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, userMsg, assistantMsg]);
          return;
        }

        // For commands that need AI processing, modify the message
        if (result.startsWith("__COMMAND__:summarize:")) {
          const url = result.replace("__COMMAND__:summarize:", "");
          input = `Please summarize the content at this URL: ${url}`;
        } else if (result.startsWith("__COMMAND__:read:")) {
          const url = result.replace("__COMMAND__:read:", "");
          input = `Please read and simplify the content at this URL: ${url}`;
        }
      }

      // Add optimistic user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || "",
        role: "user",
        content: input,
        metadata: parsed.isCommand ? { command: parsed.command?.name } : {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: input,
            conversation_id: conversationId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        if (!conversationId) {
          setConversationId(data.conversation_id);
          // Update URL without full navigation
          window.history.pushState(null, "", `/chat/${data.conversation_id}`);
        }

        setMessages((prev) => [...prev, data.message]);
      } catch (err) {
        setError("Failed to send message. Please try again.");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const loadMessages = useCallback(async (convId: string) => {
    const response = await fetch(`/api/conversations/${convId}/messages`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages || []);
      setConversationId(convId);
    }
  }, []);

  return {
    messages,
    conversationId,
    loading,
    error,
    sendMessage,
    loadMessages,
  };
}
