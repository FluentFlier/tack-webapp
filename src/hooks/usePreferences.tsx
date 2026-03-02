"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
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

// ── Context ──
interface PreferencesContextValue {
    preferences: Omit<UserPreferences, "user_id">;
    isLoaded: boolean;
    /** Call after saving to the DB to re-apply classes immediately. */
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

// ── Font-size → CSS class mapping ──
const FONT_SIZE_CLASSES: Record<string, string> = {
    small: "font-size-small",
    medium: "font-size-medium",
    large: "font-size-large",
    "x-large": "font-size-x-large",
};

/**
 * Apply preference classes to the <html> element so CSS rules activate globally.
 *
 * Classes applied:
 *   .high-contrast    — increases contrast ratios
 *   .font-size-*      — scales the base font size
 *   .reduced-motion   — disables transitions and animations
 */
function applyClassesToRoot(prefs: Omit<UserPreferences, "user_id">) {
    const root = document.documentElement;

    // ── High contrast ──
    root.classList.toggle("high-contrast", prefs.high_contrast);

    // ── Font size (remove all, add correct one) ──
    Object.values(FONT_SIZE_CLASSES).forEach((cls) => root.classList.remove(cls));
    const fontClass = FONT_SIZE_CLASSES[prefs.font_size] || FONT_SIZE_CLASSES.medium;
    root.classList.add(fontClass);

    // ── Reduced motion ──
    root.classList.toggle("reduced-motion", prefs.reduced_motion);
}

// ── Provider component ──
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoaded: userLoaded } = useUser();
    const [preferences, setPreferences] =
        useState<Omit<UserPreferences, "user_id">>(DEFAULT_PREFERENCES);
    const [isLoaded, setIsLoaded] = useState(false);

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
                    applyClassesToRoot(parsed);
                } catch {
                    applyClassesToRoot(DEFAULT_PREFERENCES);
                }
            } else {
                applyClassesToRoot(DEFAULT_PREFERENCES);
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
                    applyClassesToRoot(prefs);
                    // Also cache locally for faster future loads
                    localStorage.setItem("tack_preferences", JSON.stringify(prefs));
                } else {
                    applyClassesToRoot(DEFAULT_PREFERENCES);
                }
            } catch {
                // Network error — fall back to localStorage cache
                const stored = localStorage.getItem("tack_preferences");
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setPreferences(parsed);
                        applyClassesToRoot(parsed);
                    } catch {
                        applyClassesToRoot(DEFAULT_PREFERENCES);
                    }
                } else {
                    applyClassesToRoot(DEFAULT_PREFERENCES);
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
            applyClassesToRoot(prefs);
            localStorage.setItem("tack_preferences", JSON.stringify(prefs));
        },
        []
    );

    return (
        <PreferencesContext.Provider value={{ preferences, isLoaded, applyPreferences }}>
            {children}
        </PreferencesContext.Provider>
    );
}
