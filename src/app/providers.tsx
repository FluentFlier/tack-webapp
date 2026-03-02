"use client";

import { InsforgeBrowserProvider } from "@insforge/nextjs";
import { insforge } from "@/lib/insforge";
import { PreferencesProvider } from "@/hooks/usePreferences";

export function InsforgeProvider({ children }: { children: React.ReactNode }) {
  return (
    <InsforgeBrowserProvider client={insforge} afterSignInUrl="/chat">
      <PreferencesProvider>
        {children}
      </PreferencesProvider>
    </InsforgeBrowserProvider>
  );
}
