"use client";

import { InsforgeBrowserProvider } from "@insforge/nextjs";
import { insforge } from "@/lib/insforge";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";

export function InsforgeProvider({ children }: { children: React.ReactNode }) {
  return (
    <InsforgeBrowserProvider client={insforge} afterSignInUrl="/chat">
      <PreferencesProvider>
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </PreferencesProvider>
    </InsforgeBrowserProvider>
  );
}
