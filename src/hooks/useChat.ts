"use client";

import { useState, useCallback } from "react";
import { parseCommand, COMMANDS } from "@/lib/commands";
import { parseSSEChunk } from "@/lib/sse";
import type { Message } from "@/types";

/** Stable id used while an assistant reply is being streamed. */
const STREAMING_ID = "streaming";

export function useChat(initialConversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * True from the first streamed token until the terminal event (done/error).
   * Use this to suppress the "Tack is thinking..." indicator once content is
   * flowing — the placeholder message in the message list serves that role.
   */
  const [streaming, setStreaming] = useState(false);
  /**
   * Live announcement text for the screen-reader LiveRegion.
   * Set to status messages from the server and key lifecycle strings
   * ("Response started", "Response complete"). Never set per token.
   */
  const [streamStatus, setStreamStatus] = useState("");

  const sendMessage = useCallback(
    async (input: string) => {
      setError(null);

      // ── Local-only slash commands ────────────────────────────────────────
      const parsed = parseCommand(input);

      if (parsed.isCommand && parsed.command) {
        if (parsed.command.name === "clear") {
          setMessages([]);
          setConversationId(undefined);
          window.history.pushState(null, "", "/chat");
          return;
        }

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

        if (parsed.command.requiresArgs && !parsed.args?.trim()) {
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

      // ── Optimistic user message ─────────────────────────────────────────
      const msgId = crypto.randomUUID();
      const userMessage: Message = {
        id: msgId,
        conversation_id: conversationId || "",
        role: "user",
        content: input,
        metadata: parsed.isCommand ? { command: parsed.command?.name } : {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setStreamStatus("");

      try {
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
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const contentType = response.headers.get("Content-Type") ?? "";

        if (contentType.includes("text/event-stream") && response.body) {
          // ── SSE streaming path ──────────────────────────────────────────
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let firstToken = true;
          // Tracks whether a done/error event arrived before the stream closed.
          // If the server closes the connection without one, we surface an error.
          let receivedTerminalEvent = false;

          // Add a placeholder streaming message (grows as tokens arrive).
          const streamingMsg: Message = {
            id: STREAMING_ID,
            conversation_id: conversationId || "",
            role: "assistant",
            content: "",
            metadata: {},
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, streamingMsg]);

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const result = parseSSEChunk(text, buffer);
            buffer = result.buffer;

            for (const evt of result.events) {
              if (evt.event === "token") {
                const payload = JSON.parse(evt.data) as { delta: string };
                if (firstToken) {
                  firstToken = false;
                  setStreaming(true);
                  // Announce response start once — not on every token.
                  setStreamStatus("Response started");
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === STREAMING_ID
                      ? { ...m, content: m.content + payload.delta }
                      : m,
                  ),
                );
              } else if (evt.event === "status") {
                const payload = JSON.parse(evt.data) as { message: string };
                // Status events (e.g. "Fetching page...") are safe to announce.
                setStreamStatus(payload.message);
              } else if (evt.event === "done") {
                const payload = JSON.parse(evt.data) as {
                  message: Message;
                  conversation_id: string;
                };
                // Replace the streaming placeholder with the persisted row.
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === STREAMING_ID ? payload.message : m,
                  ),
                );
                if (!conversationId) {
                  setConversationId(payload.conversation_id);
                  window.history.pushState(
                    null,
                    "",
                    `/chat/${payload.conversation_id}`,
                  );
                  window.dispatchEvent(new CustomEvent("sidebar:refresh"));
                }
                setStreamStatus("Response complete");
                receivedTerminalEvent = true;
                setStreaming(false);
              } else if (evt.event === "error") {
                const payload = JSON.parse(evt.data) as { error: string };
                // Remove the streaming placeholder and mark user msg failed.
                setMessages((prev) =>
                  prev
                    .filter((m) => m.id !== STREAMING_ID)
                    .map((m) =>
                      m.id === msgId ? { ...m, failed: true } : m,
                    ),
                );
                setError(payload.error || "Failed to send message. Please try again.");
                setStreamStatus("");
                receivedTerminalEvent = true;
                setStreaming(false);
              }
            }
          }

          // If the stream closed without a done/error event, the connection
          // dropped mid-reply. Remove the placeholder and surface an error.
          if (!receivedTerminalEvent) {
            setMessages((prev) =>
              prev
                .filter((m) => m.id !== STREAMING_ID)
                .map((m) => (m.id === msgId ? { ...m, failed: true } : m)),
            );
            setError("Connection closed unexpectedly. Please try again.");
            setStreamStatus("");
            setStreaming(false);
          }
        } else {
          // ── JSON fallback path (old clients / SSE unavailable) ──────────
          const data = (await response.json()) as {
            message: Message;
            conversation_id: string;
          };

          if (!conversationId) {
            setConversationId(data.conversation_id);
            window.history.pushState(null, "", `/chat/${data.conversation_id}`);
            window.dispatchEvent(new CustomEvent("sidebar:refresh"));
          }

          setMessages((prev) => [...prev, data.message]);
        }
      } catch {
        // Network failure — mark the optimistic message as failed.
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== STREAMING_ID)
            .map((m) => (m.id === msgId ? { ...m, failed: true } : m)),
        );
        setError("Failed to send message. Please try again.");
        setStreamStatus("");
      } finally {
        setLoading(false);
        // Safety net: ensure streaming resets even if a terminal handler was skipped.
        setStreaming(false);
      }
    },
    [conversationId],
  );

  // Retry a failed message: remove the failed copy then re-send the same content
  const retryMessage = useCallback(
    async (id: string) => {
      const msg = messages.find((m) => m.id === id);
      if (!msg) return;
      setMessages((prev) => prev.filter((m) => m.id !== id));
      await sendMessage(msg.content);
    },
    [messages, sendMessage],
  );

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`);
      if (!response.ok) {
        setError("Failed to load conversation.");
        return;
      }
      const data = (await response.json()) as { messages: Message[] };
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
    /** True from the first token until the terminal SSE event (done/error). */
    streaming,
    /** Stable id of the in-flight streaming message, or null when not streaming. */
    streamingMessageId: messages.some((m) => m.id === STREAMING_ID)
      ? STREAMING_ID
      : null,
    /** Text to surface via LiveRegion (status, lifecycle events). Never per-token. */
    streamStatus,
    sendMessage,
    retryMessage,
    loadMessages,
  };
}
