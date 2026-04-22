"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Protected route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8" role="alert">
      <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
      <p className="text-muted-foreground mb-6">
        We encountered an error loading this page.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/chat">
          <Button variant="outline">Back to Chat</Button>
        </Link>
      </div>
    </div>
  );
}
