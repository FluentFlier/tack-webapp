"use client";

import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { AccessibilityPanel } from "@/components/a11y/AccessibilityPanel";
import { LiveRegion } from "@/components/a11y/LiveRegion";
import {
  Volume2,
  VolumeX,
  Accessibility,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export function Header() {
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [a11yPanelOpen, setA11yPanelOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const toggleTTS = () => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    setAnnouncement(`Text to speech ${next ? "enabled" : "disabled"}`);

    if (!next) {
      window.speechSynthesis?.cancel();
    }
  };

  return (
    <>
      <LiveRegion message={announcement} politeness="assertive" />

      <header
        role="banner"
        className="sticky top-0 z-40 border-b border-[hsl(180,100%,50%,0.1)] bg-[hsl(220,25%,6%,0.85)] backdrop-blur-xl"
      >
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[hsl(180,100%,50%)] focus:ring-offset-2 focus:ring-offset-[hsl(220,25%,6%)] rounded-sm"
            aria-label="VisionAccess - Home"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[hsl(180,100%,50%,0.1)] border border-[hsl(180,100%,50%,0.2)]">
              <Sparkles
                className="h-4 w-4 text-[hsl(180,100%,50%)]"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-wide text-white leading-tight">
                Vision<span className="text-[hsl(180,100%,50%)]">Access</span>
              </span>
              <span className="text-[10px] tracking-[0.15em] uppercase text-white/40 font-mono leading-tight">
                Accessible Information Portal
              </span>
            </div>
          </Link>

          {/* Right controls */}
          <nav aria-label="Main navigation" className="flex items-center gap-1.5">
            {/* TTS Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTTS}
              aria-pressed={ttsEnabled}
              className={`gap-2 text-xs font-medium transition-all rounded-lg px-3 ${
                ttsEnabled
                  ? "bg-[hsl(180,100%,50%,0.12)] text-[hsl(180,100%,50%)] border border-[hsl(180,100%,50%,0.3)]"
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {ttsEnabled ? (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )}
              TTS: {ttsEnabled ? "ON" : "OFF"}
            </Button>

            {/* Accessibility Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setA11yPanelOpen(true)}
              aria-label="Open accessibility settings"
              className="gap-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg px-3 border border-transparent"
            >
              <Accessibility className="h-4 w-4" aria-hidden="true" />
              Accessibility
            </Button>

            {/* Help */}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Help"
              className="gap-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg px-3 border border-transparent"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Help
            </Button>

            {/* Auth */}
            <SignedIn>
              <div className="ml-2 pl-2 border-l border-white/10">
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <Button
                  size="sm"
                  className="ml-2 bg-[hsl(180,100%,50%)] text-[hsl(220,25%,6%)] hover:bg-[hsl(180,100%,60%)] font-semibold"
                >
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
          </nav>
        </div>
      </header>

      {/* Accessibility Panel (modal) */}
      <AccessibilityPanel
        open={a11yPanelOpen}
        onOpenChange={setA11yPanelOpen}
      />
    </>
  );
}
