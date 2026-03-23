/**
 * Serper.dev — Google Search & Web Scrape integration.
 *
 * Endpoints used:
 *   POST https://google.serper.dev/search   → structured Google SERP results
 *   POST https://scrape.serper.dev           → clean text from a URL
 *
 * All calls require the `SERPER_API_KEY` env variable.
 */

const SERPER_SEARCH_URL = "https://google.serper.dev/search";
const SERPER_SCRAPE_URL = "https://scrape.serper.dev";

// ─── Types ──────────────────────────────────────────────────────

export interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

export interface SerperSearchResponse {
  searchParameters: {
    q: string;
    type: string;
    engine: string;
  };
  organic: SerperSearchResult[];
  knowledgeGraph?: {
    title?: string;
    type?: string;
    description?: string;
    attributes?: Record<string, string>;
  };
  answerBox?: {
    title?: string;
    answer?: string;
    snippet?: string;
  };
}

export interface SerperScrapeResponse {
  text: string;
  markdown?: string;
  metadata?: {
    title?: string;
    description?: string;
    url?: string;
  };
}

// ─── Helpers ────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.SERPER_API_KEY;
  if (!key) {
    throw new Error(
      "SERPER_API_KEY is not set. Add it to your .env.local file."
    );
  }
  return key;
}

// ─── Search ─────────────────────────────────────────────────────

/**
 * Perform a Google search via Serper.dev and return structured results.
 *
 * @param query  — the search query string
 * @param num    — number of results to return (default 5, max ~100)
 */
export async function serperSearch(
  query: string,
  num = 5
): Promise<SerperSearchResponse> {
  const res = await fetch(SERPER_SEARCH_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Serper search failed (${res.status}): ${body}`);
  }

  return res.json();
}

// ─── Scrape ─────────────────────────────────────────────────────

/**
 * Scrape a URL via Serper.dev and return clean text content.
 * Great for extracting readable content from web pages for
 * /summarize and /read commands.
 *
 * @param url — the page URL to scrape
 */
export async function serperScrape(
  url: string
): Promise<SerperScrapeResponse> {
  const res = await fetch(SERPER_SCRAPE_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Serper scrape failed (${res.status}): ${body}`);
  }

  return res.json();
}

// ─── Combined: search + gather context ──────────────────────────

/**
 * Search Google and return a formatted text block of the top results,
 * suitable for injecting into an AI prompt as context.
 */
export async function serperSearchContext(
  query: string,
  num = 5
): Promise<string> {
  const data = await serperSearch(query, num);

  const parts: string[] = [];

  // Include answer box if present
  if (data.answerBox) {
    parts.push(
      `## Answer Box\n${data.answerBox.answer || data.answerBox.snippet || ""}`
    );
  }

  // Include knowledge graph if present
  if (data.knowledgeGraph) {
    const kg = data.knowledgeGraph;
    let kgText = `## Knowledge Graph: ${kg.title || ""}`;
    if (kg.type) kgText += ` (${kg.type})`;
    if (kg.description) kgText += `\n${kg.description}`;
    if (kg.attributes) {
      const attrs = Object.entries(kg.attributes)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n");
      kgText += `\n${attrs}`;
    }
    parts.push(kgText);
  }

  // Organic results
  if (data.organic && data.organic.length > 0) {
    const resultsText = data.organic
      .map(
        (r, i) =>
          `${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.link}`
      )
      .join("\n\n");
    parts.push(`## Search Results\n${resultsText}`);
  }

  return parts.join("\n\n");
}

/**
 * Scrape a URL and return a formatted text block of the page content,
 * suitable for injecting into an AI prompt as context.
 * Automatically truncates very long pages to stay within token limits.
 */
export async function serperScrapeContext(
  url: string,
  maxChars = 15000
): Promise<{ content: string; title?: string }> {
  const data = await serperScrape(url);

  // Prefer markdown if available, fall back to plain text
  let content = data.markdown || data.text || "";

  // Truncate to avoid token blowout
  if (content.length > maxChars) {
    content = content.slice(0, maxChars) + "\n\n[Content truncated due to length]";
  }

  return {
    content,
    title: data.metadata?.title,
  };
}
