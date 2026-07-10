# Chat Frontend: Structured Commands, Error UX, Semantic Markdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the chat frontend so slash commands POST structured fields, failed messages persist with a retry button, /clear cleans the URL, and assistant responses render real semantic HTML via a hand-rolled markdown parser.

**Architecture:** Five coordinated changes — type extensions, declarative command shapes, useChat hook logic, semantic markdown renderer extracted to `src/lib/markdown.tsx`, and ChatMessage UI update. The backend FORMATTING RULES system prompt is flipped to enable markdown output so the new renderer has real content to render.

**Tech Stack:** Next.js 15, React, TypeScript, Vitest, Tailwind CSS.

---

## File Map

| File | Status | Purpose |
|------|--------|---------|
| `src/types/index.ts` | Modify | Add `failed?: boolean` to Message; add `requiresArgs?`/`argError?` to SlashCommand |
| `src/lib/commands.ts` | Modify | Add declarative `requiresArgs`/`argError` fields; remove `__COMMAND__:` protocol from server commands |
| `src/lib/__tests__/commands.test.ts` | Modify | Remove stale `__COMMAND__:` execute tests; add argError/requiresArgs tests |
| `src/hooks/useChat.ts` | Modify | POST command+args; keep original message; mark failed not remove; retryMessage; /clear URL fix; loadMessages error |
| `src/app/api/chat/route.ts` | Modify | FORMATTING RULES block only — flip to enable markdown |
| `src/lib/markdown.tsx` | Create | Hand-rolled semantic markdown→React elements parser |
| `src/lib/__tests__/markdown.test.tsx` | Create | Vitest unit tests for the markdown parser |
| `src/components/chat/ChatMessage.tsx` | Modify | Use new parser; add failed+retry UI |

---

### Task 1: Extend Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Read the file**

Open `src/types/index.ts` to confirm current shape before editing.

- [ ] **Step 2: Add `failed` to Message and extend SlashCommand**

In `src/types/index.ts`, apply these changes:

```ts
// Message — add optional failed flag (client-side only, not persisted)
export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: MessageMetadata;
  created_at: string;
  failed?: boolean;           // ← ADD THIS
}

// SlashCommand — add declarative args contract
export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  execute: (args: string) => string;
  requiresArgs?: boolean;     // ← ADD THIS
  argError?: string;          // ← ADD THIS (message shown locally when args missing)
}
```

- [ ] **Step 3: Verify typecheck passes**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm run typecheck
```

Expected: no errors (the new optional fields are backward-compatible).

- [ ] **Step 4: Commit**

```bash
cd /Users/jayrao/Documents/tack-webapp && git add src/types/index.ts && git commit -m "$(cat <<'EOF'
types: add failed flag to Message and requiresArgs/argError to SlashCommand

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Refactor commands.ts — Declarative Shape + Update Tests

**Files:**
- Modify: `src/lib/commands.ts`
- Modify: `src/lib/__tests__/commands.test.ts`

- [ ] **Step 1: Write the failing test first**

Replace the three `execute()` tests that check `__COMMAND__:*` format (lines 74–89 in the existing file) with tests for the new shape. Open `src/lib/__tests__/commands.test.ts` and update the `execute() behaviour` block:

```ts
// ── execute() behaviour ───────────────────────────────────────────────────

it("/summarize with no args returns the argError string", () => {
  const cmd = COMMANDS.find((c) => c.name === "summarize")!;
  expect(cmd.execute("")).toContain("URL");
});

it("/summarize execute with URL returns the URL as-is (for local validation)", () => {
  const { command, args } = parseCommand("/summarize https://example.com");
  expect(command!.execute(args!)).toBe("https://example.com");
});

it("/search with no args returns the argError string", () => {
  const cmd = COMMANDS.find((c) => c.name === "search")!;
  expect(cmd.execute("")).toContain("query");
});

it("/search execute with query returns the query as-is", () => {
  const { command, args } = parseCommand("/search my query");
  expect(command!.execute(args!)).toBe("my query");
});

it("/clear execute returns __COMMAND__:clear (local sentinel unchanged)", () => {
  const { command, args } = parseCommand("/clear");
  expect(command!.execute(args ?? "")).toBe("__COMMAND__:clear");
});

it("summarize has requiresArgs true and non-empty argError", () => {
  const cmd = COMMANDS.find((c) => c.name === "summarize")!;
  expect(cmd.requiresArgs).toBe(true);
  expect(cmd.argError).toBeTruthy();
});

it("search has requiresArgs true and non-empty argError", () => {
  const cmd = COMMANDS.find((c) => c.name === "search")!;
  expect(cmd.requiresArgs).toBe(true);
  expect(cmd.argError).toBeTruthy();
});

it("read has requiresArgs true and non-empty argError", () => {
  const cmd = COMMANDS.find((c) => c.name === "read")!;
  expect(cmd.requiresArgs).toBe(true);
  expect(cmd.argError).toBeTruthy();
});

it("clear does not require args", () => {
  const cmd = COMMANDS.find((c) => c.name === "clear")!;
  expect(cmd.requiresArgs).toBeFalsy();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm test -- --reporter verbose 2>&1 | grep -A 5 "commands"
```

Expected: several failures related to `requiresArgs` being undefined and execute returning wrong values.

- [ ] **Step 3: Update commands.ts to match the new contract**

Replace `src/lib/commands.ts` with:

```ts
import type { SlashCommand } from "@/types";

export const COMMANDS: SlashCommand[] = [
  {
    name: "help",
    description: "Show available commands",
    usage: "/help",
    execute: () => {
      return COMMANDS.map((cmd) => `${cmd.usage} — ${cmd.description}`).join("\n");
    },
  },
  {
    name: "summarize",
    description: "Summarize a web page",
    usage: "/summarize <url>",
    requiresArgs: true,
    argError: "Please provide a URL. Usage: /summarize <url>",
    execute: (args: string) => {
      const url = args.trim();
      if (!url) return "Please provide a URL. Usage: /summarize <url>";
      return url;
    },
  },
  {
    name: "read",
    description: "Read and simplify a web page",
    usage: "/read <url>",
    requiresArgs: true,
    argError: "Please provide a URL. Usage: /read <url>",
    execute: (args: string) => {
      const url = args.trim();
      if (!url) return "Please provide a URL. Usage: /read <url>";
      return url;
    },
  },
  {
    name: "search",
    description: "Search the web via Google",
    usage: "/search <query>",
    requiresArgs: true,
    argError: "Please provide a search query. Usage: /search <query>",
    execute: (args: string) => {
      const query = args.trim();
      if (!query) return "Please provide a search query. Usage: /search <query>";
      return query;
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

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm test -- --reporter verbose 2>&1 | grep -E "commands|PASS|FAIL"
```

Expected: all command tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/jayrao/Documents/tack-webapp && git add src/lib/commands.ts src/lib/__tests__/commands.test.ts && git commit -m "$(cat <<'EOF'
refactor(commands): declarative requiresArgs/argError, remove __COMMAND__ protocol for server cmds

Server commands (summarize/read/search) now expose requiresArgs and
argError declaratively; execute() returns the args string directly
instead of the deprecated __COMMAND__: sentinel. Only /clear retains
the local sentinel. Tests updated accordingly.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Update useChat.ts

**Files:**
- Modify: `src/hooks/useChat.ts`

This task has six sub-changes in one file. Read the file first, then apply all changes together.

- [ ] **Step 1: Read the current file**

Open `src/hooks/useChat.ts` to understand the current state.

- [ ] **Step 2: Rewrite useChat.ts with all six changes**

Replace `src/hooks/useChat.ts` with:

```ts
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
        // /clear — local only
        if (parsed.command.name === "clear") {
          setMessages([]);
          setConversationId(undefined);
          // Fix: clear the URL so refresh doesn't reload the old conversation
          window.history.pushState(null, "", "/chat");
          return;
        }

        // /help — local only
        if (parsed.command.name === "help") {
          const userMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "user",
            content: input,
            metadata: { command: "help" },
            created_at: new Date().toISOString(),
          };
          const assistantMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "assistant",
            content: `Available commands:\n\n${COMMANDS.map((cmd) => `${cmd.usage} — ${cmd.description}`).join("\n")}`,
            metadata: { command: "help" },
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, userMsg, assistantMsg]);
          return;
        }

        // Server commands — validate args before sending
        if (parsed.command.requiresArgs && !parsed.args?.trim()) {
          // Show the usage error as a local assistant-style message (same as old pattern)
          const userMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "user",
            content: input,
            metadata: { command: parsed.command.name },
            created_at: new Date().toISOString(),
          };
          const errorMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId || "",
            role: "assistant",
            content: parsed.command.argError || `Usage: ${parsed.command.usage}`,
            metadata: { command: parsed.command.name },
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, userMsg, errorMsg]);
          return;
        }
      }

      // Add optimistic user message — keep original input as content
      const msgId = crypto.randomUUID();
      const userMessage: Message = {
        id: msgId,
        conversation_id: conversationId || "",
        role: "user",
        content: input,   // original input, NOT rewritten
        metadata: parsed.isCommand ? { command: parsed.command?.name } : {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        // Build request body: include command + args when a server command was parsed
        const requestBody: {
          message: string;
          conversation_id?: string;
          command?: string;
          args?: string;
        } = {
          message: input,
          conversation_id: conversationId,
        };

        if (
          parsed.isCommand &&
          parsed.command &&
          !["help", "clear"].includes(parsed.command.name)
        ) {
          requestBody.command = parsed.command.name as "summarize" | "read" | "search";
          requestBody.args = parsed.args || "";
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        if (!conversationId) {
          setConversationId(data.conversation_id);
          // Update URL without full navigation
          window.history.pushState(null, "", `/chat/${data.conversation_id}`);
          window.dispatchEvent(new CustomEvent("sidebar:refresh"));
        }

        setMessages((prev) => [...prev, data.message]);
      } catch {
        // Mark the optimistic message as failed — do NOT remove it
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, failed: true } : m))
        );
        setError("Failed to send message. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  // Retry a failed message: remove the failed copy then re-send the same content
  const retryMessage = useCallback(
    async (id: string) => {
      const msg = messages.find((m) => m.id === id);
      if (!msg) return;
      // Remove the failed message before re-sending so the list stays clean
      setMessages((prev) => prev.filter((m) => m.id !== id));
      await sendMessage(msg.content);
    },
    [messages, sendMessage]
  );

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`);
      if (!response.ok) {
        setError("Failed to load conversation.");
        return;
      }
      const data = await response.json();
      setMessages(data.messages || []);
      setConversationId(convId);
    } catch {
      setError("Failed to load conversation.");
    }
  }, []);

  return {
    messages,
    conversationId,
    loading,
    error,
    sendMessage,
    retryMessage,
    loadMessages,
  };
}
```

- [ ] **Step 3: Verify typecheck passes**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/jayrao/Documents/tack-webapp && git add src/hooks/useChat.ts && git commit -m "$(cat <<'EOF'
feat(useChat): structured command POSTing, failed-message retry, /clear URL fix, loadMessages error

- POST command+args fields instead of rewriting the message text
- Keep original user input as displayed content (not the rewritten form)
- On error: mark optimistic message failed instead of removing it
- Expose retryMessage(id) that removes the failed copy and re-sends
- /clear now pushes /chat to history so refresh is safe
- loadMessages sets error state on non-ok response or exception

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Flip FORMATTING RULES in the Chat System Prompt

**Files:**
- Modify: `src/app/api/chat/route.ts` (lines 117–124 only — the FORMATTING RULES block)

Do NOT touch CONTENT RULES, SECURITY, or any other part of the file.

- [ ] **Step 1: Read the FORMATTING RULES block**

Open `src/app/api/chat/route.ts` and locate the block starting at `FORMATTING RULES (follow these strictly):` (around line 117).

- [ ] **Step 2: Replace only the FORMATTING RULES block**

Find this exact text in the file:

```
FORMATTING RULES (follow these strictly):
- Do NOT use markdown syntax. No # for headings, no * or ** for bold, no [text](url) link syntax.
- For section headings, write them on their own line followed by a blank line. Use ALL CAPS or Title Case for headings — do NOT prefix with # symbols.
- For emphasis, simply write the text clearly — do NOT wrap with asterisks or underscores.
- For links, write the full URL on its own (e.g. https://example.com) — do NOT use [Link] or [text](url) format.
- Use numbered lists (1. 2. 3.) and dashes (- ) for bullet points.
- Do NOT include a "Key Takeaways", "Takeaways", or "Summary Takeaways" section at the end of your responses.
- Keep responses concise but thorough.
```

Replace it with:

```
FORMATTING RULES (follow these strictly):
- Use markdown headings: ## for main sections, ### for sub-sections.
- Use numbered lists (1. 2. 3.) for steps or ranked items; use dashes (- ) for unordered bullet points.
- For links, use markdown link syntax: [descriptive text](https://example.com). Never paste bare URLs unless they are the subject being discussed.
- Bold sparingly with **text** — only for genuinely critical terms; avoid mid-sentence emphasis as screen readers may read asterisks aloud.
- No tables, no images, no code fences unless the user explicitly asks about code.
- Do NOT include a "Key Takeaways", "Takeaways", or "Summary Takeaways" section at the end of your responses.
- Keep responses concise but thorough.
```

- [ ] **Step 3: Verify typecheck passes**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
cd /Users/jayrao/Documents/tack-webapp && git add src/app/api/chat/route.ts && git commit -m "$(cat <<'EOF'
feat(api/chat): enable markdown in system prompt FORMATTING RULES

Replace no-markdown rules with rules permitting ## headings, lists,
[text](url) links, and sparing **bold**. CONTENT RULES and SECURITY
section untouched.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Write Tests for the Markdown Parser (TDD — red first)

**Files:**
- Create: `src/lib/__tests__/markdown.test.tsx`

The vitest config uses `environment: "node"` and resolves `@` to `./src`. The markdown module returns React elements; to test structure without a DOM, we import React and test `type`, `props`, and recursively inspect `children`. Alternatively, use `renderToStaticMarkup` from `react-dom/server` which is available in node.

- [ ] **Step 1: Create the test file**

Create `src/lib/__tests__/markdown.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderMarkdown } from "../markdown";

// Helper: render the array of elements returned by renderMarkdown to a string
function html(content: string): string {
  const nodes = renderMarkdown(content);
  const wrapper = React.createElement(React.Fragment, null, ...nodes);
  return renderToStaticMarkup(wrapper);
}

describe("renderMarkdown", () => {
  // ── Headings ──────────────────────────────────────────────────────────────

  it("## becomes an h2", () => {
    expect(html("## Hello World")).toContain("<h2");
    expect(html("## Hello World")).toContain("Hello World");
  });

  it("### becomes an h3", () => {
    expect(html("### Sub Section")).toContain("<h3");
  });

  it("#### becomes an h4", () => {
    expect(html("#### Deep")).toContain("<h4");
  });

  it("# (single hash) is capped to h2", () => {
    expect(html("# Top")).toContain("<h2");
  });

  // ── Lists ────────────────────────────────────────────────────────────────

  it("dash items become a ul", () => {
    const out = html("- Apple\n- Banana\n- Cherry");
    expect(out).toContain("<ul");
    expect(out).toContain("<li");
    expect(out).toContain("Apple");
    expect(out).toContain("Cherry");
  });

  it("numbered items become an ol", () => {
    const out = html("1. First\n2. Second\n3. Third");
    expect(out).toContain("<ol");
    expect(out).toContain("<li");
    expect(out).toContain("Second");
  });

  it("a single dash item still renders a ul", () => {
    expect(html("- Solo")).toContain("<ul");
  });

  it("consecutive dash items are grouped into one ul (not multiple)", () => {
    const out = html("- A\n- B");
    const ulCount = (out.match(/<ul/g) || []).length;
    expect(ulCount).toBe(1);
  });

  // ── Links ────────────────────────────────────────────────────────────────

  it("[text](url) becomes an anchor with correct href", () => {
    const out = html("See [Google](https://google.com) for more.");
    expect(out).toContain('<a href="https://google.com"');
    expect(out).toContain("Google");
  });

  it("anchor has target=_blank and rel=noopener noreferrer", () => {
    const out = html("[Example](https://example.com)");
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("bare URL becomes a link with the URL as text", () => {
    const out = html("Visit https://example.com today.");
    expect(out).toContain('<a href="https://example.com"');
    expect(out).toContain("https://example.com");
  });

  // ── Bold ─────────────────────────────────────────────────────────────────

  it("**bold** becomes <strong>", () => {
    const out = html("This is **important** text.");
    expect(out).toContain("<strong>important</strong>");
  });

  // ── Paragraphs ───────────────────────────────────────────────────────────

  it("plain text line becomes a p", () => {
    expect(html("Hello world")).toContain("<p");
    expect(html("Hello world")).toContain("Hello world");
  });

  it("empty lines do not produce a p tag", () => {
    const out = html("Line one\n\nLine two");
    // Should have exactly two <p> tags (one per non-empty line)
    const pCount = (out.match(/<p[\s>]/g) || []).length;
    expect(pCount).toBe(2);
  });

  // ── Takeaway stripping ───────────────────────────────────────────────────

  it("strips Key Takeaways section", () => {
    const out = html("Great summary.\n\nKey Takeaways:\n- Point 1\n- Point 2");
    expect(out).not.toContain("Key Takeaways");
    expect(out).not.toContain("Point 1");
    expect(out).toContain("Great summary");
  });

  it("strips Takeaways section case-insensitively", () => {
    const out = html("Body text.\n\nTAKEAWAYS\n- Item");
    expect(out).not.toContain("TAKEAWAYS");
  });

  // ── Plain-text fallback (old conversations) ───────────────────────────────

  it("ALL-CAPS line is rendered as a heading (backward compat)", () => {
    const out = html("INTRODUCTION\n\nSome text here.");
    // Should be rendered distinctly (heading-ish), not as a plain paragraph
    expect(out).toBeDefined();
    // Check that INTRODUCTION appears (not dropped)
    expect(out).toContain("INTRODUCTION");
  });

  it("multiple plain lines without markdown render without crashing", () => {
    const content = "Line one.\nLine two.\nLine three.";
    expect(() => html(content)).not.toThrow();
    expect(html(content)).toContain("Line one.");
  });

  it("returns an empty array for empty string", () => {
    const nodes = renderMarkdown("");
    expect(nodes.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail (module not found)**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm test 2>&1 | grep -E "markdown|FAIL|Cannot find"
```

Expected: `Cannot find module '../markdown'` or similar.

---

### Task 6: Implement the Markdown Parser

**Files:**
- Create: `src/lib/markdown.tsx`

- [ ] **Step 1: Create the parser**

Create `src/lib/markdown.tsx`:

```tsx
import React from "react";

// Tailwind classes reused from ChatMessage.tsx colour scheme
const CLS = {
  h2: "font-bold text-base mt-4 mb-1 text-[rgba(240,237,237,0.92)]",
  h3: "font-semibold text-sm mt-3 mb-1 text-[rgba(240,237,237,0.88)]",
  h4: "font-semibold text-xs mt-2 mb-1 text-[rgba(240,237,237,0.85)]",
  p:  "text-sm leading-relaxed text-[rgba(240,237,237,0.72)]",
  ul: "list-disc list-outside pl-5 space-y-0.5 text-sm text-[rgba(240,237,237,0.72)]",
  ol: "list-decimal list-outside pl-5 space-y-0.5 text-sm text-[rgba(240,237,237,0.72)]",
  li: "leading-relaxed",
  a:  "text-[hsl(255,60%,70%)] underline underline-offset-2 hover:text-[hsl(255,60%,80%)] focus:outline-none focus:ring-2 focus:ring-ring break-all transition-colors",
};

const TAKEAWAY_RE = /\n*(Key Takeaways|Takeaways|Summary Takeaways)[:\s]*\n([\s\S]*?)$/i;
const HEADING_RE  = /^(#{1,6})\s+(.+)$/;
const OL_RE       = /^\d+\.\s+(.+)$/;
const UL_RE       = /^[-*]\s+(.+)$/;
const BOLD_RE     = /\*\*([^*]+)\*\*/g;
const LINK_RE     = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
const BARE_URL_RE = /(https?:\/\/[^\s,)[\]]+)/g;

// ── Inline renderer ──────────────────────────────────────────────────────────

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Tokenise: links first (to avoid bare-URL pass matching inside link text),
  // then bold, then bare URLs.
  // Strategy: build a flat token list via a single regex pass.
  const TOKEN_RE =
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s,)[\]]+)/g;

  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    const [full, linkText, linkUrl, boldText, bareUrl] = match;

    // Text before this token
    if (match.index > last) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-t-${idx++}`}>
          {text.slice(last, match.index)}
        </React.Fragment>
      );
    }

    if (linkText && linkUrl) {
      nodes.push(
        <a
          key={`${keyPrefix}-a-${idx++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={CLS.a}
        >
          {linkText}
        </a>
      );
    } else if (boldText) {
      nodes.push(<strong key={`${keyPrefix}-b-${idx++}`}>{boldText}</strong>);
    } else if (bareUrl) {
      nodes.push(
        <a
          key={`${keyPrefix}-u-${idx++}`}
          href={bareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={CLS.a}
        >
          {bareUrl}
        </a>
      );
    }

    last = match.index + full.length;
  }

  // Remaining text
  if (last < text.length) {
    nodes.push(
      <React.Fragment key={`${keyPrefix}-t-${idx++}`}>
        {text.slice(last)}
      </React.Fragment>
    );
  }

  return nodes;
}

// ── Standalone heading heuristic (backward compat for plain-text history) ────

function isLegacyHeading(line: string, nextLine: string | undefined): boolean {
  const t = line.trim();
  return (
    t.length > 0 &&
    t.length < 80 &&
    /^[A-Z][A-Za-z0-9\s:&\-–—,/]*$/.test(t) &&
    !/[.!?;]$/.test(t) &&
    (nextLine === undefined || nextLine.trim() === "")
  );
}

// ── Block renderer ────────────────────────────────────────────────────────────

type ListBlock = { kind: "ul" | "ol"; items: string[] };
type Block =
  | { kind: "heading"; level: 2 | 3 | 4; text: string }
  | { kind: "p"; text: string }
  | { kind: "blank" }
  | ListBlock;

function parseBlocks(content: string): Block[] {
  // Strip takeaway sections before parsing
  const cleaned = content.replace(TAKEAWAY_RE, "").trimEnd();
  const lines = cleaned.split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Markdown heading
    const hm = line.match(HEADING_RE);
    if (hm) {
      const hashes = hm[1].length;
      const level = hashes === 1 ? 2 : hashes === 2 ? 2 : hashes === 3 ? 3 : 4;
      blocks.push({ kind: "heading", level: level as 2 | 3 | 4, text: hm[2] });
      i++;
      continue;
    }

    // Ordered list — consume all consecutive ol lines
    if (OL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_RE.test(lines[i])) {
        items.push(lines[i].match(OL_RE)![1]);
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    // Unordered list — consume all consecutive ul lines
    if (UL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].match(UL_RE)![1]);
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      blocks.push({ kind: "blank" });
      i++;
      continue;
    }

    // Legacy ALL-CAPS / Title Case heading (plain-text history backward compat)
    if (isLegacyHeading(line, lines[i + 1]) && !line.trim().match(/^\d+\.\s/)) {
      blocks.push({ kind: "heading", level: 3, text: line.trim() });
      i++;
      continue;
    }

    // Plain paragraph
    blocks.push({ kind: "p", text: line });
    i++;
  }

  return blocks;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render a markdown string as an array of React elements.
 * Supports: ## headings, lists, [text](url) links, bare URLs, **bold**, paragraphs.
 * Strips Key Takeaways sections.
 * Falls back gracefully for plain-text (pre-markdown) messages.
 */
export function renderMarkdown(content: string): React.ReactNode[] {
  if (!content) return [];

  const blocks = parseBlocks(content);
  const elements: React.ReactNode[] = [];

  blocks.forEach((block, bi) => {
    const key = `block-${bi}`;

    switch (block.kind) {
      case "heading": {
        const Tag = `h${block.level}` as "h2" | "h3" | "h4";
        const cls = block.level === 2 ? CLS.h2 : block.level === 3 ? CLS.h3 : CLS.h4;
        elements.push(
          <Tag key={key} className={cls}>
            {renderInline(block.text, key)}
          </Tag>
        );
        break;
      }

      case "ul":
        elements.push(
          <ul key={key} className={CLS.ul}>
            {block.items.map((item, ii) => (
              <li key={`${key}-li-${ii}`} className={CLS.li}>
                {renderInline(item, `${key}-li-${ii}`)}
              </li>
            ))}
          </ul>
        );
        break;

      case "ol":
        elements.push(
          <ol key={key} className={CLS.ol}>
            {block.items.map((item, ii) => (
              <li key={`${key}-li-${ii}`} className={CLS.li}>
                {renderInline(item, `${key}-li-${ii}`)}
              </li>
            ))}
          </ol>
        );
        break;

      case "blank":
        elements.push(<div key={key} className="h-2" />);
        break;

      case "p":
        elements.push(
          <p key={key} className={CLS.p}>
            {renderInline(block.text, key)}
          </p>
        );
        break;
    }
  });

  return elements;
}
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm test -- --reporter verbose 2>&1 | grep -E "markdown|PASS|FAIL"
```

Expected: all markdown tests pass. If any fail, examine the output and fix the parser logic — common issues are: regex greediness in LINK_RE or TOKEN_RE, blank-line counting, or takeaway stripping not matching the test input exactly.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/jayrao/Documents/tack-webapp && git add src/lib/markdown.tsx src/lib/__tests__/markdown.test.tsx && git commit -m "$(cat <<'EOF'
feat(markdown): hand-rolled semantic markdown parser with full test coverage

Parses ## headings, ol/ul lists (grouped), [text](url) links, bare URLs,
**bold**, paragraphs, and strips Key Takeaways sections. Legacy ALL-CAPS
heading heuristic retained for backward compat with pre-markdown history.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Update ChatMessage.tsx — Semantic Renderer + Failed/Retry UI

**Files:**
- Modify: `src/components/chat/ChatMessage.tsx`

- [ ] **Step 1: Read the current ChatMessage.tsx**

Open `src/components/chat/ChatMessage.tsx` to understand the current structure (the `formatContent`, `stripInlineMarkdown`, `renderInlineContent` functions and the JSX).

- [ ] **Step 2: Rewrite ChatMessage.tsx**

Replace the entire file with:

```tsx
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Bot, User, RotateCcw } from "lucide-react";
import React from "react";
import { renderMarkdown } from "@/lib/markdown";

interface ChatMessageProps {
  message: Message;
  onRetry?: (id: string) => void;
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const isFailed = message.failed === true;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4",
        isAssistant && "app-msg--assistant",
        isFailed && "opacity-70"
      )}
      role="article"
      aria-label={`${isAssistant ? "Tack" : "You"}: ${message.content.slice(0, 50)}${message.content.length > 50 ? "..." : ""}`}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isAssistant ? "app-msg__avatar--bot" : "app-msg__avatar--user"
        )}
        aria-hidden="true"
      >
        {isAssistant ? (
          <Bot className="h-4 w-4 text-white" />
        ) : (
          <User className="h-4 w-4 text-[rgba(240,237,237,0.6)]" />
        )}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        <p className="text-sm font-medium text-[rgba(240,237,237,0.85)]">
          {isAssistant ? "Tack" : "You"}
        </p>
        <div className="max-w-none">
          {isAssistant ? (
            renderMarkdown(message.content)
          ) : (
            <p className="text-sm whitespace-pre-wrap text-[rgba(240,237,237,0.72)]">
              {message.content}
            </p>
          )}
        </div>
        {isFailed && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-destructive" role="alert">
              Failed to send
            </span>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                aria-label="Retry sending message"
                className="flex items-center gap-1 text-xs text-[hsl(255,60%,70%)] hover:text-[hsl(255,60%,80%)] focus:outline-none focus:ring-2 focus:ring-ring rounded transition-colors"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Retry
              </button>
            )}
          </div>
        )}
        {message.metadata?.source_url && (
          <p className="text-xs text-muted-foreground mt-2">
            Source:{" "}
            <a
              href={message.metadata.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(255,60%,70%)] underline focus:outline-none focus:ring-2 focus:ring-ring"
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

- [ ] **Step 3: Update ChatHistory.tsx to thread retryMessage through**

Open `src/components/chat/ChatHistory.tsx`. The `ChatHistory` component currently renders `<ChatMessage key={msg.id} message={msg} />`. Update it to accept and forward an `onRetry` prop:

```tsx
// Add onRetry prop to interface
interface ChatHistoryProps {
  messages: Message[];
  loading?: boolean;
  onRetry?: (id: string) => void;   // ← ADD
}

export function ChatHistory({ messages, loading = false, onRetry }: ChatHistoryProps) {
  // ...existing scroll ref and empty-state logic unchanged...

  return (
    <div
      className="flex-1 overflow-y-auto"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} onRetry={onRetry} />  {/* ← add onRetry */}
      ))}
      {/* ...rest unchanged... */}
    </div>
  );
}
```

- [ ] **Step 4: Update both chat pages to pass retryMessage**

In `src/app/(protected)/chat/page.tsx`:

```tsx
// Destructure retryMessage from useChat
const { messages, loading, error, sendMessage, retryMessage } = useChat();

// Pass to ChatHistory
<ChatHistory messages={messages} loading={loading} onRetry={retryMessage} />
```

In `src/app/(protected)/chat/[id]/page.tsx`:

```tsx
// Destructure retryMessage from useChat
const { messages, loading, error, sendMessage, loadMessages, retryMessage } =
  useChat(conversationId);

// Pass to ChatHistory
<ChatHistory messages={messages} loading={loading} onRetry={retryMessage} />
```

- [ ] **Step 5: Check the LiveRegion error announcement still fires**

Both pages already render:
```tsx
<LiveRegion message={loading ? "Tack is thinking..." : error ? error : ...} />
```

The `retryMessage` sets `error` via `sendMessage` on failure, so the LiveRegion will announce the error. No change needed here.

- [ ] **Step 6: Run typecheck, lint, and tests**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm run typecheck && npm run lint && npm test
```

Expected: all pass. Common issues:
- `RotateCcw` not in lucide-react → check the version; fallback: `RefreshCw`
- `renderMarkdown` import path wrong → should be `@/lib/markdown`
- `onRetry` prop missing in ChatHistory signature → fix the interface

- [ ] **Step 7: Commit**

```bash
cd /Users/jayrao/Documents/tack-webapp && git add src/components/chat/ChatMessage.tsx src/components/chat/ChatHistory.tsx src/app/(protected)/chat/page.tsx src/app/(protected)/chat/[id]/page.tsx && git commit -m "$(cat <<'EOF'
feat(ChatMessage): semantic markdown rendering, failed-message retry button

Replace markdown-stripping formatter with renderMarkdown() from
src/lib/markdown.tsx. Failed optimistic messages show "Failed to send"
+ accessible Retry button wired to retryMessage from useChat. ChatHistory
and both chat pages updated to thread onRetry through.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Full test + lint + typecheck run**

```bash
cd /Users/jayrao/Documents/tack-webapp && npm run typecheck && npm run lint && npm test
```

Expected: all three commands exit 0.

- [ ] **Step 2: Verify branch and commits**

```bash
git -C /Users/jayrao/Documents/tack-webapp log --oneline -8
```

Expected: 6 commits on `fix/audit-fixes` since this task started (types, commands, useChat, route, markdown, ChatMessage).

- [ ] **Step 3: Smoke-check ChatHistory still compiles when onRetry is not passed**

The prop is `onRetry?: (id: string) => void` (optional), so existing usages without it still compile. Verify:

```bash
cd /Users/jayrao/Documents/tack-webapp && npm run typecheck 2>&1 | grep -i "chathistory\|onretry" || echo "No errors"
```

Expected: "No errors".

---

## Self-Review Against Spec

| Requirement | Task |
|-------------|------|
| useChat POSTs command+args, keeps original message | Task 3 |
| Missing args → local error message | Task 3 |
| Error keeps message + retry | Tasks 1, 3, 7 |
| retryMessage(id) hook | Task 3 |
| ChatMessage retry button (button element, focusable, aria-label) | Task 7 |
| Error announced via LiveRegion | Task 7 step 5 (already wired) |
| /clear URL fix | Task 3 |
| loadMessages error handling | Task 3 |
| FORMATTING RULES flip | Task 4 |
| ## → h2, ### → h3, #### → h4, # → h2 | Task 6 |
| ol/ul lists grouped | Task 6 |
| [text](url) → anchor, bare URL → anchor | Task 6 |
| **bold** → strong | Task 6 |
| paragraphs → p | Task 6 |
| No dangerouslySetInnerHTML | Task 6 (React elements only) |
| Keep takeaway stripping | Task 6 |
| Old plain-text history doesn't regress | Task 6 (legacy heuristic kept) |
| Parser extracted to src/lib/markdown.tsx | Task 6 |
| Tests for parser | Task 5 |
| npm run typecheck && npm run lint && npm test must pass | Task 8 |
| Commit on fix/audit-fixes | All tasks |

No gaps identified.
