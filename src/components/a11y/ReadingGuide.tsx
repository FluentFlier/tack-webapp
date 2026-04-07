"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

/**
 * ReadingGuide — renders a translucent horizontal bar that tracks the
 * mouse pointer, helping dyslexia-mode users follow lines of text.
 * Only visible when the "dyslexia" accessibility mode is active.
 */
export function ReadingGuide() {
  const { isModeActive } = useAccessibility();
  const dyslexiaActive = isModeActive("dyslexia");
  const [y, setY] = useState(-100);
  const [visible, setVisible] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setY(e.clientY);
    setVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!dyslexiaActive) {
      setVisible(false);
      return;
    }

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [dyslexiaActive, handleMouseMove, handleMouseLeave]);

  if (!dyslexiaActive || !visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: y - 16,
        left: 0,
        right: 0,
        height: 32,
        background:
          "linear-gradient(to bottom, transparent 0%, hsl(var(--primary) / 0.08) 30%, hsl(var(--primary) / 0.12) 50%, hsl(var(--primary) / 0.08) 70%, transparent 100%)",
        pointerEvents: "none",
        zIndex: 9998,
        transition: "top 50ms ease-out",
      }}
    />
  );
}
