"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { SlashCommandButtons } from "./SlashCommandButtons";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    setShowCommands(false);
    textareaRef.current?.focus();
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommands(true);
      setCommandFilter(value.slice(1));
    } else {
      setShowCommands(false);
    }
  };

  const handleCommandSelect = (command: string) => {
    setInput(command);
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="app-chat-input-area">
      {/* Relative wrapper so CommandPalette can position absolute above input */}
      <div className="relative max-w-[740px] mx-auto">
        {/* Command palette — absolute, appears above input row when typing "/" */}
        <CommandPalette
          filter={commandFilter}
          onSelect={handleCommandSelect}
          visible={showCommands}
        />

        {/* Input row: bordered container wrapping textarea + send button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="app-chat-input-row"
        >
          <label htmlFor="chat-input" className="sr-only">
            Type your message or a slash command
          </label>
          <Textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Tack, or type / for commands"
            disabled={disabled}
            rows={1}
            className="app-chat-textarea min-h-[44px] max-h-32 resize-none"
            aria-describedby="input-hint"
          />
          <span id="input-hint" className="sr-only">
            Press Enter to send, Shift+Enter for a new line. Type / for commands.
          </span>
          <Button
            type="submit"
            disabled={disabled || !input.trim()}
            aria-label="Send message"
            className="app-send-btn"
          >
            <SendHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Send</span>
          </Button>
        </form>

        {/* Quick-access slash command chips — below the input row */}
        {!showCommands && (
          <SlashCommandButtons
            onSelect={handleCommandSelect}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
