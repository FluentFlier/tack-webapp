"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * ThemeToggle — toggles between light and dark themes.
 *
 * - Real <button>, keyboard-operable.
 * - aria-pressed conveys current dark-mode state to AT.
 * - aria-label "Dark mode" is a fixed accessible name; the visible label
 *   shows what you'll switch TO (e.g. "Dark" in light, "Light" in dark).
 * - Mounted guard prevents SSR hydration mismatch.
 * - Pill shape with icon + text to match editorial header treatment.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical one-shot SSR mount guard
  useEffect(() => setMounted(true), []);

  // Render a size-matched placeholder to prevent layout shift during SSR
  if (!mounted) {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-[30px] w-[68px] rounded-full border border-[hsl(var(--border))] opacity-0"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Dark mode"
      aria-pressed={isDark}
      className={[
        "inline-flex items-center gap-1.5",
        "px-3 py-1",
        "rounded-full",
        "border border-[hsl(var(--border))]",
        "bg-transparent",
        "text-[hsl(var(--muted-foreground))]",
        "text-xs font-medium tracking-wide",
        "whitespace-nowrap",
        "cursor-pointer",
        "transition-colors duration-150",
        "hover:bg-[hsl(var(--primary)_/_0.06)] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1",
        "focus-visible:ring-offset-[hsl(var(--background))]",
      ].join(" ")}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
