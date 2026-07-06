"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * ThemeToggle — toggles between light and dark themes.
 *
 * - Real <button>, keyboard-operable.
 * - Fixed aria-label "Dark mode" + aria-pressed conveys current state to AT.
 * - Mounted guard prevents SSR hydration mismatch (server always renders a
 *   size-matched placeholder until the client has read the stored preference).
 * - Visible focus ring via CSS :focus-visible (ring token).
 * - Sun icon = currently dark, click to go light.
 * - Moon icon = currently light, click to go dark.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical one-shot SSR mount guard
  useEffect(() => setMounted(true), []);

  if (!mounted) return <span className="h-8 w-8" aria-hidden="true" />;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Dark mode"
      aria-pressed={isDark}
      className={[
        "inline-flex items-center justify-center",
        "h-8 w-8 rounded-sm",
        "border border-[hsl(var(--border))]",
        "bg-transparent",
        "text-[hsl(var(--muted-foreground))]",
        "transition-colors",
        "hover:bg-[hsl(var(--accent)_/_0.08)] hover:text-[hsl(var(--foreground))]",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1",
        "focus-visible:ring-offset-[hsl(var(--background))]",
      ].join(" ")}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
