"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LiveRegion } from "@/components/a11y";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ExtractedContent } from "@/types";

function ReaderContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const [content, setContent] = useState<ExtractedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!url) {
      setError("No URL provided");
      setLoading(false);
      return;
    }

    async function loadContent() {
      try {
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load content");
        }

        const data = await response.json();
        setContent(data);
        setStatusMessage(`Loaded: ${data.title}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [url]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6" role="status">
        <p className="text-muted-foreground">Loading article...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p role="alert" className="text-destructive">{error || "Failed to load content"}</p>
        <Link href="/chat">
          <Button variant="ghost" className="mt-4 gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Chat
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <LiveRegion message={statusMessage} />

      <nav aria-label="Reader navigation" className="flex items-center gap-2">
        <Link href="/chat">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Chat
          </Button>
        </Link>
      </nav>

      <article aria-label={content.title}>
        <header className="space-y-2 mb-8 border-b border-[rgba(79,70,229,0.2)] pb-6">
          <p className="app-eyebrow mb-3" aria-hidden="true">
            Reader Mode
          </p>
          <h1 className="app-page-title text-4xl leading-tight mb-4 pb-1">
            {content.title}
          </h1>
          {content.byline && (
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[rgba(240,244,255,0.55)]">
              By {content.byline}
            </p>
          )}
          {content.siteName && (
            <p className="text-muted-foreground text-sm">
              From {content.siteName} —{" "}
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[rgba(103,232,249,0.9)] underline underline-offset-2 decoration-[rgba(103,232,249,0.4)] hover:text-[#a5f3fc] focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              >
                View original
              </a>
            </p>
          )}
        </header>

        {content.excerpt && (
          <div className="border-l-2 border-[rgba(103,232,249,0.5)] bg-[rgba(79,70,229,0.06)] rounded-r-lg pl-4 pr-4 py-3 mb-8">
            <p className="text-[rgba(240,244,255,0.65)] italic leading-relaxed">
              {content.excerpt}
            </p>
          </div>
        )}

        <div className="max-w-none text-[1.05rem] leading-[1.85] text-[rgba(240,244,255,0.8)]">
          {content.content.split("\n\n").map((paragraph, i) =>
            paragraph.trim() ? (
              <p key={i} className="mb-5">{paragraph.trim()}</p>
            ) : null
          )}
        </div>
      </article>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto p-6" role="status">
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      }
    >
      <ReaderContent />
    </Suspense>
  );
}
