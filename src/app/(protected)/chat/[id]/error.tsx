"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Chat error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8" role="alert">
      <h2 className="text-xl font-bold mb-4">Couldn&apos;t load conversation</h2>
      <p className="text-muted-foreground mb-6">
        This conversation may have been deleted or is unavailable.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/chat">
          <Button variant="outline">New Chat</Button>
        </Link>
      </div>
    </div>
  );
}
