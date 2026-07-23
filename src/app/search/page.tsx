"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isListening, isListeningSet] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        isListeningSet(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setQuery(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onend = () => {
        isListeningSet(false);
      };

      recognitionRef.current.onerror = () => {
        isListeningSet(false);
      };
    }
  }, []);

  // Handle spacebar for speech input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (recognitionRef.current && !isListening) {
          recognitionRef.current.start();
        }
      } else if (e.key === "Enter" && inputRef.current !== e.target) {
        e.preventDefault();
        performSearch();
      } else if (e.key === "ArrowDown" && results.length > 0) {
        e.preventDefault();
        setSelectedResultIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp" && results.length > 0) {
        e.preventDefault();
        setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isListening, results.length]);

  const performSearch = async () => {
    if (!query.trim()) return;

    try {
      const API_KEY = "47095da0d40c315c586d477a7512e7a9a16ab15a";

      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Map Serper API results to our format
      const searchResults = (data.organic || []).map((item: any, index: number) => ({
        id: index + 1,
        title: item.title,
        description: item.snippet,
        url: item.link,
      }));

      setResults(searchResults);
      setSelectedResultIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      alert("Search failed. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const handleMicClick = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    }
  };

  const navigateToResult = () => {
    if (selectedResultIndex >= 0 && results[selectedResultIndex]) {
      router.push(results[selectedResultIndex].url);
    }
  };

  useEffect(() => {
    if (selectedResultIndex >= 0 && results[selectedResultIndex]) {
      const resultElement = document.getElementById(`result-${selectedResultIndex}`);
      resultElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      resultElement?.focus();
    }
  }, [selectedResultIndex, results]);

  return (
    <div className="search-page">
      <div className="search-header">
        <Link href="/" className="search-back-link" aria-label="Back to home">
          ← Back
        </Link>
      </div>

      <main className="search-container">
        <h1 className="search-title">TacK</h1>

        <div className="search-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Search TacK..."
            className="search-input"
            aria-label="Search input"
          />
          <button
            onClick={handleMicClick}
            className={`search-mic-button ${isListening ? "listening" : ""}`}
            aria-label={isListening ? "Stop listening" : "Start voice search"}
            title="Hold spacebar to speak, release to stop"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>

        {!results.length && (
          <div className="search-instructions">
            <p>Hold <kbd>Spacebar</kbd> to speak</p>
            <p>Press <kbd>Enter</kbd> to search</p>
            <p>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate results</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="search-results">
            <p className="results-count">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            <ul className="results-list" role="listbox">
              {results.map((result, index) => (
                <li
                  key={result.id}
                  id={`result-${index}`}
                  className={`result-item ${selectedResultIndex === index ? "selected" : ""}`}
                  role="option"
                  aria-selected={selectedResultIndex === index}
                  onClick={() => {
                    setSelectedResultIndex(index);
                    navigateToResult();
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") navigateToResult(); }}
                  tabIndex={selectedResultIndex === index ? 0 : -1}
                >
                  <h3 className="result-title">{result.title}</h3>
                  <p className="result-description">{result.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <style jsx>{`
        .search-page { min-height: 100vh; background: var(--background); color: var(--foreground); }
        .search-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); }
        .search-back-link { color: var(--primary); text-decoration: none; font-size: 0.9rem; transition: opacity 0.3s; }
        .search-back-link:hover { opacity: 0.8; }
        .search-container { max-width: 600px; margin: 0 auto; padding: 4rem 2rem; text-align: center; }
        .search-title { font-size: 2.5rem; font-weight: 700; margin-bottom: 3rem; font-family: 'Playfair Display', serif; }
        .search-input-wrapper { position: relative; margin-bottom: 2rem; }
        .search-input { width: 100%; padding: 0.875rem 2.5rem 0.875rem 1.25rem; border: 2px solid var(--border); border-radius: 0.5rem; background: var(--card); color: var(--foreground); font-size: 1rem; outline: none; }
        .search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(255, 60, 62, 0.1); }
        .search-mic-button { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--muted-foreground); cursor: pointer; padding: 0.5rem; }
        .search-mic-button:hover { color: var(--primary); }
        .search-mic-button.listening { color: var(--primary); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .search-instructions { margin-top: 3rem; color: var(--muted-foreground); font-size: 0.9rem; }
        .search-instructions kbd { background: var(--card); border: 1px solid var(--border); padding: 0.25rem 0.5rem; font-family: monospace; }
        .search-results { text-align: left; margin-top: 2rem; }
        .results-count { color: var(--muted-foreground); font-size: 0.9rem; margin-bottom: 1rem; }
        .results-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .result-item { padding: 1rem; border: 2px solid var(--border); border-radius: 0.5rem; background: var(--card); cursor: pointer; }
        .result-item:hover { border-color: var(--primary); background: rgba(255, 60, 62, 0.05); }
        .result-item.selected { border-color: var(--primary); background: rgba(255, 60, 62, 0.1); box-shadow: 0 0 0 3px rgba(255, 60, 62, 0.1); }
        .result-title { margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; }
        .result-description { margin: 0; font-size: 0.9rem; color: var(--muted-foreground); }
      `}</style>
    </div>
  );
}
