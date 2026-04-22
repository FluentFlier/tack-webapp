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
    <div className="min-h-full bg-[var(--va-bg)] va-page">
      <ReadingGuide />
      <LiveRegion message={announcement} politeness="assertive" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome */}
        <section className="text-center space-y-2" aria-labelledby="welcome-heading">
          <h1
            id="welcome-heading"
            className="text-2xl sm:text-3xl font-bold text-white"
          >
            Welcome back,{" "}
            <span className="text-[var(--neon-cyan)]">User</span>
          </h1>
          <p className="text-sm text-white/50">
            Search for anything below or use voice commands
          </p>
        </section>

        {/* Search Bar */}
        <section aria-labelledby="search-heading" className="space-y-2">
          <h2 id="search-heading" className="sr-only">
            Search
          </h2>
          <div
            role="search"
            className={`
              relative flex items-center rounded-xl border bg-[hsl(220,20%,10%)]
              transition-all duration-300
              ${
                isListening
                  ? "border-[hsl(270,80%,65%)] shadow-[0_0_25px_hsl(270,80%,65%,0.3),0_0_50px_hsl(270,80%,65%,0.1)]"
                  : "border-[hsl(180,100%,50%,0.3)] shadow-[0_0_20px_hsl(180,100%,50%,0.1),0_0_40px_hsl(180,100%,50%,0.05)]"
              }
              focus-within:border-[hsl(180,100%,50%,0.5)] focus-within:shadow-[0_0_30px_hsl(180,100%,50%,0.2),0_0_60px_hsl(180,100%,50%,0.08)]
              va-search-glow
            `}
          >
            <Search
              className="h-5 w-5 text-white/30 ml-4 shrink-0"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for information... (Press Enter or use voice)"
              aria-label="Search for information"
              aria-describedby="search-hints"
              className="flex-1 bg-transparent px-3 py-4 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            <button
              onClick={handleVoice}
              aria-label={
                isListening ? "Stop voice search" : "Activate voice search"
              }
              className={`
                mr-2 flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-[hsl(180,100%,50%)] focus:ring-offset-2 focus:ring-offset-[hsl(220,20%,10%)]
                ${
                  isListening
                    ? "bg-[hsl(270,80%,65%)] text-white va-pulse-mic"
                    : "bg-[hsl(180,100%,50%)] text-[hsl(220,25%,6%)] hover:bg-[hsl(180,100%,60%)]"
                }
              `}
            >
              <Mic className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <p
            id="search-hints"
            className="text-center text-xs text-white/30 space-x-2"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 text-[10px] font-mono">
              Enter
            </kbd>
            <span>to search</span>
            <span className="text-white/15">|</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 text-[10px] font-mono">
              Esc
            </kbd>
            <span>to clear</span>
          </p>
        </section>

        {/* Accessibility Mode Buttons */}
        <AccessibilityModeButtons />

        {/* Quick Actions */}
        {!isFocusMode && (
          <section
            aria-labelledby="quick-actions-heading"
            className="space-y-4 secondary-section"
          >
            <h2
              id="quick-actions-heading"
              className="text-xs font-bold tracking-[0.2em] uppercase text-white/40"
            >
              Quick Actions
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  role="button"
                  tabIndex={0}
                  className="
                    va-card group flex flex-col items-center gap-2.5 p-4 rounded-xl
                    border border-white/[0.06] bg-white/[0.02]
                    hover:border-[hsl(180,100%,50%,0.25)] hover:bg-white/[0.04]
                    focus:outline-none focus:ring-2 focus:ring-[hsl(180,100%,50%)] focus:ring-offset-2 focus:ring-offset-[var(--va-bg)]
                    transition-all duration-200
                  "
                  aria-label={`Search ${action.label}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setQuery(action.label);
                      setAnnouncement(`Selected: ${action.label}`);
                    }
                  }}
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-[hsl(180,100%,50%,0.2)] bg-[hsl(180,100%,50%,0.05)] group-hover:bg-[hsl(180,100%,50%,0.1)] group-hover:border-[hsl(180,100%,50%,0.35)] transition-all duration-200">
                    <action.icon
                      className="h-5 w-5 text-[hsl(180,100%,50%)] group-hover:drop-shadow-[0_0_6px_hsl(180,100%,50%,0.5)]"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-white/60 group-hover:text-white/80 transition-colors text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Getting Started */}
        <section aria-labelledby="getting-started-heading" className="space-y-4">
          <div>
            <h2
              id="getting-started-heading"
              className="text-xl font-bold text-[var(--neon-cyan)] va-text-glow"
            >
              Getting Started
            </h2>
            <p className="text-sm text-white/40 mt-1">
              Welcome to VisionAccess, your accessible information portal.
              Search for anything and have it read aloud to you.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {GETTING_STARTED.map((item) => (
              <div
                key={item.title}
                className="
                  va-card p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]
                  hover:border-white/[0.12] hover:bg-white/[0.04]
                  transition-all duration-200 space-y-3
                "
              >
                <div
                  className="flex items-center justify-center h-9 w-9 rounded-lg"
                  style={{
                    background: `color-mix(in srgb, ${item.color} 12%, transparent)`,
                    borderColor: `color-mix(in srgb, ${item.color} 25%, transparent)`,
                    borderWidth: "1px",
                    borderStyle: "solid",
                  }}
                >
                  <item.icon
                    className="h-4 w-4"
                    style={{ color: item.color }}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/90">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
