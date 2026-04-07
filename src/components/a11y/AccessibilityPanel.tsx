"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LiveRegion } from "@/components/a11y/LiveRegion";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import {
  Eye,
  Palette,
  BookOpen,
  Brain,
  RotateCcw,
  Minus,
  Plus,
  Type,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { AccessibilityMode } from "@/types/accessibility";
import { ACCESSIBILITY_MODES } from "@/types/accessibility";

const ICON_MAP: Record<string, React.ElementType> = {
  Eye,
  Palette,
  BookOpen,
  Brain,
};

interface AccessibilityPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccessibilityPanel({
  open,
  onOpenChange,
}: AccessibilityPanelProps) {
  const a11y = useAccessibility();

  const handleToggle = useCallback(
    (mode: AccessibilityMode) => {
      a11y.toggleMode(mode);
    },
    [a11y]
  );

  const activeCount = a11y.activeModes.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl max-h-[85vh] overflow-y-auto bg-[hsl(220,20%,8%)] border-[hsl(180,100%,50%,0.2)]"
        aria-label="Accessibility Settings Panel"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <ShieldCheck className="h-5 w-5 text-[hsl(180,100%,50%)]" aria-hidden="true" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Fine-tune your accessibility preferences. Settings are saved
            automatically.
          </DialogDescription>
        </DialogHeader>

        <LiveRegion
          message={
            activeCount > 0
              ? `${activeCount} accessibility mode${activeCount > 1 ? "s" : ""} active`
              : "No accessibility modes active"
          }
          politeness="polite"
        />

        {/* ── Mode Toggles ── */}
        <div className="space-y-2" role="group" aria-label="Accessibility mode toggles">
          {ACCESSIBILITY_MODES.map((mode) => {
            const IconComp = ICON_MAP[mode.icon] || Sparkles;
            const isActive = a11y.isModeActive(mode.id);

            return (
              <button
                key={mode.id}
                role="switch"
                aria-checked={isActive}
                onClick={() => handleToggle(mode.id)}
                className={`
                  w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all
                  focus:outline-none focus:ring-2 focus:ring-[hsl(180,100%,50%)] focus:ring-offset-2 focus:ring-offset-[hsl(220,20%,8%)]
                  ${
                    isActive
                      ? "border-[hsl(180,100%,50%,0.4)] bg-[hsl(180,100%,50%,0.08)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  }
                `}
              >
                <IconComp
                  className={`h-5 w-5 shrink-0 ${isActive ? "text-[hsl(180,100%,50%)]" : "text-white/40"}`}
                  aria-hidden="true"
                />
                <span className={`flex-1 text-sm font-medium ${isActive ? "text-white" : "text-white/70"}`}>
                  {mode.label}
                </span>
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-[hsl(180,100%,50%,0.15)] text-[hsl(180,100%,50%)]"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {isActive ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}
        </div>

        <Separator className="bg-white/10" />

        {/* ── Fine-Tune Controls ── */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-white/80">
            <Type className="h-4 w-4 text-[hsl(180,100%,50%)]" aria-hidden="true" />
            Fine-Tune
          </h3>

          {/* Font Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="a11y-font-scale" className="text-sm text-white/70">
                Font Scale
              </Label>
              <span
                className="text-xs font-mono text-[hsl(180,100%,50%)] bg-white/5 px-2 py-0.5 rounded"
                aria-live="polite"
              >
                {Math.round(a11y.fontScale * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => a11y.setFontScale(a11y.fontScale - 0.1)}
                disabled={a11y.fontScale <= 0.75}
                aria-label="Decrease font scale"
                className="h-8 w-8 p-0 border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <input
                id="a11y-font-scale"
                type="range"
                min="0.75"
                max="2"
                step="0.05"
                value={a11y.fontScale}
                onChange={(e) => a11y.setFontScale(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-white/10 accent-[hsl(180,100%,50%)] cursor-pointer"
                aria-valuemin={75}
                aria-valuemax={200}
                aria-valuenow={Math.round(a11y.fontScale * 100)}
                aria-valuetext={`${Math.round(a11y.fontScale * 100)} percent`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => a11y.setFontScale(a11y.fontScale + 0.1)}
                disabled={a11y.fontScale >= 2}
                aria-label="Increase font scale"
                className="h-8 w-8 p-0 border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Text Spacing */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-white/70">Text Spacing</legend>
            <div className="flex gap-2" role="radiogroup" aria-label="Text spacing">
              {(["normal", "wide", "wider"] as const).map((spacing) => (
                <button
                  key={spacing}
                  role="radio"
                  aria-checked={a11y.textSpacing === spacing}
                  onClick={() => a11y.setTextSpacing(spacing)}
                  className={`
                    flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center
                    focus:outline-none focus:ring-2 focus:ring-[hsl(180,100%,50%)]
                    ${
                      a11y.textSpacing === spacing
                        ? "bg-[hsl(180,100%,50%,0.12)] border border-[hsl(180,100%,50%,0.3)] text-[hsl(180,100%,50%)]"
                        : "bg-white/[0.03] border border-white/10 text-white/50 hover:bg-white/[0.06]"
                    }
                  `}
                >
                  {spacing.charAt(0).toUpperCase() + spacing.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Toggles */}
          {[
            {
              id: "a11y-contrast",
              label: "High Contrast",
              checked: a11y.contrastMode === "high",
              onChange: () =>
                a11y.setContrastMode(a11y.contrastMode === "high" ? "normal" : "high"),
            },
            {
              id: "a11y-motion",
              label: "Reduce Motion",
              checked: a11y.motionReduced,
              onChange: () => a11y.setMotionReduced(!a11y.motionReduced),
            },
          ].map((toggle) => (
            <div key={toggle.id} className="flex items-center justify-between">
              <Label htmlFor={toggle.id} className="text-sm text-white/70">
                {toggle.label}
              </Label>
              <button
                id={toggle.id}
                role="switch"
                aria-checked={toggle.checked}
                onClick={toggle.onChange}
                className={`
                  relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-[hsl(180,100%,50%)] focus:ring-offset-2 focus:ring-offset-[hsl(220,20%,8%)]
                  ${toggle.checked ? "bg-[hsl(180,100%,50%)]" : "bg-white/15"}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0
                    transition-transform duration-200 ease-in-out
                    ${toggle.checked ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>
          ))}
        </div>

        <Separator className="bg-white/10" />

        {/* ── Reset ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40">
            {activeCount > 0
              ? `${activeCount} mode${activeCount > 1 ? "s" : ""} active`
              : "Default settings"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={a11y.resetAll}
            className="gap-2 border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            aria-label="Reset all accessibility settings to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
