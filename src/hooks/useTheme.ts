"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "tack_theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") return getSystemTheme();
  return theme;
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

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredTheme())
  );

  // Apply theme to <html> whenever the chosen theme changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeToRoot(resolved);
  }, [theme]);

  // When theme === "system", follow OS preference changes live
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent): void => {
      const resolved: ResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyThemeToRoot(resolved);
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
