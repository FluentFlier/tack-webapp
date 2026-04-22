"use client";

/**
 * PdfSettingsPanel — Glassmorphic settings modal for the PDF Reader.
 *
 * Opens as a fixed overlay modal. Traps focus while open, closes on
 * Escape, and announces changes via a polite live region.
 */

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { LiveRegion } from "@/components/a11y";

export interface PdfReadingSettingsV2 {
  aiPreview: boolean;
  aiParagraphShortening: boolean;
}

interface PdfSettingsPanelProps {
  isOpen: boolean;
  settings: PdfReadingSettingsV2;
  onSettingsChange: (next: PdfReadingSettingsV2) => void;
  onClose: () => void;
  /** Live region announcement message */
  announcement: string;
  onAnnouncementClear: () => void;
}

export function PdfSettingsPanel({
  isOpen,
  settings,
  onSettingsChange,
  onClose,
  announcement,
  onAnnouncementClear,
}: PdfSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /** Move focus into the panel when it opens */
  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  /** Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /** Focus trap — keep Tab/Shift+Tab inside the panel */
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    panel.addEventListener("keydown", trap);
    return () => panel.removeEventListener("keydown", trap);
  }, [isOpen]);

  if (!isOpen) return null;

  function toggle(key: keyof PdfReadingSettingsV2, value: boolean) {
    onSettingsChange({ ...settings, [key]: value });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="pdf-settings-overlay"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-settings-title"
        className="pdf-settings-panel"
      >
        {/* Live region for toggle announcements */}
        <LiveRegion message={announcement} politeness="polite" clearAfterMs={4000} />

        {/* Header row */}
        <div className="pdf-settings-panel__header">
          <h2 id="pdf-settings-title" className="pdf-settings-panel__title">
            PDF Reading Settings
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close PDF reading settings"
            className="pdf-settings-panel__close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Divider */}
        <div className="pdf-settings-panel__divider" aria-hidden="true" />

        {/* Toggles section */}
        <section
          aria-labelledby="pdf-settings-ai-section"
          className="pdf-settings-panel__section"
        >
          <h3
            id="pdf-settings-ai-section"
            className="pdf-settings-panel__section-title"
          >
            AI Features
          </h3>

          <ToggleSwitch
            id="pdf-setting-ai-preview"
            checked={settings.aiPreview}
            onChange={(val) => toggle("aiPreview", val)}
            label="AI Generated Preview"
            description="Generates an AI summary displayed above the PDF content when a file is loaded."
          />

          <ToggleSwitch
            id="pdf-setting-ai-shortening"
            checked={settings.aiParagraphShortening}
            onChange={(val) => toggle("aiParagraphShortening", val)}
            label="AI Paragraph Shortening"
            description="AI automatically shortens each paragraph to a condensed version."
          />

          {/* ── Room for future toggles ────────────────────────────────────
              Add new <ToggleSwitch> elements below this comment.
              ─────────────────────────────────────────────────────────────── */}
        </section>

        {/* Footer note */}
        <p className="pdf-settings-panel__footer-note">
          Settings are saved automatically.
        </p>
      </div>
    </>
  );
}

export default PdfSettingsPanel;
