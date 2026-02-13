"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function FocusManager() {
  const pathname = usePathname();

  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.focus({ preventScroll: true });
    }
  }, [pathname]);

  return null;
}
