"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LiveRegion } from "@/components/a11y";
import { insforge } from "@/lib/insforge";
import { useUser } from "@insforge/nextjs";
import type { UserPreferences, ColorProfile } from "@/types";

// ── Font-size enum → pixel mapping ──
const FONT_SIZE_MAP: Record<string, number> = {
  small: 14,
  medium: 16,
  large: 20,
  "x-large": 24,
};

/**
 * Apply the current preference values directly to the <html> element.
 * This activates the CSS rules already defined in globals.css:
 *   - data-color-profile attribute        → color-blindness palette
 *   - --base-font-size                    → scales all rem-based text
 *   - .reduced-motion class               → disables animations/transitions
 * Also persists to localStorage so the blocking <Script> in layout.tsx
 * can restore settings before first paint on future page loads.
 */
function applySettingsToDOM(prefs: Omit<UserPreferences, "user_id">) {
  const root = document.documentElement;

  // Color profile via data attribute
  const profile = prefs.color_profile || (prefs.high_contrast ? "high-contrast" : "default");
  if (profile && profile !== "default") {
    root.setAttribute("data-color-profile", profile);
  } else {
    root.removeAttribute("data-color-profile");
  }

  // Custom palette: set CSS variables for foreground/background
  if (profile === "custom" && prefs.custom_fg && prefs.custom_bg) {
    root.style.setProperty("--custom-fg", prefs.custom_fg);
    root.style.setProperty("--custom-bg", prefs.custom_bg);
  } else {
    root.style.removeProperty("--custom-fg");
    root.style.removeProperty("--custom-bg");
  }

  // Font size
  const px = FONT_SIZE_MAP[prefs.font_size] ?? FONT_SIZE_MAP.medium;
  root.style.setProperty("--base-font-size", `${px}px`);

  // Reduced motion
  root.classList.toggle("reduced-motion", prefs.reduced_motion);
  if (prefs.reduced_motion) {
    root.style.setProperty("--motion-duration", "0.001ms");
  } else {
    root.style.removeProperty("--motion-duration");
  }

  // Persist to localStorage for the blocking restore script in layout.tsx
  localStorage.setItem("tack_preferences", JSON.stringify(prefs));
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadPreferences() {
      const { data } = await insforge.database
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        setPreferences({
          user_id: user!.id,
          high_contrast: false,
          color_profile: "default",
          custom_fg: "#f1f5f9",
          custom_bg: "#0f172a",
          font_size: "medium",
          screen_reader_verbosity: "normal",
          reduced_motion: false,
        });
      }
    }

    loadPreferences();
  }, [user]);

  // ── Apply settings on initial load and whenever preferences change ──
  // This covers: first mount after DB fetch, navigating back to the page,
  // and refreshes (the blocking script handles the very first paint,
  // but this useEffect keeps React state and DOM in sync).
  useEffect(() => {
    if (!preferences) return;
    const { user_id, ...displayPrefs } = preferences;
    applySettingsToDOM(displayPrefs);
  }, [preferences]);

  const savePreferences = async () => {
    if (!preferences || !user) return;
    setSaving(true);

    const { error } = await insforge.database
      .from("user_preferences")
      .insert({
        ...preferences,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      // Try update if insert fails (row exists)
      await insforge.database
        .from("user_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Apply to DOM immediately so the user sees the change
    const { user_id, ...displayPrefs } = preferences;
    applySettingsToDOM(displayPrefs);

    setSaving(false);
    setStatusMessage("Settings saved successfully.");
  };

  if (!isLoaded || !preferences) {
    return (
      <div className="p-8" role="status">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <LiveRegion message={statusMessage} politeness="assertive" />

      <div>
        <h1 className="text-2xl font-bold font-serif italic">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your accessibility preferences
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif italic">Display</CardTitle>
          <CardDescription>
            Adjust visual settings for your comfort
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ── Color-Blindness Profile ── */}
          <fieldset className="space-y-3 rounded-lg border border-border p-4">
            <legend className="px-2 text-sm font-semibold">Color-Blindness Profile</legend>
            <p className="text-xs text-muted-foreground">
              Select a color palette optimized for your vision. Changes apply on save.
            </p>
            <div className="space-y-2" role="radiogroup" aria-label="Color-blindness profile">
              {([
                { value: "default", label: "Default" },
                { value: "protanopia", label: "Protanopia (red-blind)" },
                { value: "deuteranopia", label: "Deuteranopia (green-blind)" },
                { value: "tritanopia", label: "Tritanopia (blue-blind)" },
                { value: "protanomaly", label: "Protanomaly (red-weak)" },
                { value: "deuteranomaly", label: "Deuteranomaly (green-weak)" },
                { value: "achromatopsia", label: "Achromatopsia (Monochrome)" },
                { value: "high-contrast", label: "High Contrast" },
                { value: "custom", label: "Custom palette" },
              ] as { value: ColorProfile; label: string }[]).map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="colorProfile"
                    value={opt.value}
                    checked={preferences.color_profile === opt.value}
                    onChange={() =>
                      setPreferences({
                        ...preferences,
                        color_profile: opt.value,
                        // Keep high_contrast in sync for backward compat
                        high_contrast: opt.value === "high-contrast",
                      })
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {/* Custom palette color pickers — only visible when "custom" is selected */}
            {preferences.color_profile === "custom" && (
              <div className="mt-3 space-y-3 rounded-md border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">Pick a foreground/background color pair:</p>
                <div className="flex items-center gap-3">
                  <Label htmlFor="custom-fg" className="min-w-[6rem] text-sm">Foreground</Label>
                  <input
                    id="custom-fg-picker"
                    type="color"
                    value={preferences.custom_fg}
                    onChange={(e) =>
                      setPreferences({ ...preferences, custom_fg: e.target.value })
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-border p-0.5"
                    aria-label="Foreground color picker"
                  />
                  <input
                    id="custom-fg"
                    type="text"
                    value={preferences.custom_fg}
                    onChange={(e) =>
                      setPreferences({ ...preferences, custom_fg: e.target.value })
                    }
                    pattern="^#[0-9a-fA-F]{6}$"
                    maxLength={7}
                    className="w-24 rounded-md border bg-background px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Foreground hex color"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="custom-bg" className="min-w-[6rem] text-sm">Background</Label>
                  <input
                    id="custom-bg-picker"
                    type="color"
                    value={preferences.custom_bg}
                    onChange={(e) =>
                      setPreferences({ ...preferences, custom_bg: e.target.value })
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-border p-0.5"
                    aria-label="Background color picker"
                  />
                  <input
                    id="custom-bg"
                    type="text"
                    value={preferences.custom_bg}
                    onChange={(e) =>
                      setPreferences({ ...preferences, custom_bg: e.target.value })
                    }
                    pattern="^#[0-9a-fA-F]{6}$"
                    maxLength={7}
                    className="w-24 rounded-md border bg-background px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Background hex color"
                  />
                </div>
              </div>
            )}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="font-size">Font size</Label>
            <select
              id="font-size"
              value={preferences.font_size}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  font_size: e.target.value as UserPreferences["font_size"],
                })
              }
              className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 transition-colors"
            >
              <option value="small">Small</option>
              <option value="medium">Medium (default)</option>
              <option value="large">Large</option>
              <option value="x-large">Extra Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="reduced-motion">Reduce motion</Label>
            <input
              id="reduced-motion"
              type="checkbox"
              checked={preferences.reduced_motion}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  reduced_motion: e.target.checked,
                })
              }
              className="h-5 w-5 rounded border-border accent-primary focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif italic">Screen Reader</CardTitle>
          <CardDescription>
            Adjust how much detail Tack provides in responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="verbosity">Response verbosity</Label>
            <select
              id="verbosity"
              value={preferences.screen_reader_verbosity}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  screen_reader_verbosity: e.target
                    .value as UserPreferences["screen_reader_verbosity"],
                })
              }
              className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/40 transition-colors"
            >
              <option value="concise">
                Concise — Brief, to-the-point responses
              </option>
              <option value="normal">
                Normal — Balanced detail (default)
              </option>
              <option value="verbose">
                Verbose — Maximum detail and context
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── Braille Display Setup Instructions ── */}
      <Card>
        <CardHeader>
          <CardTitle>Braille Display Setup</CardTitle>
          <CardDescription>
            Step-by-step instructions to connect and configure a braille display with your screen reader
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* VoiceOver + Orbit Reader 20 (macOS) */}
          <details className="group rounded-lg border border-border">
            <summary
              className="flex cursor-pointer items-center justify-between px-4 py-3 font-semibold text-sm hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
              aria-label="VoiceOver and Orbit Reader 20 setup instructions for macOS"
            >
              <span>VoiceOver + Orbit Reader 20 (macOS)</span>
              <span className="text-muted-foreground text-xs group-open:rotate-90 transition-transform" aria-hidden="true">▶</span>
            </summary>
            <div className="px-4 pb-4 pt-2 space-y-3 text-sm text-muted-foreground">

              <div>
                <h4 className="font-semibold text-foreground mb-1">1. Enable VoiceOver</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">⌘ Cmd + F5</kbd> to toggle VoiceOver on or off.</li>
                  <li>A Quick Start tutorial will appear on first launch — complete it or press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">V</kbd> to skip.</li>
                  <li>The VoiceOver modifier keys (VO) are <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">Ctrl + Option</kbd> by default.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">2. Connect the Orbit Reader 20</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>USB:</strong> Plug in the Orbit Reader 20. macOS detects it automatically.</li>
                  <li><strong>Bluetooth:</strong> Pair in System Settings → Bluetooth first, then select it in VoiceOver Utility.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">3. Open VoiceOver Utility</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">VO + F8</kbd> (Ctrl + Option + F8).</li>
                  <li>Or: System Settings → Accessibility → VoiceOver → Open VoiceOver Utility.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">4. Configure Braille Display</h4>
                <p>Navigate to <strong>VoiceOver Utility → Braille → Displays</strong>:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check the box next to <strong>&quot;Orbit Reader 20&quot;</strong> in the Displays list.</li>
                  <li>Set <strong>Output</strong> to Contracted (Grade 2) or Uncontracted (Grade 1) based on your preference.</li>
                  <li>Set <strong>Input</strong> similarly.</li>
                  <li>Enable <strong>&quot;Show Braille Cursor&quot;</strong> — shows cursor position on the display.</li>
                  <li>Enable <strong>&quot;Cursor Routing&quot;</strong> — pressing routing buttons on the display moves VoiceOver focus.</li>
                  <li>Under Braille Display Output, select <strong>&quot;Show VoiceOver Cursor&quot;</strong>.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">5. Enable Live Region Updates</h4>
                <p>In <strong>VoiceOver Utility → Braille → General</strong>:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Set <strong>&quot;Show alert messages&quot;</strong> to <strong>&quot;All&quot;</strong> or <strong>&quot;Timed&quot;</strong>.</li>
                  <li>This ensures Tack&apos;s status messages appear on the braille display.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">6. Test It</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Navigate this page with <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">VO + Right</kbd>. Labels should appear on the braille display.</li>
                  <li>Focus a text input and type on the Orbit Reader&apos;s braille keyboard — characters should appear in the field.</li>
                </ul>
              </div>

            </div>
          </details>

          {/* NVDA + Orbit Reader 20 (Windows) */}
          <details className="group rounded-lg border border-border">
            <summary
              className="flex cursor-pointer items-center justify-between px-4 py-3 font-semibold text-sm hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
              aria-label="NVDA and Orbit Reader 20 setup instructions for Windows"
            >
              <span>NVDA + Orbit Reader 20 (Windows)</span>
              <span className="text-muted-foreground text-xs group-open:rotate-90 transition-transform" aria-hidden="true">▶</span>
            </summary>
            <div className="px-4 pb-4 pt-2 space-y-3 text-sm text-muted-foreground">

              <div>
                <h4 className="font-semibold text-foreground mb-1">1. Install &amp; Launch NVDA</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Download NVDA free from <strong>nvaccess.org</strong>.</li>
                  <li>The NVDA modifier key is <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">Insert</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">Caps Lock</kbd> in laptop layout).</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">2. Connect the Orbit Reader 20</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>USB:</strong> Plug in the device. NVDA should auto-detect it.</li>
                  <li><strong>Bluetooth:</strong> Pair in Windows Settings → Bluetooth &amp; devices first.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">3. Open NVDA Braille Settings</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">Insert + N</kbd> to open the NVDA menu.</li>
                  <li>Navigate to: <strong>Preferences → Settings → Braille</strong>.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">4. Configure the Display</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Set <strong>Braille display</strong> to <strong>&quot;Orbit Reader 20&quot;</strong> (or &quot;Auto detect&quot;).</li>
                  <li>Set <strong>Port</strong> to the correct COM port (USB) or Bluetooth.</li>
                  <li>Set <strong>Output table</strong> to your preferred braille table (e.g., &quot;English (Unified) Grade 2&quot; for contracted).</li>
                  <li>Set <strong>Input table</strong> similarly.</li>
                  <li>Set <strong>Tether Braille</strong> to <strong>&quot;Automatically&quot;</strong> — so the display follows focus.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">5. Enable Live Region Updates</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>In the same Braille settings panel, set <strong>&quot;Show Messages&quot;</strong> to <strong>&quot;Use timeout&quot;</strong>.</li>
                  <li>Increase the <strong>Message timeout</strong> (4–5 seconds works well) so status messages stay visible long enough to read.</li>
                  <li>This ensures Tack&apos;s announcements appear on the braille display.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-1">6. Test It</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Open Tack in Chrome or Edge.</li>
                  <li>Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">Tab</kbd> through the page. Each focused element&apos;s label should appear on the braille display.</li>
                  <li>If the display doesn&apos;t update, check that <strong>Tether Braille</strong> is set to &quot;Automatically&quot;.</li>
                </ul>
              </div>

            </div>
          </details>

        </CardContent>
      </Card>

      <Button onClick={savePreferences} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
