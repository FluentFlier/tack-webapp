"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  AccessibilityState,
  AccessibilityContextValue,
  AccessibilityMode,
} from "@/types/accessibility";

// ── Defaults ──
const DEFAULT_STATE: AccessibilityState = {
  activeModes: [],
  fontScale: 1,
  contrastMode: "normal",
  motionReduced: false,
  textSpacing: "normal",
  focusMode: false,
};

const STORAGE_KEY = "visionaccess_a11y";

// ── Context ──
const AccessibilityCtx = createContext<AccessibilityContextValue>({
  ...DEFAULT_STATE,
  toggleMode: () => {},
  setFontScale: () => {},
  setContrastMode: () => {},
  setMotionReduced: () => {},
  setTextSpacing: () => {},
  setFocusMode: () => {},
  isModeActive: () => false,
  resetAll: () => {},
});

export function useAccessibility() {
  return useContext(AccessibilityCtx);
}

// ── Apply state to <html> via data-attributes + CSS custom properties ──
function applyToDOM(state: AccessibilityState) {
  const root = document.documentElement;
  const modes = state.activeModes;

  // Set/remove individual data attributes for CSS targeting
  const allModes: AccessibilityMode[] = [
    "dyslexia",
    "low-vision",
    "color-blind",
    "adhd",
  ];
  allModes.forEach((m) => {
    if (modes.includes(m)) {
      root.setAttribute(`data-a11y-${m}`, "");
    } else {
      root.removeAttribute(`data-a11y-${m}`);
    }
  });

  // Font scale
  root.style.setProperty("--a11y-font-scale", String(state.fontScale));

  // Text spacing
  const spacingMap = { normal: "0em", wide: "0.08em", wider: "0.14em" };
  root.style.setProperty("--a11y-letter-spacing", spacingMap[state.textSpacing]);

  const wordSpacingMap = { normal: "0em", wide: "0.12em", wider: "0.2em" };
  root.style.setProperty("--a11y-word-spacing", wordSpacingMap[state.textSpacing]);

  const lineHeightMap = { normal: "1.6", wide: "1.8", wider: "2.0" };
  root.style.setProperty("--a11y-line-height", lineHeightMap[state.textSpacing]);

  // Contrast
  if (state.contrastMode === "high") {
    root.setAttribute("data-a11y-high-contrast", "");
  } else {
    root.removeAttribute("data-a11y-high-contrast");
  }

  // Motion
  root.classList.toggle("a11y-reduced-motion", state.motionReduced);

  // Focus mode
  root.classList.toggle("a11y-focus-mode", state.focusMode);
}

// ── Derive settings automatically from active modes ──
function deriveFromModes(state: AccessibilityState): AccessibilityState {
  const modes = state.activeModes;
  let derived = { ...state };

  // Low Vision → boost font scale + high contrast + wider spacing
  if (modes.includes("low-vision")) {
    derived.fontScale = Math.max(derived.fontScale, 1.5);
    derived.contrastMode = "high";
    if (derived.textSpacing === "normal") derived.textSpacing = "wide";
  }

  // Dyslexia → wider text spacing
  if (modes.includes("dyslexia")) {
    if (derived.textSpacing === "normal") derived.textSpacing = "wide";
  }

  // ADHD → reduce motion + focus mode
  if (modes.includes("adhd")) {
    derived.motionReduced = true;
    derived.focusMode = true;
  }

  return derived;
}

// ── Provider ──
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessibilityState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AccessibilityState;
        setState(parsed);
        applyToDOM(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist + apply on every state change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    applyToDOM(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  // ── Actions ──
  const toggleMode = useCallback((mode: AccessibilityMode) => {
    setState((prev) => {
      const active = prev.activeModes.includes(mode);
      const newModes = active
        ? prev.activeModes.filter((m) => m !== mode)
        : [...prev.activeModes, mode];

      let next: AccessibilityState = { ...prev, activeModes: newModes };

      if (!active) {
        // Turning ON → derive
        next = deriveFromModes(next);
      } else {
        // Turning OFF → reset auto-managed fields, re-derive from remaining
        next.fontScale = 1;
        next.contrastMode = "normal";
        next.motionReduced = false;
        next.textSpacing = "normal";
        next.focusMode = false;
        next = deriveFromModes(next);
      }
      return next;
    });
  }, []);

  const setFontScale = useCallback((scale: number) => {
    setState((prev) => ({
      ...prev,
      fontScale: Math.max(0.75, Math.min(2, scale)),
    }));
  }, []);

  const setContrastMode = useCallback((mode: "normal" | "high") => {
    setState((prev) => ({ ...prev, contrastMode: mode }));
  }, []);

  const setMotionReduced = useCallback((reduced: boolean) => {
    setState((prev) => ({ ...prev, motionReduced: reduced }));
  }, []);

  const setTextSpacing = useCallback(
    (spacing: "normal" | "wide" | "wider") => {
      setState((prev) => ({ ...prev, textSpacing: spacing }));
    },
    []
  );

  const setFocusMode = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, focusMode: enabled }));
  }, []);

  const isModeActive = useCallback(
    (mode: AccessibilityMode) => state.activeModes.includes(mode),
    [state.activeModes]
  );

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const value: AccessibilityContextValue = {
    ...state,
    toggleMode,
    setFontScale,
    setContrastMode,
    setMotionReduced,
    setTextSpacing,
    setFocusMode,
    isModeActive,
    resetAll,
  };

  return (
    <AccessibilityCtx.Provider value={value}>
      {children}
    </AccessibilityCtx.Provider>
  );
}
