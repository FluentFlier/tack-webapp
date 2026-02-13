"use client";

import { useEffect, useRef, useState } from "react";

interface LiveRegionProps {
  message: string;
  politeness?: "polite" | "assertive";
  clearAfterMs?: number;
}

export function LiveRegion({
  message,
  politeness = "polite",
  clearAfterMs = 5000,
}: LiveRegionProps) {
  const [current, setCurrent] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (message) {
      setCurrent(message);
      if (clearAfterMs > 0) {
        timeoutRef.current = setTimeout(() => setCurrent(""), clearAfterMs);
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [message, clearAfterMs]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {current}
    </div>
  );
}
