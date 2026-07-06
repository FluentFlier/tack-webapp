"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "tack_theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeToRoot(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system")
    return stored;
  return "system";
}

/**
 * Manages the light/dark/system theme preference.
 *
 * - `theme`:         stored choice ("light" | "dark" | "system")
 * - `resolvedTheme`: actual applied theme ("light" | "dark")
 * - `setTheme`:      persists choice to localStorage + applies immediately
 *
 * Applies by setting `data-theme` on `<html>` (matched by CSS in globals.css).
 * Separate from the `data-color-profile` accessibility mechanism.
 * SSR-safe: all window/document access is guarded.
 */
export function useTheme(): {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  // Tracks the live OS preference — updated via native event handler only,
  // so it does not trigger the react-hooks/set-state-in-effect warning.
  const [osPrefers, setOsPrefers] = useState<ResolvedTheme>(getSystemTheme);

  // Derive resolvedTheme — no extra state, no setState-in-effect.
  const resolvedTheme = useMemo<ResolvedTheme>(
    () => (theme === "system" ? osPrefers : (theme as ResolvedTheme)),
    [theme, osPrefers]
  );

  // Apply theme to <html> whenever resolvedTheme changes.
  useEffect(() => {
    applyThemeToRoot(resolvedTheme);
  }, [resolvedTheme]);

  // When theme === "system", follow OS preference changes live.
  // setOsPrefers is called from a native event handler, not directly
  // inside the effect body, so no react-hooks/set-state-in-effect warning.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent): void => {
      setOsPrefers(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme): void => {
    setThemeState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return { theme, resolvedTheme, setTheme };
}
