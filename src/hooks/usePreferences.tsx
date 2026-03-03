"use client";

import { useEffect, useState, useCallback, createContext, useContext, useRef } from "react";
import { insforge } from "@/lib/insforge";
import { useUser } from "@insforge/nextjs";
import type { UserPreferences } from "@/types";

// ── Default preferences (used when not signed in or before data loads) ──
const DEFAULT_PREFERENCES: Omit<UserPreferences, "user_id"> = {
    high_contrast: false,
    font_size: "medium",
    screen_reader_verbosity: "normal",
    reduced_motion: false,
};

// ── Font-size enum → pixel mapping ──
// The CSS (globals.css) uses `html { font-size: var(--base-font-size, 16px); }`
// so all rem-based sizes automatically scale from this root value.
const FONT_SIZE_PX: Record<string, number> = {
    small: 14,
    medium: 16,
    large: 20,
    "x-large": 24,
};

// ── Context ──
interface PreferencesContextValue {
    preferences: Omit<UserPreferences, "user_id">;
    isLoaded: boolean;
    /** Call after saving to the DB to re-apply settings immediately. */
    applyPreferences: (prefs: Omit<UserPreferences, "user_id">) => void;
}

const PreferencesContext = createContext<PreferencesContextValue>({
    preferences: DEFAULT_PREFERENCES,
    isLoaded: false,
    applyPreferences: () => { },
});

export function usePreferences() {
    return useContext(PreferencesContext);
}

/**
 * Apply preference settings to the <html> element using CSS variables and
 * data attributes so the palette/font/motion CSS rules in globals.css activate.
 *
 * How it works:
 *   - high_contrast → sets data-color-profile="high-contrast" on <html>
 *     (matched by [data-color-profile="high-contrast"] in globals.css)
 *   - font_size → maps enum to px, sets --base-font-size CSS variable
 *     (matched by `html { font-size: var(--base-font-size); }` in globals.css)
 *   - reduced_motion → toggles .reduced-motion class + --motion-duration
 *     (matched by `.reduced-motion *` rules in globals.css)
 */
function applySettingsToRoot(prefs: Omit<UserPreferences, "user_id">) {
    const root = document.documentElement;

    // ── Color profile via data attribute ──
    // When high_contrast is true, use the high-contrast palette.
    // When false, remove the attribute so the default palette applies.
    if (prefs.high_contrast) {
        root.setAttribute("data-color-profile", "high-contrast");
    } else {
        root.removeAttribute("data-color-profile");
    }

    // ── Font size via CSS variable ──
    // The enum ("small"/"medium"/"large"/"x-large") maps to pixel values.
    // Setting --base-font-size on the root element scales all rem units.
    const pxValue = FONT_SIZE_PX[prefs.font_size] || FONT_SIZE_PX.medium;
    root.style.setProperty("--base-font-size", `${pxValue}px`);

    // ── Reduced motion ──
    // Toggles the .reduced-motion class which globals.css uses to override
    // animation-duration, transition-duration, and transform properties.
    root.classList.toggle("reduced-motion", prefs.reduced_motion);

    // Also set --motion-duration so any components using it get instant transitions
    if (prefs.reduced_motion) {
        root.style.setProperty("--motion-duration", "0.001ms");
        // Pause autoplay videos programmatically
        document.querySelectorAll("video[autoplay]").forEach((v) => {
            (v as HTMLVideoElement).pause();
        });
    } else {
        root.style.removeProperty("--motion-duration");
    }
}

// ── Provider component ──
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoaded: userLoaded } = useUser();
    const [preferences, setPreferences] =
        useState<Omit<UserPreferences, "user_id">>(DEFAULT_PREFERENCES);
    const [isLoaded, setIsLoaded] = useState(false);
    const listenersRef = useRef<Array<(prefs: Omit<UserPreferences, "user_id">) => void>>([]);

    // Load preferences from DB when user is available
    useEffect(() => {
        if (!userLoaded) return;

        if (!user) {
            // Not signed in — use defaults (possibly from localStorage)
            const stored = localStorage.getItem("tack_preferences");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setPreferences(parsed);
                    applySettingsToRoot(parsed);
                } catch {
                    applySettingsToRoot(DEFAULT_PREFERENCES);
                }
            } else {
                applySettingsToRoot(DEFAULT_PREFERENCES);
            }
            setIsLoaded(true);
            return;
        }

        async function loadFromDB() {
            try {
                const { data } = await insforge.database
                    .from("user_preferences")
                    .select("*")
                    .eq("user_id", user!.id)
                    .maybeSingle();

                if (data) {
                    const prefs = {
                        high_contrast: data.high_contrast ?? false,
                        font_size: data.font_size ?? "medium",
                        screen_reader_verbosity: data.screen_reader_verbosity ?? "normal",
                        reduced_motion: data.reduced_motion ?? false,
                    };
                    setPreferences(prefs);
                    applySettingsToRoot(prefs);
                    // Also cache locally for faster future loads
                    localStorage.setItem("tack_preferences", JSON.stringify(prefs));
                } else {
                    applySettingsToRoot(DEFAULT_PREFERENCES);
                }
            } catch {
                // Network error — fall back to localStorage cache
                const stored = localStorage.getItem("tack_preferences");
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setPreferences(parsed);
                        applySettingsToRoot(parsed);
                    } catch {
                        applySettingsToRoot(DEFAULT_PREFERENCES);
                    }
                } else {
                    applySettingsToRoot(DEFAULT_PREFERENCES);
                }
            }
            setIsLoaded(true);
        }

        loadFromDB();
    }, [user, userLoaded]);

    // Public function so the settings page can apply changes immediately
    const applyPreferences = useCallback(
        (prefs: Omit<UserPreferences, "user_id">) => {
            setPreferences(prefs);
            applySettingsToRoot(prefs);
            localStorage.setItem("tack_preferences", JSON.stringify(prefs));
            // Notify subscribers
            listenersRef.current.forEach((cb) => {
                try { cb(prefs); } catch { /* ignore listener errors */ }
            });
        },
        []
    );

    // ── Expose developer API on window ──
    // Allows programmatic access from non-React code and developer tools.
    // Example: window.AccessibilitySettings.reducedMotionEnabled()
    useEffect(() => {
        const api = {
            /** Returns a copy of the current settings */
            getSettings: () => ({ ...preferences }),

            /** Applies settings programmatically */
            applySettings: (s: Partial<Omit<UserPreferences, "user_id">>) => {
                const merged = { ...preferences, ...s };
                applyPreferences(merged);
            },

            /** Subscribe to changes. Returns unsubscribe function. */
            onChange: (cb: (prefs: Omit<UserPreferences, "user_id">) => void) => {
                listenersRef.current.push(cb);
                return () => {
                    listenersRef.current = listenersRef.current.filter((c) => c !== cb);
                };
            },

            /** Returns true if reduced motion is currently enabled */
            reducedMotionEnabled: () => preferences.reduced_motion,
        };

        (window as unknown as Record<string, unknown>).AccessibilitySettings = api;

        return () => {
            delete (window as unknown as Record<string, unknown>).AccessibilitySettings;
        };
    }, [preferences, applyPreferences]);

    return (
        <PreferencesContext.Provider value={{ preferences, isLoaded, applyPreferences }}>
            {children}
        </PreferencesContext.Provider>
    );
}
