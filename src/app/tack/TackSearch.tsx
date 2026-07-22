"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./tack.module.css";
import type { TackResult } from "@/app/api/tack/search/route";

type Phase = "idle" | "loading" | "done" | "error";

export function TackSearch() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<TackResult[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // Roving-tabindex: only the active result is in the tab order; Up/Down move
  // the active index and focus follows.
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  // Autofocus the search box on page load.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) {
      setPhase("error");
      setResults([]);
      setStatusMessage("");
      setErrorMessage("Please type something to search for.");
      return;
    }

    setPhase("loading");
    setErrorMessage("");
    setStatusMessage(`Searching for ${q}…`);
    setResults([]);
    setActiveIndex(0);

    try {
      const res = await fetch("/api/tack/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPhase("error");
        setResults([]);
        setStatusMessage("");
        setErrorMessage(
          data?.error ??
            "Search is temporarily unavailable. Please try again in a moment."
        );
        return;
      }

      setResults(data.results ?? []);
      setPhase("done");
      setStatusMessage(data.message ?? `${data.count ?? 0} results found.`);
    } catch {
      setPhase("error");
      setResults([]);
      setStatusMessage("");
      setErrorMessage(
        "Something went wrong reaching the search service. Please check your connection and try again."
      );
    }
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  // Keyboard navigation within the results list (roving tabindex).
  const onResultKeyDown = (
    e: React.KeyboardEvent<HTMLAnchorElement>,
    index: number
  ) => {
    let next = index;
    switch (e.key) {
      case "ArrowDown":
        next = Math.min(index + 1, results.length - 1);
        break;
      case "ArrowUp":
        next = Math.max(index - 1, 0);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = results.length - 1;
        break;
      default:
        return; // Enter, Tab, etc. keep their native behaviour.
    }
    e.preventDefault();
    setActiveIndex(next);
    resultRefs.current[next]?.focus();
  };

  return (
    <div className={styles.page}>
      <a href="#tack-results" className={styles.skipLink}>
        Skip to results
      </a>

      <header className={styles.header}>
        <nav aria-label="Breadcrumb">
          <Link href="/chat" className={styles.backLink}>
            ← Back to dashboard
          </Link>
        </nav>
        <h1 className={styles.title}>TACK Search</h1>
        <p className={styles.tagline}>
          A keyboard-only, screen-reader-first web search.
        </p>
      </header>

      <main>
        {/* ── Search ─────────────────────────────────────────────── */}
        <section aria-labelledby="tack-search-heading" className={styles.searchRegion}>
          <h2 id="tack-search-heading" className="sr-only">
            Search the web
          </h2>
          <form role="search" onSubmit={onSubmit} className={styles.searchForm}>
            <label htmlFor="tack-search-input" className={styles.searchLabel}>
              What do you want to search for?
            </label>
            <input
              ref={inputRef}
              id="tack-search-input"
              name="q"
              type="text"
              inputMode="search"
              autoComplete="off"
              className={styles.searchInput}
              aria-label="Search the web"
              aria-describedby="tack-search-hint"
              placeholder="Type your search and press Enter"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className={styles.searchButton}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? "Searching…" : "Search"}
            </button>
          </form>
          <p id="tack-search-hint" className={styles.hint}>
            Press Enter to search. When results appear, press Tab to reach them,
            then use the Up and Down arrow keys to move between results and Enter
            to open one.
          </p>
        </section>

        {/* ── Live announcement region ───────────────────────────── */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {phase === "done" || phase === "loading" ? statusMessage : ""}
          {phase === "error" ? errorMessage : ""}
        </div>

        {/* ── Results ────────────────────────────────────────────── */}
        <section
          id="tack-results"
          aria-labelledby="tack-results-heading"
          className={styles.resultsRegion}
          tabIndex={-1}
        >
          <h2 id="tack-results-heading" className={styles.status}>
            {phase === "idle" && "Your results will appear here."}
            {phase === "loading" && "Searching…"}
            {phase === "done" && statusMessage}
            {phase === "error" && "Search results"}
          </h2>

          {phase === "error" && (
            <p role="alert" className={styles.error}>
              {errorMessage}
            </p>
          )}

          {phase === "done" && results.length > 0 && (
            <ul className={styles.resultsList} role="list">
              {results.map((r, i) => (
                <li key={`${r.url}-${i}`}>
                  <a
                    ref={(el) => {
                      resultRefs.current[i] = el;
                    }}
                    href={r.url}
                    className={styles.resultItem}
                    data-active={i === activeIndex}
                    tabIndex={i === activeIndex ? 0 : -1}
                    onKeyDown={(e) => onResultKeyDown(e, i)}
                    onFocus={() => setActiveIndex(i)}
                    aria-label={`Result ${i + 1} of ${results.length}: ${
                      r.title
                    }. ${r.snippet} From ${r.source || "unknown source"}.`}
                  >
                    <span className={styles.resultTitle}>{r.title}</span>
                    <span className={styles.resultSnippet}>{r.snippet}</span>
                    <span className={styles.resultUrl}>{r.source || r.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
