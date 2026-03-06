"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Mic, MicOff } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { useVoice } from "@/hooks/useVoice";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
    if (text.trim()) {
      onSend(text.trim());
      setInput("");
    }
  }, [onSend]);

  const { isListening, supported, startListening, stopListening } = useVoice({
    onTranscript: handleVoiceTranscript,
  });

  // Hotkey: Alt+V to toggle voice
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === "v") {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening, startListening, stopListening]);

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
    <div className="border-t border-border/50 p-4 bg-background/50 backdrop-blur-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="relative flex items-end gap-2 max-w-3xl mx-auto"
      >
        <CommandPalette
          filter={commandFilter}
          onSelect={handleCommandSelect}
          visible={showCommands}
        />
        <label htmlFor="chat-input" className="sr-only">
          Type your message or a slash command
        </label>
        <Textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Ask anything or paste a URL..."}
          disabled={disabled || isListening}
          rows={1}
          className="min-h-[48px] max-h-32 resize-none rounded-xl bg-card border-border/60 focus:border-primary/40 text-[0.9375rem] placeholder:text-muted-foreground/60"
          aria-describedby="input-hint"
        />
        <span id="input-hint" className="sr-only">
          Press Enter to send, Shift+Enter for a new line. Type / for commands.
          {supported && " Press Alt+V to use voice input."}
        </span>
        {supported && (
          <Button
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            onClick={() => (isListening ? stopListening() : startListening())}
            aria-label={isListening ? "Stop listening" : "Start voice input (Alt+V)"}
            className="shrink-0 h-[48px] w-[48px] rounded-xl"
          >
            {isListening ? (
              <MicOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Mic className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !input.trim()}
          aria-label="Send message"
          className="shrink-0 h-[48px] w-[48px] rounded-xl"
        >
          <SendHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
