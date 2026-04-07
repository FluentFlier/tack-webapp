"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Mic,
  Newspaper,
  Cloud,
  BookOpen,
  Heart,
  Cpu,
  GraduationCap,
  Volume2,
  MicIcon,
  Zap,
  Accessibility,
  History,
  Keyboard,
} from "lucide-react";
import { AccessibilityModeButtons } from "@/components/a11y/AccessibilityModeButtons";
import { ReadingGuide } from "@/components/a11y/ReadingGuide";
import { LiveRegion } from "@/components/a11y/LiveRegion";
import { useAccessibility } from "@/contexts/AccessibilityContext";

const QUICK_ACTIONS = [
  { label: "Latest News", icon: Newspaper },
  { label: "Weather", icon: Cloud },
  { label: "Tutorials", icon: BookOpen },
  { label: "Health Info", icon: Heart },
  { label: "Technology", icon: Cpu },
  { label: "Education", icon: GraduationCap },
];

const GETTING_STARTED = [
  {
    icon: Volume2,
    title: "Text-to-Speech",
    desc: 'Click "TTS" in the header to have all content read aloud.',
    color: "hsl(180, 100%, 50%)",
  },
  {
    icon: MicIcon,
    title: "Voice Search",
    desc: "Click the microphone and speak your search query.",
    color: "hsl(270, 80%, 65%)",
  },
  {
    icon: Zap,
    title: "Quick Actions",
    desc: "Use category buttons above for instant topic searches.",
    color: "hsl(150, 80%, 50%)",
  },
  {
    icon: Accessibility,
    title: "Full Accessibility",
    desc: "4 specialized modes for different needs. Click to customize.",
    color: "hsl(30, 90%, 55%)",
  },
  {
    icon: History,
    title: "Search History",
    desc: "Recent searches are saved below for quick re-access.",
    color: "hsl(210, 100%, 60%)",
  },
  {
    icon: Keyboard,
    title: "Keyboard Friendly",
    desc: "Tab to navigate, Enter to search, Escape to close panels.",
    color: "hsl(330, 80%, 60%)",
  },
];

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isModeActive } = useAccessibility();
  const isFocusMode = isModeActive("adhd");

  const handleSearch = () => {
    if (!query.trim()) return;
    setAnnouncement(`Searching for: ${query}`);
    // Search logic would go here
  };

  const handleVoice = () => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAnnouncement("Voice search is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new (SpeechRecognition as new () => SpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setQuery(transcript);
      setAnnouncement(`Voice input received: ${transcript}`);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setAnnouncement("Voice search error. Please try again.");
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
    setAnnouncement("Listening for voice input...");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
