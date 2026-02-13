"use client";

import { InsforgeBrowserProvider } from "@insforge/nextjs";
import { insforge } from "@/lib/insforge";

export function InsforgeProvider({ children }: { children: React.ReactNode }) {
  return (
    <InsforgeBrowserProvider client={insforge} afterSignInUrl="/chat">
      {children}
    </InsforgeBrowserProvider>
  );
}
