# Tack Next.js Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundational Next.js template for Tack, an accessible AI chat assistant for blind users, with auth, chat interface, slash commands, and full documentation.

**Architecture:** Next.js 14 App Router with Server Components, InsForge BaaS for auth/database/AI, Tailwind CSS 3.4 + shadcn/ui for accessible UI. Single application — no separate backend.

**Tech Stack:** Next.js 14, TypeScript 5, Tailwind CSS 3.4, shadcn/ui (Radix), InsForge SDK (`@insforge/sdk`, `@insforge/nextjs`), Zod

**InsForge Config:**
- Base URL: `https://5bycmn95.us-west.insforge.app`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDQ2Njd9.pTZuBc1qQHOHZNwAL7uV1jJdbum3pQkYXPb9GUNjFEM`
- AI Model: `openai/gpt-4o-mini` (fast, cheap for dev)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.env.local`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/anirudhmanjesh/EPICS/tack-webapp
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

Note: If it asks to overwrite, say yes. The `--src-dir` flag creates `src/` directory structure.

**Step 2: Install core dependencies**

```bash
npm install @insforge/sdk@latest @insforge/nextjs@latest zod class-variance-authority clsx tailwind-merge lucide-react
```

**Step 3: Install dev dependencies**

```bash
npm install -D @types/node
```

**Step 4: Create .env.local**

Write `.env.local`:
```
NEXT_PUBLIC_INSFORGE_BASE_URL=https://5bycmn95.us-west.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDQ2Njd9.pTZuBc1qQHOHZNwAL7uV1jJdbum3pQkYXPb9GUNjFEM
```

**Step 5: Create .env.example**

Write `.env.example`:
```
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-app.region.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key-here
```

**Step 6: Update .gitignore to include .env.local**

Ensure `.env.local` is in `.gitignore` (create-next-app should handle this).

**Step 7: Verify it builds**

Run: `npm run build`
Expected: Successful build

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js 14 project with dependencies"
```

---

## Task 2: shadcn/ui Setup + Utility Functions

**Files:**
- Create: `src/lib/utils.ts`
- Create: `components.json`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

This creates `components.json` and updates `tailwind.config.ts` and `globals.css`.

**Step 2: Add essential shadcn/ui components**

```bash
npx shadcn@latest add button input textarea card dialog dropdown-menu label separator toast
```

**Step 3: Verify the cn() utility exists**

Read `src/lib/utils.ts` and confirm it contains:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: initialize shadcn/ui with core components"
```

---

## Task 3: InsForge Client + Auth Infrastructure

**Files:**
- Create: `src/lib/insforge.ts`
- Create: `src/app/api/auth/route.ts`
- Create: `src/app/providers.tsx`
- Create: `middleware.ts` (project root, NOT in src/)
- Modify: `src/app/layout.tsx`

**Step 1: Create InsForge client**

Write `src/lib/insforge.ts`:
```typescript
import { createClient } from "@insforge/sdk";

export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});
```

**Step 2: Create auth API route**

Write `src/app/api/auth/route.ts`:
```typescript
import { createAuthRouteHandlers } from "@insforge/nextjs/api";

const handlers = createAuthRouteHandlers({
  baseUrl:
    process.env.NEXT_PUBLIC_INSFORGE_BASE_URL ||
    "https://5bycmn95.us-west.insforge.app",
});

export const POST = handlers.POST;
export const GET = handlers.GET;
export const DELETE = handlers.DELETE;
```

**Step 3: Create InsforgeProvider**

Write `src/app/providers.tsx`:
```typescript
"use client";

import { InsforgeBrowserProvider } from "@insforge/nextjs";
import { insforge } from "@/lib/insforge";

export function InsforgeProvider({ children }: { children: React.ReactNode }) {
  return (
    <InsforgeBrowserProvider client={insforge} afterSignInUrl="/chat">
      {children}
    </InsforgeBrowserProvider>
  );
}
```

**Step 4: Create middleware**

Write `middleware.ts` (in project root):
```typescript
import { InsforgeMiddleware } from "@insforge/nextjs/middleware";

export default InsforgeMiddleware({
  baseUrl:
    process.env.NEXT_PUBLIC_INSFORGE_BASE_URL ||
    "https://5bycmn95.us-west.insforge.app",
  publicRoutes: ["/"],
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 5: Update root layout**

Write `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { InsforgeProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tack - Accessible AI Assistant",
  description:
    "AI-powered web assistant designed for blind and visually impaired users",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <InsforgeProvider>
          <div id="main-content" tabIndex={-1} className="min-h-screen">
            {children}
          </div>
        </InsforgeProvider>
      </body>
    </html>
  );
}
```

**Step 6: Verify build**

Run: `npm run build`
Expected: Successful build

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add InsForge auth infrastructure with middleware and provider"
```

---

## Task 4: Database Schema

**Step 1: Create conversations table**

Use InsForge MCP `run-raw-sql`:
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

**Step 2: Create messages table**

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

**Step 3: Create user_preferences table**

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  font_size TEXT NOT NULL DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'x-large')),
  screen_reader_verbosity TEXT NOT NULL DEFAULT 'normal' CHECK (screen_reader_verbosity IN ('concise', 'normal', 'verbose')),
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 4: Enable RLS on all tables**

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
```

**Step 5: Commit (no files changed, schema is remote)**

No git commit needed — schema lives in InsForge.

---

## Task 5: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Write shared types**

Write `src/types/index.ts`:
```typescript
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: MessageMetadata;
  created_at: string;
}

export interface MessageMetadata {
  command?: string;
  source_url?: string;
  processing_time_ms?: number;
}

export interface UserPreferences {
  user_id: string;
  high_contrast: boolean;
  font_size: "small" | "medium" | "large" | "x-large";
  screen_reader_verbosity: "concise" | "normal" | "verbose";
  reduced_motion: boolean;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: Message;
  conversation_id: string;
}

export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  execute: (args: string) => string;
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts && git commit -m "feat: add shared TypeScript types"
```

---

## Task 6: Accessibility Components

**Files:**
- Create: `src/components/a11y/LiveRegion.tsx`
- Create: `src/components/a11y/ScreenReaderOnly.tsx`
- Create: `src/components/a11y/FocusManager.tsx`
- Create: `src/components/a11y/index.ts`

**Step 1: Create LiveRegion component**

Write `src/components/a11y/LiveRegion.tsx`:
```typescript
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
  const timeoutRef = useRef<NodeJS.Timeout>();

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
```

**Step 2: Create ScreenReaderOnly component**

Write `src/components/a11y/ScreenReaderOnly.tsx`:
```typescript
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function ScreenReaderOnly({
  children,
  as: Tag = "span",
}: ScreenReaderOnlyProps) {
  return <Tag className="sr-only">{children}</Tag>;
}
```

**Step 3: Create FocusManager component**

Write `src/components/a11y/FocusManager.tsx`:
```typescript
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
```

**Step 4: Create barrel export**

Write `src/components/a11y/index.ts`:
```typescript
export { LiveRegion } from "./LiveRegion";
export { ScreenReaderOnly } from "./ScreenReaderOnly";
export { FocusManager } from "./FocusManager";
```

**Step 5: Commit**

```bash
git add src/components/a11y/ && git commit -m "feat: add accessibility components (LiveRegion, ScreenReaderOnly, FocusManager)"
```

---

## Task 7: Layout Components (Header + Sidebar)

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/index.ts`

**Step 1: Create Header**

Write `src/components/layout/Header.tsx`:
```typescript
"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings } from "lucide-react";

export function Header() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
          aria-label="Tack - Home"
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          Tack
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-2">
          <SignedIn>
            <Link href="/chat" aria-label="Go to chat">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                Chat
              </Button>
            </Link>
            <Link href="/settings" aria-label="Settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                Settings
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <Button size="sm">Sign In</Button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
```

**Step 2: Create Sidebar**

Write `src/components/layout/Sidebar.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@insforge/nextjs";
import type { Conversation } from "@/types";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    async function loadConversations() {
      const { data, error } = await insforge.database
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setConversations(data as Conversation[]);
      }
      setLoading(false);
    }

    loadConversations();
  }, [isSignedIn]);

  return (
    <aside
      role="complementary"
      aria-label="Conversation history"
      className="w-64 border-r bg-muted/40 flex flex-col h-full"
    >
      <div className="p-3">
        <Link href="/chat">
          <Button
            className="w-full justify-start"
            variant="outline"
            aria-label="Start a new chat"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            New Chat
          </Button>
        </Link>
      </div>

      <nav
        aria-label="Chat history"
        className="flex-1 overflow-y-auto px-2 pb-4"
      >
        {loading ? (
          <p className="text-sm text-muted-foreground px-2 py-1" role="status">
            Loading conversations...
          </p>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-1">
            No conversations yet
          </p>
        ) : (
          <ul role="list" className="space-y-1">
            {conversations.map((conv) => {
              const isActive = pathname === `/chat/${conv.id}`;
              return (
                <li key={conv.id}>
                  <Link
                    href={`/chat/${conv.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
                      isActive && "bg-accent font-medium"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <MessageSquare
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{conv.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
```

**Step 3: Create barrel export**

Write `src/components/layout/index.ts`:
```typescript
export { Header } from "./Header";
export { Sidebar } from "./Sidebar";
```

**Step 4: Commit**

```bash
git add src/components/layout/ && git commit -m "feat: add Header and Sidebar layout components"
```

---

## Task 8: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Write landing page**

Write `src/app/page.tsx`:
```typescript
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout";
import { MessageSquare, Globe, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center px-4 py-16">
        <section aria-labelledby="hero-heading" className="text-center max-w-2xl">
          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            The internet, made accessible
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tack is an AI assistant that helps blind and visually impaired users
            navigate the web. Summarize pages, extract content, and browse — all
            through a simple chat interface optimized for screen readers.
          </p>

          <div className="mt-8 flex gap-4 justify-center">
            <SignedOut>
              <SignInButton>
                <Button size="lg">Get Started</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/chat">
                <Button size="lg">Open Chat</Button>
              </Link>
            </SignedIn>
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="mt-20 max-w-4xl w-full"
        >
          <h2 id="features-heading" className="sr-only">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border">
              <MessageSquare
                className="h-10 w-10 mb-4 text-primary"
                aria-hidden="true"
              />
              <h3 className="font-semibold text-lg">Chat Interface</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask questions naturally. Tack responds with clear, structured
                content optimized for screen readers.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border">
              <Globe
                className="h-10 w-10 mb-4 text-primary"
                aria-hidden="true"
              />
              <h3 className="font-semibold text-lg">Web Summaries</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Paste any URL and get an accessible summary. No more wrestling
                with cluttered web pages.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border">
              <Zap
                className="h-10 w-10 mb-4 text-primary"
                aria-hidden="true"
              />
              <h3 className="font-semibold text-lg">Slash Commands</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Power users can use commands like /summarize and /read for
                lightning-fast workflows.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx && git commit -m "feat: add accessible landing page"
```

---

## Task 9: Protected Layout (Chat + Settings shell)

**Files:**
- Create: `src/app/(protected)/layout.tsx`

**Step 1: Write protected layout**

Write `src/app/(protected)/layout.tsx`:
```typescript
import { Header } from "@/components/layout";
import { Sidebar } from "@/components/layout";
import { FocusManager } from "@/components/a11y";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <FocusManager />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(protected\)/layout.tsx && git commit -m "feat: add protected layout with sidebar and header"
```

---

## Task 10: Slash Command Parser

**Files:**
- Create: `src/lib/commands.ts`

**Step 1: Write command parser**

Write `src/lib/commands.ts`:
```typescript
import type { SlashCommand } from "@/types";

export const COMMANDS: SlashCommand[] = [
  {
    name: "help",
    description: "Show available commands",
    usage: "/help",
    execute: () => {
      return COMMANDS.map((cmd) => `${cmd.usage} — ${cmd.description}`).join(
        "\n"
      );
    },
  },
  {
    name: "summarize",
    description: "Summarize a web page",
    usage: "/summarize <url>",
    execute: (args: string) => {
      const url = args.trim();
      if (!url) return "Please provide a URL. Usage: /summarize <url>";
      return `__COMMAND__:summarize:${url}`;
    },
  },
  {
    name: "read",
    description: "Read and simplify a web page",
    usage: "/read <url>",
    execute: (args: string) => {
      const url = args.trim();
      if (!url) return "Please provide a URL. Usage: /read <url>";
      return `__COMMAND__:read:${url}`;
    },
  },
  {
    name: "clear",
    description: "Start a new conversation",
    usage: "/clear",
    execute: () => {
      return "__COMMAND__:clear";
    },
  },
];

export function parseCommand(input: string): {
  isCommand: boolean;
  command?: SlashCommand;
  args?: string;
} {
  if (!input.startsWith("/")) {
    return { isCommand: false };
  }

  const parts = input.slice(1).split(/\s+/);
  const commandName = parts[0]?.toLowerCase();
  const args = parts.slice(1).join(" ");

  const command = COMMANDS.find((cmd) => cmd.name === commandName);
  if (!command) {
    return { isCommand: false };
  }

  return { isCommand: true, command, args };
}
```

**Step 2: Commit**

```bash
git add src/lib/commands.ts && git commit -m "feat: add slash command parser with help, summarize, read, clear"
```

---

## Task 11: Chat Components

**Files:**
- Create: `src/components/chat/ChatMessage.tsx`
- Create: `src/components/chat/ChatInput.tsx`
- Create: `src/components/chat/ChatHistory.tsx`
- Create: `src/components/chat/CommandPalette.tsx`
- Create: `src/components/chat/index.ts`

**Step 1: Create ChatMessage**

Write `src/components/chat/ChatMessage.tsx`:
```typescript
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

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
        {message.metadata?.source_url && (
          <p className="text-xs text-muted-foreground">
            Source:{" "}
            <a
              href={message.metadata.source_url}
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

**Step 2: Create CommandPalette**

Write `src/components/chat/CommandPalette.tsx`:
```typescript
"use client";

import { COMMANDS } from "@/lib/commands";

interface CommandPaletteProps {
  filter: string;
  onSelect: (command: string) => void;
  visible: boolean;
}

export function CommandPalette({
  filter,
  onSelect,
  visible,
}: CommandPaletteProps) {
  if (!visible) return null;

  const filtered = COMMANDS.filter((cmd) =>
    cmd.name.startsWith(filter.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Available commands"
      className="absolute bottom-full left-0 right-0 mb-1 rounded-md border bg-popover p-1 shadow-md"
    >
      {filtered.map((cmd) => (
        <button
          key={cmd.name}
          role="option"
          aria-selected={false}
          onClick={() => onSelect(`/${cmd.name} `)}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
        >
          <span className="font-mono text-xs text-muted-foreground">
            /{cmd.name}
          </span>
          <span className="text-muted-foreground">—</span>
          <span>{cmd.description}</span>
        </button>
      ))}
    </div>
  );
}
```

**Step 3: Create ChatInput**

Write `src/components/chat/ChatInput.tsx`:
```typescript
"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { CommandPalette } from "./CommandPalette";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          placeholder="Type a message or /help for commands..."
          disabled={disabled}
          rows={1}
          className="min-h-[44px] max-h-32 resize-none"
          aria-describedby="input-hint"
        />
        <span id="input-hint" className="sr-only">
          Press Enter to send, Shift+Enter for a new line. Type / for commands.
        </span>
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

**Step 4: Create ChatHistory**

Write `src/components/chat/ChatHistory.tsx`:
```typescript
"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "@/types";

interface ChatHistoryProps {
  messages: Message[];
  loading?: boolean;
}

export function ChatHistory({ messages, loading = false }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Welcome to Tack</h2>
          <p className="text-muted-foreground">
            Start a conversation or try a command like{" "}
            <kbd className="rounded border px-1.5 py-0.5 text-xs font-mono">
              /help
            </kbd>{" "}
            to see what I can do.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {loading && (
        <div className="flex gap-3 px-4 py-4 bg-muted/50" role="status">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-primary text-primary-foreground">
            <span className="animate-pulse text-xs" aria-hidden="true">
              ...
            </span>
          </div>
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground">Tack is thinking...</p>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
```

**Step 5: Create barrel export**

Write `src/components/chat/index.ts`:
```typescript
export { ChatMessage } from "./ChatMessage";
export { ChatInput } from "./ChatInput";
export { ChatHistory } from "./ChatHistory";
export { CommandPalette } from "./CommandPalette";
```

**Step 6: Commit**

```bash
git add src/components/chat/ && git commit -m "feat: add chat components (ChatMessage, ChatInput, ChatHistory, CommandPalette)"
```

---

## Task 12: Chat API Route

**Files:**
- Create: `src/app/api/chat/route.ts`

**Step 1: Write chat API route**

Write `src/app/api/chat/route.ts`:
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

    const { message, conversation_id } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        );
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

    // Build system prompt for accessibility focus
    const systemPrompt = `You are Tack, an AI assistant designed to help blind and visually impaired users access the internet.
Your responses should be:
- Clear and well-structured with logical flow
- Use plain language, avoiding visual references like "as you can see" or "the blue button"
- When describing web content, focus on the information hierarchy and meaning
- Use numbered lists and headings when organizing complex information
- Keep responses concise but thorough
- If asked to summarize a URL, explain that you'll process it and provide a structured summary`;

    // Get AI response
    const completion = await insforge.ai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const assistantContent =
      completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Save assistant message
    const { data: savedMessage, error: msgError } = await insforge.database
      .from("messages")
      .insert({
        conversation_id: convId,
        role: "assistant",
        content: assistantContent,
        metadata: {},
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
    }

    // Update conversation timestamp
    await insforge.database
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    return NextResponse.json({
      message: savedMessage,
      conversation_id: convId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/chat/route.ts && git commit -m "feat: add chat API route with InsForge AI and conversation persistence"
```

---

## Task 13: useChat Hook

**Files:**
- Create: `src/hooks/useChat.ts`

**Step 1: Write useChat hook**

Write `src/hooks/useChat.ts`:
```typescript
"use client";

import { useState, useCallback } from "react";
import { parseCommand, COMMANDS } from "@/lib/commands";
import type { Message } from "@/types";

export function useChat(initialConversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (input: string) => {
      setError(null);

      // Check for slash commands
      const parsed = parseCommand(input);

      if (parsed.isCommand && parsed.command) {
        const result = parsed.command.execute(parsed.args || "");

        // Handle local-only commands
        if (result === "__COMMAND__:clear") {
          setMessages([]);
          setConversationId(undefined);
          return;
        }

        // Handle /help command locally
        if (parsed.command.name === "help") {
          const helpId = crypto.randomUUID();
          const userMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "user",
            content: input,
            metadata: { command: "help" },
            created_at: new Date().toISOString(),
          };
          const assistantMsg: Message = {
            id: helpId,
            conversation_id: conversationId || "",
            role: "assistant",
            content: `Available commands:\n\n${COMMANDS.map((cmd) => `${cmd.usage} — ${cmd.description}`).join("\n")}`,
            metadata: { command: "help" },
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, userMsg, assistantMsg]);
          return;
        }

        // For commands that need AI processing, modify the message
        if (result.startsWith("__COMMAND__:summarize:")) {
          const url = result.replace("__COMMAND__:summarize:", "");
          input = `Please summarize the content at this URL: ${url}`;
        } else if (result.startsWith("__COMMAND__:read:")) {
          const url = result.replace("__COMMAND__:read:", "");
          input = `Please read and simplify the content at this URL: ${url}`;
        }
      }

      // Add optimistic user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || "",
        role: "user",
        content: input,
        metadata: parsed.isCommand ? { command: parsed.command?.name } : {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: input,
            conversation_id: conversationId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        if (!conversationId) {
          setConversationId(data.conversation_id);
          // Update URL without full navigation
          window.history.pushState(null, "", `/chat/${data.conversation_id}`);
        }

        setMessages((prev) => [...prev, data.message]);
      } catch (err) {
        setError("Failed to send message. Please try again.");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const loadMessages = useCallback(async (convId: string) => {
    const response = await fetch(`/api/conversations/${convId}/messages`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages || []);
      setConversationId(convId);
    }
  }, []);

  return {
    messages,
    conversationId,
    loading,
    error,
    sendMessage,
    loadMessages,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useChat.ts && git commit -m "feat: add useChat hook with command parsing and conversation management"
```

---

## Task 14: Conversation Messages API Route

**Files:**
- Create: `src/app/api/conversations/[id]/messages/route.ts`

**Step 1: Write messages API route**

Write `src/app/api/conversations/[id]/messages/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@insforge/nextjs/server";
import { createClient } from "@insforge/sdk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { token, userId } = await auth();

    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
      edgeFunctionToken: token,
    });

    // Verify conversation belongs to user
    const { data: conv, error: convError } = await insforge.database
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (convError || !conv) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Fetch messages
    const { data: messages, error: msgError } = await insforge.database
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/conversations/ && git commit -m "feat: add conversation messages API route"
```

---

## Task 15: Chat Pages

**Files:**
- Create: `src/app/(protected)/chat/page.tsx`
- Create: `src/app/(protected)/chat/[id]/page.tsx`

**Step 1: Write new chat page**

Write `src/app/(protected)/chat/page.tsx`:
```typescript
"use client";

import { ChatHistory, ChatInput } from "@/components/chat";
import { LiveRegion } from "@/components/a11y";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const { messages, loading, error, sendMessage } = useChat();

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

**Step 2: Write conversation page**

Write `src/app/(protected)/chat/[id]/page.tsx`:
```typescript
"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatHistory, ChatInput } from "@/components/chat";
import { LiveRegion } from "@/components/a11y";
import { useChat } from "@/hooks/useChat";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { messages, loading, error, sendMessage, loadMessages } =
    useChat(conversationId);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId, loadMessages]);

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

**Step 3: Commit**

```bash
git add src/app/\(protected\)/chat/ && git commit -m "feat: add chat and conversation pages"
```

---

## Task 16: Settings Page

**Files:**
- Create: `src/app/(protected)/settings/page.tsx`

**Step 1: Write settings page**

Write `src/app/(protected)/settings/page.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LiveRegion } from "@/components/a11y";
import { insforge } from "@/lib/insforge";
import { useUser } from "@insforge/nextjs";
import type { UserPreferences } from "@/types";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadPreferences() {
      const { data } = await insforge.database
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        setPreferences({
          user_id: user!.id,
          high_contrast: false,
          font_size: "medium",
          screen_reader_verbosity: "normal",
          reduced_motion: false,
        });
      }
    }

    loadPreferences();
  }, [user]);

  const savePreferences = async () => {
    if (!preferences || !user) return;
    setSaving(true);

    const { error } = await insforge.database
      .from("user_preferences")
      .insert({
        ...preferences,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      // Try update if insert fails (row exists)
      await insforge.database
        .from("user_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    setSaving(false);
    setStatusMessage("Settings saved successfully.");
  };

  if (!isLoaded || !preferences) {
    return (
      <div className="p-8" role="status">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <LiveRegion message={statusMessage} politeness="assertive" />

      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your accessibility preferences
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>
            Adjust visual settings for your comfort
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast">High contrast mode</Label>
            <input
              id="high-contrast"
              type="checkbox"
              checked={preferences.high_contrast}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  high_contrast: e.target.checked,
                })
              }
              className="h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-size">Font size</Label>
            <select
              id="font-size"
              value={preferences.font_size}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  font_size: e.target.value as UserPreferences["font_size"],
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="small">Small</option>
              <option value="medium">Medium (default)</option>
              <option value="large">Large</option>
              <option value="x-large">Extra Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="reduced-motion">Reduce motion</Label>
            <input
              id="reduced-motion"
              type="checkbox"
              checked={preferences.reduced_motion}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  reduced_motion: e.target.checked,
                })
              }
              className="h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Screen Reader</CardTitle>
          <CardDescription>
            Adjust how much detail Tack provides in responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="verbosity">Response verbosity</Label>
            <select
              id="verbosity"
              value={preferences.screen_reader_verbosity}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  screen_reader_verbosity: e.target
                    .value as UserPreferences["screen_reader_verbosity"],
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="concise">
                Concise — Brief, to-the-point responses
              </option>
              <option value="normal">
                Normal — Balanced detail (default)
              </option>
              <option value="verbose">
                Verbose — Maximum detail and context
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={savePreferences} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(protected\)/settings/ && git commit -m "feat: add settings page with accessibility preferences"
```

---

## Task 17: Documentation

**Files:**
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/ACCESSIBILITY.md`
- Create: `docs/API.md`
- Create: `docs/SETUP.md`
- Modify: `README.md`

**Step 1: Write ARCHITECTURE.md**

Write `docs/ARCHITECTURE.md` with:
- System overview diagram (same as design doc)
- Tech stack table with rationale
- Directory structure with descriptions
- Data flow: User -> Chat Input -> API Route -> InsForge AI -> Response -> Chat History
- Auth flow: Middleware -> InsForge hosted auth -> Cookie -> API routes use `auth()` server function
- Database schema reference

**Step 2: Write ACCESSIBILITY.md**

Write `docs/ACCESSIBILITY.md` with:
- WCAG 2.1 AA compliance targets
- Patterns used: skip links, aria-live regions, focus management, semantic landmarks, keyboard navigation
- Component accessibility notes (each component's ARIA attributes)
- Testing guide: screen reader testing with VoiceOver/NVDA, keyboard-only navigation testing, color contrast verification

**Step 3: Write API.md**

Write `docs/API.md` with:
- POST /api/chat — request/response format
- GET /api/conversations/[id]/messages — request/response format
- POST/GET/DELETE /api/auth — InsForge auth handlers
- Error response format

**Step 4: Write SETUP.md**

Write `docs/SETUP.md` with:
- Prerequisites (Node.js 18+, npm)
- Clone and install steps
- Environment variable setup
- InsForge configuration
- Running dev server
- Building for production

**Step 5: Update README.md**

Replace `README.md` with project overview, quick start, and links to docs/ files.

**Step 6: Commit**

```bash
git add docs/ README.md && git commit -m "docs: add comprehensive project documentation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Project scaffolding | package.json, configs, .env |
| 2 | shadcn/ui setup | components.json, ui/ components |
| 3 | InsForge auth | client, middleware, provider, layout |
| 4 | Database schema | SQL via InsForge MCP |
| 5 | TypeScript types | src/types/index.ts |
| 6 | A11y components | LiveRegion, ScreenReaderOnly, FocusManager |
| 7 | Layout components | Header, Sidebar |
| 8 | Landing page | src/app/page.tsx |
| 9 | Protected layout | (protected)/layout.tsx |
| 10 | Slash commands | src/lib/commands.ts |
| 11 | Chat components | ChatMessage, ChatInput, ChatHistory, CommandPalette |
| 12 | Chat API route | api/chat/route.ts |
| 13 | useChat hook | hooks/useChat.ts |
| 14 | Messages API route | api/conversations/[id]/messages/route.ts |
| 15 | Chat pages | chat/page.tsx, chat/[id]/page.tsx |
| 16 | Settings page | settings/page.tsx |
| 17 | Documentation | docs/*.md, README.md |
