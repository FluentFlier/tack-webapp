# Tack Features V2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the remaining Tack features: web content extraction with source links, faithful AI summarization, image alt-text generation, in-app accessible reader, AI voice assistant, and PDF reading page.

**Architecture:** All new features are API routes in the existing Next.js 14 App Router, using InsForge BaaS for auth/database/AI (GPT-4o-mini). Web content extraction uses server-side fetch + HTML parsing. PDF processing uses pdf-parse on the server. Voice uses the Web Speech API (browser-native, no external service). The in-app reader is a new route that renders cleaned HTML in a WCAG-formatted view.

**Tech Stack:** Next.js 14, TypeScript, InsForge SDK, Tailwind CSS 3.4, shadcn/ui, `@mozilla/readability` + `jsdom` (content extraction), `pdf-parse` (PDF), Web Speech API (voice)

**Existing Codebase Context:**
- InsForge client: `src/lib/insforge.ts` — uses `createClient` with baseUrl + anonKey
- Auth pattern: `import { auth } from "@insforge/nextjs/server"` → `const { token, userId } = await auth()`
- Server InsForge client: `createClient({ baseUrl, edgeFunctionToken: token })`
- Chat API: `src/app/api/chat/route.ts` — POST handler, creates conversations, saves messages, calls `insforge.ai.chat.completions.create()`
- Types: `src/types/index.ts` — Message has `metadata: MessageMetadata` with optional `source_url`, `command`
- Chat hook: `src/hooks/useChat.ts` — client-side state management, optimistic UI, command parsing
- Commands: `src/lib/commands.ts` — `/summarize <url>` and `/read <url>` exist but only modify the prompt text (no actual fetching)
- Chat message display: `src/components/chat/ChatMessage.tsx` — already renders `metadata.source_url` if present
- Protected layout: `src/app/(protected)/layout.tsx` — Header + Sidebar + main area
- All components use ARIA labels, roles, and focus management for accessibility

---

## Parallel Execution Groups

These task groups can be built in parallel by separate agents:

| Agent | Tasks | Dependencies |
|-------|-------|-------------|
| **Agent A: Content Extraction** | Tasks 1–3 | None |
| **Agent B: PDF Reader** | Tasks 4–6 | None |
| **Agent C: Voice Assistant** | Tasks 7–8 | None |
| **Agent D: Image Alt-Text** | Task 9 | None |

Tasks within each agent group are sequential.

---

## Agent A: Web Content Extraction + Source Links + Reader View

### Task 1: Web Content Extraction API

**Files:**
- Create: `src/app/api/extract/route.ts`
- Modify: `src/types/index.ts` (add ExtractedContent type)

**Step 1: Install dependencies**

```bash
npm install @mozilla/readability jsdom
npm install -D @types/jsdom
```

**Step 2: Add ExtractedContent type**

In `src/types/index.ts`, add after the existing types:

```typescript
export interface ExtractedContent {
  title: string;
  content: string;        // cleaned text content
  excerpt: string;        // short summary from readability
  byline: string | null;  // author
  siteName: string | null;
  url: string;
  images: { src: string; alt: string }[];
}
```

**Step 3: Create the extraction API route**

Create `src/app/api/extract/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Tack/1.0 (Accessibility Assistant)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json(
        { error: "Could not extract content from this page" },
        { status: 422 }
      );
    }

    // Extract images from the article HTML
    const articleDom = new JSDOM(article.content);
    const imgElements = articleDom.window.document.querySelectorAll("img");
    const images = Array.from(imgElements).map((img) => ({
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
    })).filter((img) => img.src);

    return NextResponse.json({
      title: article.title,
      content: article.textContent,
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName,
      url,
      images,
    });
  } catch (error) {
    console.error("Extract API error:", error);
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 4: Verify it builds**

```bash
npm run build
```
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/app/api/extract/route.ts src/types/index.ts package.json package-lock.json
git commit -m "feat: add web content extraction API with Readability"
```

---

### Task 2: Wire Extraction Into Chat + Source Links

**Files:**
- Modify: `src/app/api/chat/route.ts` (call extract API, include sources in response)
- Modify: `src/types/index.ts` (add `sources` to MessageMetadata)
- Modify: `src/components/chat/ChatMessage.tsx` (render multiple source links)

**Step 1: Update MessageMetadata type**

In `src/types/index.ts`, update `MessageMetadata`:

```typescript
export interface MessageMetadata {
  command?: string;
  source_url?: string;
  sources?: { title: string; url: string }[];
  processing_time_ms?: number;
}
```

**Step 2: Update chat API route to extract content before sending to AI**

Replace the full content of `src/app/api/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

// Extract URLs from message text
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  return [...new Set(text.match(urlRegex) || [])];
}

// Fetch and extract content from a URL
async function extractContent(url: string): Promise<{
  title: string;
  content: string;
  url: string;
} | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Tack/1.0 (Accessibility Assistant)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article) return null;

    // Truncate to ~4000 chars to stay within token limits
    const content = article.textContent.slice(0, 4000);
    return { title: article.title, content, url };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversation_id } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    // Create or use existing conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: conv, error: convError } = await insforge.database
        .from("conversations")
        .insert({ user_id: userId, title: message.slice(0, 100) })
        .select()
        .single();

      if (convError || !conv) {
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
      }
      convId = conv.id;
    }

    // Save user message
    await insforge.database.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
      metadata: {},
    });

    // Extract content from any URLs in the message
    const urls = extractUrls(message);
    const extractions = await Promise.all(urls.map(extractContent));
    const validExtractions = extractions.filter(Boolean) as {
      title: string;
      content: string;
      url: string;
    }[];

    // Build context with extracted content
    let contextBlock = "";
    const sources: { title: string; url: string }[] = [];
    if (validExtractions.length > 0) {
      contextBlock = "\n\n--- EXTRACTED WEB CONTENT ---\n";
      for (const ext of validExtractions) {
        contextBlock += `\nSource: ${ext.title} (${ext.url})\n${ext.content}\n---\n`;
        sources.push({ title: ext.title, url: ext.url });
      }
      contextBlock += "\n--- END EXTRACTED CONTENT ---\n";
    }

    const systemPrompt = `You are Tack, an AI assistant designed to help blind and visually impaired users access the internet.
Your responses should be:
- Clear and well-structured with logical flow
- Use plain language, avoiding visual references like "as you can see" or "the blue button"
- When describing web content, focus on the information hierarchy and meaning
- Use numbered lists and headings when organizing complex information
- Keep responses concise but thorough
- When summarizing extracted web content, faithfully represent the original meaning — do not add interpretations or opinions not present in the source
- Always indicate which source each piece of information comes from when multiple sources are provided
- If the extracted content is insufficient to answer the user's question, say so clearly`;

    const userContent = validExtractions.length > 0
      ? `${message}${contextBlock}\nBased on the extracted content above, please respond to my message. Cite sources by title when referencing information.`
      : message;

    // Get AI response
    const completion = await insforge.ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const assistantContent =
      completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Build metadata with sources
    const metadata: Record<string, unknown> = {};
    if (sources.length > 0) {
      metadata.sources = sources;
      metadata.source_url = sources[0].url;
    }

    // Save assistant message
    const { data: savedMessage, error: msgError } = await insforge.database
      .from("messages")
      .insert({
        conversation_id: convId,
        role: "assistant",
        content: assistantContent,
        metadata,
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
    }

    // Update conversation timestamp
    await insforge.database
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    return NextResponse.json({ message: savedMessage, conversation_id: convId });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 3: Update ChatMessage to render multiple source links**

Replace the full content of `src/components/chat/ChatMessage.tsx`:

```typescript
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Bot, User, ExternalLink } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const sources = message.metadata?.sources;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4",
        isAssistant && "bg-muted/50"
      )}
      role="article"
      aria-label={`${isAssistant ? "Tack" : "You"}: ${message.content.slice(0, 50)}${message.content.length > 50 ? "..." : ""}`}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          isAssistant ? "bg-primary text-primary-foreground" : "bg-background"
        )}
        aria-hidden="true"
      >
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <p className="text-sm font-medium">
          {isAssistant ? "Tack" : "You"}
        </p>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {sources && sources.length > 0 && (
          <div className="mt-2 space-y-1" aria-label="Sources">
            <p className="text-xs font-medium text-muted-foreground">Sources:</p>
            <ul className="list-none space-y-1">
              {sources.map((source, i) => (
                <li key={i}>
                  <a
                    href={`/reader?url=${encodeURIComponent(source.url)}`}
                    className="inline-flex items-center gap-1 text-xs text-primary underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    {source.title || source.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!sources && message.metadata?.source_url && (
          <p className="text-xs text-muted-foreground">
            Source:{" "}
            <a
              href={`/reader?url=${encodeURIComponent(message.metadata.source_url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {message.metadata.source_url}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Verify it builds**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/app/api/chat/route.ts src/types/index.ts src/components/chat/ChatMessage.tsx
git commit -m "feat: wire web extraction into chat with source links"
```

---

### Task 3: In-App Accessible Reader View

**Files:**
- Create: `src/app/(protected)/reader/page.tsx`

**Step 1: Create the reader page**

Create `src/app/(protected)/reader/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LiveRegion } from "@/components/a11y";
import { ArrowLeft, Volume2 } from "lucide-react";
import Link from "next/link";
import type { ExtractedContent } from "@/types";

export default function ReaderPage() {
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
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to Chat
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <LiveRegion message={statusMessage} />

      <nav aria-label="Reader navigation" className="flex items-center gap-2">
        <Link href="/chat">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to Chat
          </Button>
        </Link>
      </nav>

      <article aria-label={content.title}>
        <header className="space-y-2 mb-6">
          <h1 className="text-2xl font-bold">{content.title}</h1>
          {content.byline && (
            <p className="text-sm text-muted-foreground">By {content.byline}</p>
          )}
          {content.siteName && (
            <p className="text-sm text-muted-foreground">
              From {content.siteName} —{" "}
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline focus:outline-none focus:ring-2 focus:ring-ring"
              >
                View original
              </a>
            </p>
          )}
        </header>

        {content.excerpt && (
          <div className="border-l-4 border-primary pl-4 mb-6">
            <p className="text-muted-foreground italic">{content.excerpt}</p>
          </div>
        )}

        <div className="prose prose-lg max-w-none dark:prose-invert leading-relaxed">
          {content.content.split("\n\n").map((paragraph, i) =>
            paragraph.trim() ? (
              <p key={i} className="mb-4">{paragraph.trim()}</p>
            ) : null
          )}
        </div>
      </article>
    </div>
  );
}
```

**Step 2: Verify it builds**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/\(protected\)/reader/page.tsx
git commit -m "feat: add in-app accessible reader view for web content"
```

---

## Agent B: PDF Reading Page

### Task 4: PDF Upload API

**Files:**
- Create: `src/app/api/pdf/route.ts`
- Modify: `src/types/index.ts` (add PDFContent type)

**Step 1: Install dependencies**

```bash
npm install pdf-parse
```

Note: `pdf-parse` has built-in types. If TypeScript complains, create a declaration file.

**Step 2: Add PDFContent type**

In `src/types/index.ts`, add:

```typescript
export interface PDFContent {
  text: string;           // raw extracted text
  numPages: number;
  title: string | null;   // from PDF metadata
  author: string | null;
  simplified: string;     // cleaned/simplified text
}
```

**Step 3: Create PDF extraction API**

Create `src/app/api/pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import pdfParse from "pdf-parse";

// Simple text cleanup — remove excessive whitespace, fix line breaks
function simplifyText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(\w)-\n(\w)/g, "$1$2") // fix hyphenated line breaks
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    // 20MB limit
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);

    const simplified = simplifyText(data.text);

    return NextResponse.json({
      text: data.text,
      numPages: data.numpages,
      title: data.info?.Title || file.name.replace(/\.pdf$/i, ""),
      author: data.info?.Author || null,
      simplified,
    });
  } catch (error) {
    console.error("PDF API error:", error);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}
```

**Step 4: Verify it builds**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/app/api/pdf/route.ts src/types/index.ts package.json package-lock.json
git commit -m "feat: add PDF upload and text extraction API"
```

---

### Task 5: PDF Summarization API

**Files:**
- Create: `src/app/api/pdf/summarize/route.ts`

**Step 1: Create PDF summarization endpoint**

Create `src/app/api/pdf/summarize/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, title } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    // Truncate to fit token limits (~16k chars ≈ 4k tokens)
    const truncated = text.slice(0, 16000);

    const completion = await insforge.ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Tack, an AI assistant for blind and visually impaired users.
Summarize the following document faithfully and accurately.
- Do not add interpretations or opinions not present in the source
- Preserve the key points, structure, and meaning of the original text
- Use clear, well-structured language with numbered lists for key points
- Start with a one-sentence overview, then list key points
- End with any important details or caveats from the document`,
        },
        {
          role: "user",
          content: `Please summarize this document titled "${title || "Untitled"}":\n\n${truncated}`,
        },
      ],
    });

    const summary =
      completion.choices[0]?.message?.content || "Unable to generate summary.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("PDF summarize error:", error);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
```

**Step 2: Verify it builds**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/api/pdf/summarize/route.ts
git commit -m "feat: add PDF AI summarization endpoint"
```

---

### Task 6: PDF Reader Page UI

**Files:**
- Create: `src/app/(protected)/pdf/page.tsx`
- Modify: `src/components/layout/Header.tsx` (add PDF nav link)

**Step 1: Create the PDF reader page**

Create `src/app/(protected)/pdf/page.tsx`:

```typescript
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveRegion } from "@/components/a11y";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import type { PDFContent } from "@/types";

type ViewMode = "upload" | "reading" | "summary";

export default function PDFPage() {
  const [pdfContent, setPdfContent] = useState<PDFContent | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("upload");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setLoading(true);
    setStatusMessage("Processing PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process PDF");
      }

      const data: PDFContent = await response.json();
      setPdfContent(data);
      setViewMode("reading");
      setStatusMessage(`Loaded: ${data.title || file.name}, ${data.numPages} pages`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process PDF");
      setStatusMessage("Error processing PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!pdfContent) return;
    setSummarizing(true);
    setStatusMessage("Generating AI summary...");

    try {
      const response = await fetch("/api/pdf/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pdfContent.simplified,
          title: pdfContent.title,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to summarize");
      }

      const data = await response.json();
      setSummary(data.summary);
      setViewMode("summary");
      setStatusMessage("Summary generated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize");
    } finally {
      setSummarizing(false);
    }
  };

  const handleReset = () => {
    setPdfContent(null);
    setSummary(null);
    setViewMode("upload");
    setError(null);
    setStatusMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <LiveRegion message={statusMessage} />

      <div>
        <h1 className="text-2xl font-bold">PDF Reader</h1>
        <p className="text-muted-foreground mt-1">
          Upload a PDF to read in a simplified, accessible format
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </p>
      )}

      {viewMode === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <label
              htmlFor="pdf-upload"
              className="flex flex-col items-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary focus-within:ring-2 focus-within:ring-ring transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">
                {loading ? "Processing..." : "Click to select a PDF file (max 20MB)"}
              </span>
              <input
                ref={fileInputRef}
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
                disabled={loading}
              />
            </label>
          </CardContent>
        </Card>
      )}

      {viewMode !== "upload" && pdfContent && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
              New PDF
            </Button>
            <Button
              variant={viewMode === "reading" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("reading")}
            >
              <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
              Simplified Text
            </Button>
            <Button
              variant={viewMode === "summary" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (summary) {
                  setViewMode("summary");
                } else {
                  handleSummarize();
                }
              }}
              disabled={summarizing}
            >
              {summarizing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              {summarizing ? "Summarizing..." : "AI Summary"}
            </Button>
          </div>

          <article aria-label={pdfContent.title || "PDF Document"}>
            <header className="space-y-1 mb-4">
              <h2 className="text-xl font-semibold">{pdfContent.title}</h2>
              {pdfContent.author && (
                <p className="text-sm text-muted-foreground">By {pdfContent.author}</p>
              )}
              <p className="text-sm text-muted-foreground">{pdfContent.numPages} pages</p>
            </header>

            <div className="prose prose-lg max-w-none dark:prose-invert leading-relaxed">
              {viewMode === "reading" &&
                pdfContent.simplified.split("\n\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="mb-4">{paragraph.trim()}</p>
                  ) : null
                )}
              {viewMode === "summary" && summary &&
                summary.split("\n\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="mb-4 whitespace-pre-wrap">{paragraph.trim()}</p>
                  ) : null
                )}
            </div>
          </article>
        </>
      )}
    </div>
  );
}
```

**Step 2: Add PDF link to Header navigation**

In `src/components/layout/Header.tsx`, add a nav link to `/pdf` next to the existing navigation. Find where the settings link is and add a PDF link alongside it. The exact edit depends on the current Header content — look for the nav section and add:

```tsx
<Link
  href="/pdf"
  className={cn(
    "text-sm transition-colors hover:text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring rounded",
    pathname === "/pdf" ? "text-foreground" : "text-foreground/60"
  )}
>
  PDF Reader
</Link>
```

**Step 3: Verify it builds**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/\(protected\)/pdf/page.tsx src/components/layout/Header.tsx
git commit -m "feat: add PDF reader page with upload, simplified view, and AI summary"
```

---

## Agent C: AI Voice Assistant

### Task 7: Voice Input/Output Hook

**Files:**
- Create: `src/hooks/useVoice.ts`

**Step 1: Create the voice hook using Web Speech API**

Create `src/hooks/useVoice.ts`:

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  lang?: string;
}

export function useVoice({ onTranscript, lang = "en-US" }: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition && !!window.speechSynthesis);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang;

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript && onTranscript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    synthRef.current = window.speechSynthesis || null;
  }, [lang, onTranscript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        // Already started
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for accessibility
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [lang]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    supported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
```

**Step 2: Add Web Speech API type declarations**

Create `src/types/speech.d.ts`:

```typescript
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}
```

**Step 3: Verify it builds**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/hooks/useVoice.ts src/types/speech.d.ts
git commit -m "feat: add voice input/output hook using Web Speech API"
```

---

### Task 8: Voice Assistant UI + Hotkey

**Files:**
- Modify: `src/components/chat/ChatInput.tsx` (add voice button + hotkey)
- Modify: `src/app/(protected)/chat/page.tsx` (wire voice to auto-read responses)
- Modify: `src/app/(protected)/chat/[id]/page.tsx` (same)

**Step 1: Add voice button to ChatInput**

Replace `src/components/chat/ChatInput.tsx`:

```typescript
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Mic, MicOff } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { useVoice } from "@/hooks/useVoice";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
    // Auto-send voice input
    if (text.trim()) {
      onSend(text.trim());
      setInput("");
    }
  }, [onSend]);

  const { isListening, supported, startListening, stopListening } = useVoice({
    onTranscript: handleVoiceTranscript,
  });

  // Hotkey: Alt+V to toggle voice
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === "v") {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening, startListening, stopListening]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    setShowCommands(false);
    textareaRef.current?.focus();
  }, [input, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommands(true);
      setCommandFilter(value.slice(1));
    } else {
      setShowCommands(false);
    }
  };

  const handleCommandSelect = (command: string) => {
    setInput(command);
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="relative flex items-end gap-2 max-w-3xl mx-auto"
      >
        <CommandPalette
          filter={commandFilter}
          onSelect={handleCommandSelect}
          visible={showCommands}
        />
        <label htmlFor="chat-input" className="sr-only">
          Type your message or a slash command
        </label>
        <Textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Type a message or /help for commands..."}
          disabled={disabled || isListening}
          rows={1}
          className="min-h-[44px] max-h-32 resize-none"
          aria-describedby="input-hint"
        />
        <span id="input-hint" className="sr-only">
          Press Enter to send, Shift+Enter for a new line. Type / for commands.
          {supported && " Press Alt+V to use voice input."}
        </span>
        {supported && (
          <Button
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            onClick={() => (isListening ? stopListening() : startListening())}
            aria-label={isListening ? "Stop listening" : "Start voice input (Alt+V)"}
            className="shrink-0 h-[44px] w-[44px]"
          >
            {isListening ? (
              <MicOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Mic className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !input.trim()}
          aria-label="Send message"
          className="shrink-0 h-[44px] w-[44px]"
        >
          <SendHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
```

**Step 2: Add auto-read to chat pages**

Replace `src/app/(protected)/chat/page.tsx`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { ChatHistory, ChatInput } from "@/components/chat";
import { LiveRegion } from "@/components/a11y";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";

export default function ChatPage() {
  const { messages, loading, error, sendMessage } = useChat();
  const { speak } = useVoice();
  const prevMessageCountRef = useRef(0);

  // Auto-read new assistant messages
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        speak(lastMessage.content.slice(0, 500)); // Limit speech length
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, speak]);

  return (
    <div className="flex flex-col h-full">
      <LiveRegion
        message={
          loading
            ? "Tack is thinking..."
            : error
              ? error
              : messages.length > 0
                ? `Tack responded: ${messages[messages.length - 1]?.content.slice(0, 100)}`
                : ""
        }
      />
      <ChatHistory messages={messages} loading={loading} />
      <ChatInput onSend={sendMessage} disabled={loading} />
      {error && (
        <p role="alert" className="px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
```

Replace `src/app/(protected)/chat/[id]/page.tsx`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { ChatHistory, ChatInput } from "@/components/chat";
import { LiveRegion } from "@/components/a11y";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { messages, loading, error, sendMessage, loadMessages } =
    useChat(conversationId);
  const { speak } = useVoice();
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId, loadMessages]);

  // Auto-read new assistant messages
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        speak(lastMessage.content.slice(0, 500));
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, speak]);

  return (
    <div className="flex flex-col h-full">
      <LiveRegion
        message={
          loading
            ? "Tack is thinking..."
            : error
              ? error
              : messages.length > 0
                ? `Tack responded: ${messages[messages.length - 1]?.content.slice(0, 100)}`
                : ""
        }
      />
      <ChatHistory messages={messages} loading={loading} />
      <ChatInput onSend={sendMessage} disabled={loading} />
      {error && (
        <p role="alert" className="px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
```

**Step 3: Verify it builds**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/components/chat/ChatInput.tsx src/app/\(protected\)/chat/page.tsx src/app/\(protected\)/chat/\[id\]/page.tsx
git commit -m "feat: add voice assistant with Alt+V hotkey and auto-read responses"
```

---

## Agent D: Image Alt-Text Generation

### Task 9: Image Alt-Text API + Integration

**Files:**
- Create: `src/app/api/alt-text/route.ts`

**Step 1: Create alt-text generation endpoint**

Create `src/app/api/alt-text/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await auth();
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl, pageContext } = await request.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    const completion = await insforge.ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an accessibility assistant. Generate concise, descriptive alt text for images.
Rules:
- Describe what the image shows in 1-2 sentences
- Focus on the content and function of the image, not decorative aspects
- If the image contains text, include that text
- If context is provided about the surrounding page content, use it to write more relevant alt text
- Do not start with "Image of" or "Picture of"
- Keep it under 125 characters when possible`,
        },
        {
          role: "user",
          content: `Generate alt text for this image: ${imageUrl}${pageContext ? `\n\nPage context: ${pageContext}` : ""}`,
        },
      ],
    });

    const altText =
      completion.choices[0]?.message?.content || "Image description unavailable";

    return NextResponse.json({ altText, imageUrl });
  } catch (error) {
    console.error("Alt-text API error:", error);
    return NextResponse.json({ error: "Failed to generate alt text" }, { status: 500 });
  }
}
```

**Step 2: Wire alt-text generation into the extract API**

In `src/app/api/extract/route.ts`, after extracting images from the article, add an alt-text generation step for images that lack alt text. Add this logic inside the POST handler, after the `images` array is built but before the response is returned:

At the end of the POST handler in `src/app/api/extract/route.ts`, replace the return statement with:

```typescript
    // Generate alt text for images missing it
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    const imagesWithAlt = await Promise.all(
      images.slice(0, 5).map(async (img) => {  // Limit to 5 images
        if (img.alt) return img;
        try {
          const completion = await insforge.ai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Generate concise alt text for this image in under 125 characters. Do not start with 'Image of'. Just output the alt text.",
              },
              {
                role: "user",
                content: `Image URL: ${img.src}\nPage title: ${article.title}`,
              },
            ],
          });
          return {
            ...img,
            alt: completion.choices[0]?.message?.content || "Image",
            generated: true,
          };
        } catch {
          return { ...img, alt: "Image", generated: true };
        }
      })
    );

    return NextResponse.json({
      title: article.title,
      content: article.textContent,
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName,
      url,
      images: imagesWithAlt,
    });
```

**Note:** This requires importing `createClient` at the top of the extract route (it may not be imported yet):

```typescript
import { createClient } from "@insforge/sdk";
```

And the `auth()` call is already at the top of the handler, so `token` is available.

**Step 3: Verify it builds**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/api/alt-text/route.ts src/app/api/extract/route.ts
git commit -m "feat: add automated image alt-text generation for extracted content"
```

---

## Summary of All Tasks

| # | Task | Agent | New Files | Modified Files |
|---|------|-------|-----------|----------------|
| 1 | Web Content Extraction API | A | `src/app/api/extract/route.ts` | `src/types/index.ts` |
| 2 | Wire Extraction Into Chat + Source Links | A | — | `src/app/api/chat/route.ts`, `src/types/index.ts`, `src/components/chat/ChatMessage.tsx` |
| 3 | In-App Accessible Reader View | A | `src/app/(protected)/reader/page.tsx` | — |
| 4 | PDF Upload API | B | `src/app/api/pdf/route.ts` | `src/types/index.ts` |
| 5 | PDF Summarization API | B | `src/app/api/pdf/summarize/route.ts` | — |
| 6 | PDF Reader Page UI | B | `src/app/(protected)/pdf/page.tsx` | `src/components/layout/Header.tsx` |
| 7 | Voice Input/Output Hook | C | `src/hooks/useVoice.ts`, `src/types/speech.d.ts` | — |
| 8 | Voice Assistant UI + Hotkey | C | — | `src/components/chat/ChatInput.tsx`, `src/app/(protected)/chat/page.tsx`, `src/app/(protected)/chat/[id]/page.tsx` |
| 9 | Image Alt-Text Generation | D | `src/app/api/alt-text/route.ts` | `src/app/api/extract/route.ts` |

**Dependency order:** Task 9 depends on Task 1 (modifies the extract route created in Task 1). All other tasks are independent across agents. Within each agent, tasks are sequential.

**Recommended execution:** Run Agents A, B, C in parallel. Run Agent D after Agent A completes Task 1.
