"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * ThemeToggle — toggles between light and dark themes.
 *
 * - Real <button>, keyboard-operable.
 * - aria-label reflects the action (what you'll switch TO).
 * - Visible focus ring via CSS :focus-visible (ring token).
 * - Sun icon = currently dark, click to go light.
 * - Moon icon = currently light, click to go dark.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
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
