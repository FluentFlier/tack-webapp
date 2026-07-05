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
        // /clear — local only
        if (parsed.command.name === "clear") {
          setMessages([]);
          setConversationId(undefined);
          // Fix: clear the URL so refresh doesn't reload the old conversation
          window.history.pushState(null, "", "/chat");
          return;
        }

        // /help — local only
        if (parsed.command.name === "help") {
          const userMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "user",
            content: input,
            metadata: { command: "help" },
            created_at: new Date().toISOString(),
          };
          const assistantMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "assistant",
            content: `Available commands:\n\n${COMMANDS.map((cmd) => `${cmd.usage} — ${cmd.description}`).join("\n")}`,
            metadata: { command: "help" },
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, userMsg, assistantMsg]);
          return;
        }

        // Server commands — validate args before sending
        if (parsed.command.requiresArgs && !parsed.args?.trim()) {
          // Show the usage error as a local assistant-style message
          const userMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "user",
            content: input,
            metadata: { command: parsed.command.name },
            created_at: new Date().toISOString(),
          };
          const errorMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "assistant",
            content:
              parsed.command.argError || `Usage: ${parsed.command.usage}`,
            metadata: { command: parsed.command.name },
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, userMsg, errorMsg]);
          return;
        }
      }

      // Add optimistic user message — keep original input as content
      const msgId = crypto.randomUUID();
      const userMessage: Message = {
        id: msgId,
        conversation_id: conversationId || "",
        role: "user",
        content: input, // original input, NOT rewritten
        metadata: parsed.isCommand ? { command: parsed.command?.name } : {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        // Build request body: include command + args when a server command was parsed
        const requestBody: {
          message: string;
          conversation_id?: string;
          command?: string;
          args?: string;
        } = {
          message: input,
          conversation_id: conversationId,
        };

        if (
          parsed.isCommand &&
          parsed.command &&
          !["help", "clear"].includes(parsed.command.name)
        ) {
          requestBody.command = parsed.command.name as
            | "summarize"
            | "read"
            | "search";
          requestBody.args = parsed.args || "";
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        if (!conversationId) {
          setConversationId(data.conversation_id);
          // Update URL without full navigation
          window.history.pushState(null, "", `/chat/${data.conversation_id}`);
          window.dispatchEvent(new CustomEvent("sidebar:refresh"));
        }

        setMessages((prev) => [...prev, data.message]);
      } catch {
        // Mark the optimistic message as failed — do NOT remove it
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, failed: true } : m))
        );
        setError("Failed to send message. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  // Retry a failed message: remove the failed copy then re-send the same content
  const retryMessage = useCallback(
    async (id: string) => {
      const msg = messages.find((m) => m.id === id);
      if (!msg) return;
      // Remove the failed message before re-sending so the list stays clean
      setMessages((prev) => prev.filter((m) => m.id !== id));
      await sendMessage(msg.content);
    },
    [messages, sendMessage]
  );

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`);
      if (!response.ok) {
        setError("Failed to load conversation.");
        return;
      }
      const data = await response.json();
      setMessages(data.messages || []);
      setConversationId(convId);
    } catch {
      setError("Failed to load conversation.");
    }
  }, []);

  return {
    messages,
    conversationId,
    loading,
    error,
    sendMessage,
    retryMessage,
    loadMessages,
  };
}
