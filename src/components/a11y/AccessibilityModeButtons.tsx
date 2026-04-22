"use client";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { LiveRegion } from "@/components/a11y/LiveRegion";
import { ACCESSIBILITY_MODES } from "@/types/accessibility";
import type { AccessibilityMode } from "@/types/accessibility";
import { Eye, Palette, BookOpen, Brain, Sparkles } from "lucide-react";
import { useState } from "react";

const ICON_MAP: Record<string, React.ElementType> = {
  Eye,
  Palette,
  BookOpen,
  Brain,
};

export function AccessibilityModeButtons() {
  const a11y = useAccessibility();
  const [announcement, setAnnouncement] = useState("");

  const handleToggle = (mode: AccessibilityMode, label: string) => {
    a11y.toggleMode(mode);
    const wasActive = a11y.isModeActive(mode);
    setAnnouncement(
      `${label} mode ${wasActive ? "deactivated" : "activated"}`
    );
  };

  return (
    <section aria-labelledby="a11y-modes-heading" className="w-full">
      <LiveRegion message={announcement} politeness="assertive" />
      <h2
        id="a11y-modes-heading"
        className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--neon-cyan)] mb-4 flex items-center gap-2"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        User Accessibility
      </h2>
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        role="group"
        aria-label="Accessibility mode toggles"
      >
        {ACCESSIBILITY_MODES.map((mode) => {
          const IconComp = ICON_MAP[mode.icon] || Sparkles;
          const isActive = a11y.isModeActive(mode.id);

          return (
            <button
              key={mode.id}
              id={`a11y-mode-${mode.id}`}
              role="switch"
              aria-checked={isActive}
              aria-label={`${mode.label} mode: ${isActive ? "on" : "off"}. ${mode.description}`}
              onClick={() => handleToggle(mode.id, mode.label)}
              className="a11y-mode-btn group relative"
              data-active={isActive || undefined}
              style={
                {
                  "--mode-color": mode.activeColor,
                } as React.CSSProperties
              }
            >
              {/* Glow backdrop (active only) */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-xl opacity-20 blur-md pointer-events-none"
                  style={{ background: mode.activeColor }}
                  aria-hidden="true"
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-2 py-4 px-3">
                <div
                  className={`
                    flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-200
                    ${
                      isActive
                        ? "bg-[var(--mode-color)]/20 border border-[var(--mode-color)]/40 shadow-[0_0_15px_var(--mode-color)/0.3]"
                        : "bg-white/5 border border-white/10 group-hover:border-white/20 group-hover:bg-white/8"
                    }
                  `}
                >
                  <IconComp
                    className={`h-6 w-6 transition-colors duration-200 ${
                      isActive
                        ? "text-[var(--mode-color)]"
                        : "text-white/50 group-hover:text-white/70"
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <span
                  className={`text-sm font-semibold tracking-wide transition-colors duration-200 ${
                    isActive
                      ? "text-[var(--mode-color)]"
                      : "text-white/70 group-hover:text-white/90"
                  }`}
                >
                  {mode.label}
                </span>
                {isActive && (
                  <span
                    className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                    style={{
                      background: `color-mix(in srgb, ${mode.activeColor} 20%, transparent)`,
                      color: mode.activeColor,
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
