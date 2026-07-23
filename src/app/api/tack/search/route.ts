import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { z } from "zod";
import { serperSearch } from "@/lib/serper";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * TACK search API — an accessibility-first web search endpoint.
 *
 * Backend choice: this reuses the repo's existing Serper.dev integration
 * (`SERPER_API_KEY`), which returns Google search results (title, snippet,
 * link) — exactly the fields TACK needs. Serper was chosen over the two APIs
 * named in the brief because:
 *   • Microsoft retired the Bing Web Search API in August 2025.
 *   • Serper is already wired up and keyed in this codebase, so no new
 *     credential or dependency is required.
 * To swap in Google's Programmable Search JSON API instead, replace the
 * `serperSearch` call below and set GOOGLE_SEARCH_API_KEY / GOOGLE_SEARCH_CX
 * (see .env.example).
 *
 * Every response — success OR error — carries a plain-text `message` field
 * written to be read aloud by a screen reader.
 */

const searchSchema = z.object({
  q: z.string().trim().min(1, "Please type something to search for.").max(500),
});

// How many results TACK returns per search. Kept modest so a screen-reader
// user can page through the whole list with arrow keys without fatigue.
const RESULTS_PER_SEARCH = 8;

export interface TackResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

interface TackSearchResponseBody {
  query: string;
  count: number;
  results: TackResult[];
  message: string;
}

/** Extract a clean, human-readable source domain from a result URL. */
function sourceDomain(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    userId = null;
  }
  if (!userId) {
    return NextResponse.json(
      { error: "You need to be signed in to search." },
      { status: 401 }
    );
  }

  // ── Rate limit ────────────────────────────────────────────────────────
  const { allowed } = checkRateLimit(`tack-search:${userId}`, 30, 60000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many searches. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  // ── Parse & validate ──────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please type something to search for." },
      { status: 400 }
    );
  }

  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Please type something to search for.",
      },
      { status: 400 }
    );
  }

  const query = parsed.data.q;

  // ── Search ────────────────────────────────────────────────────────────
  let organic: Awaited<ReturnType<typeof serperSearch>>["organic"];
  try {
    const data = await serperSearch(query, RESULTS_PER_SEARCH);
    organic = data.organic ?? [];
  } catch (err) {
    console.error("TACK search failed:", err);
    return NextResponse.json(
      {
        error:
          "Search is temporarily unavailable. Please try again in a moment.",
      },
      { status: 502 }
    );
  }

  const results: TackResult[] = organic
    .filter((r) => r.title && r.link)
    .map((r) => ({
      title: r.title,
      snippet: r.snippet ?? "",
      url: r.link,
      source: sourceDomain(r.link),
    }));

  if (results.length === 0) {
    const emptyBody: TackSearchResponseBody = {
      query,
      count: 0,
      results: [],
      message: `No results found for “${query}”. Try different or more general words.`,
    };
    return NextResponse.json(emptyBody, { status: 200 });
  }

  const responseBody: TackSearchResponseBody = {
    query,
    count: results.length,
    results,
    message: `${results.length} result${
      results.length === 1 ? "" : "s"
    } found for “${query}”.`,
  };
  return NextResponse.json(responseBody, { status: 200 });
}
