import { describe, it, expect } from "vitest";
import {
  stripTitleQuotes,
  capTitle,
  buildCommandTitle,
  findMostRecentScrapedMessage,
  buildFollowUpContextMessage,
  buildHistoryTurns,
  type MessageRow,
} from "../chat-helpers";

// ── stripTitleQuotes ──────────────────────────────────────────────────────────

describe("stripTitleQuotes", () => {
  it("strips ASCII double quotes", () => {
    expect(stripTitleQuotes('"Hello World"')).toBe("Hello World");
  });

  it("strips ASCII single quotes", () => {
    expect(stripTitleQuotes("'Hello World'")).toBe("Hello World");
  });

  it("strips backticks", () => {
    expect(stripTitleQuotes("`Hello World`")).toBe("Hello World");
  });

  it("strips Unicode curly double quotes", () => {
    expect(stripTitleQuotes("“Hello World”")).toBe("Hello World");
  });

  it("strips Unicode curly single quotes", () => {
    expect(stripTitleQuotes("‘Hello World’")).toBe("Hello World");
  });

  it("leaves bare text unchanged", () => {
    expect(stripTitleQuotes("Hello World")).toBe("Hello World");
  });

  it("handles an empty string", () => {
    expect(stripTitleQuotes("")).toBe("");
  });

  it("trims whitespace after stripping quotes", () => {
    expect(stripTitleQuotes('"  spaced  "')).toBe("spaced");
  });

  it("does not strip internal quotes", () => {
    expect(stripTitleQuotes("It's a test")).toBe("It's a test");
  });
});

// ── capTitle ─────────────────────────────────────────────────────────────────

describe("capTitle", () => {
  it("truncates a string to the given length", () => {
    expect(capTitle("Hello World", 5)).toBe("Hello");
  });

  it("returns the full string when shorter than maxLen", () => {
    expect(capTitle("Hi", 80)).toBe("Hi");
  });

  it("defaults to 80-char cap", () => {
    const long = "x".repeat(100);
    expect(capTitle(long)).toHaveLength(80);
  });

  it("returns empty string for empty input", () => {
    expect(capTitle("", 10)).toBe("");
  });

  it("returns exactly maxLen characters when input equals maxLen", () => {
    expect(capTitle("abc", 3)).toBe("abc");
  });
});

// ── buildCommandTitle ─────────────────────────────────────────────────────────

describe("buildCommandTitle", () => {
  it("search: returns Search: <query>", () => {
    expect(buildCommandTitle("search", "AI assistants")).toBe(
      "Search: AI assistants"
    );
  });

  it("search: slices query at 60 chars", () => {
    const longQuery = "q".repeat(70);
    const result = buildCommandTitle("search", longQuery);
    expect(result).toBe(`Search: ${"q".repeat(60)}`);
  });

  it("summarize: extracts hostname from valid URL", () => {
    expect(buildCommandTitle("summarize", "https://example.com/page")).toBe(
      "Summarize: example.com"
    );
  });

  it("read: extracts hostname from valid URL", () => {
    expect(buildCommandTitle("read", "https://news.ycombinator.com/")).toBe(
      "Read: news.ycombinator.com"
    );
  });

  it("summarize: falls back to sliced args on invalid URL", () => {
    const result = buildCommandTitle("summarize", "not a url");
    expect(result).toBe("Summarize: not a url");
  });

  it("read: falls back to sliced args on invalid URL", () => {
    const longArgs = "x".repeat(70);
    const result = buildCommandTitle("read", longArgs);
    expect(result).toBe(`Read: ${"x".repeat(60)}`);
  });
});

// ── findMostRecentScrapedMessage ──────────────────────────────────────────────

describe("findMostRecentScrapedMessage", () => {
  it("returns undefined for an empty array", () => {
    expect(findMostRecentScrapedMessage([])).toBeUndefined();
  });

  it("returns undefined when no assistant messages have scraped_content", () => {
    const messages: MessageRow[] = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi", metadata: {} },
    ];
    expect(findMostRecentScrapedMessage(messages)).toBeUndefined();
  });

  it("ignores user messages even when they have scraped_content in metadata", () => {
    const messages: MessageRow[] = [
      {
        role: "user",
        content: "hello",
        metadata: { scraped_content: "some content" },
      },
    ];
    expect(findMostRecentScrapedMessage(messages)).toBeUndefined();
  });

  it("returns the assistant message with scraped_content", () => {
    const msg: MessageRow = {
      role: "assistant",
      content: "summary",
      metadata: { scraped_content: "page text", source_url: "https://a.com" },
    };
    const messages: MessageRow[] = [{ role: "user", content: "hi" }, msg];
    expect(findMostRecentScrapedMessage(messages)).toBe(msg);
  });

  it("returns the MOST RECENT assistant message with scraped_content", () => {
    const older: MessageRow = {
      role: "assistant",
      content: "first summary",
      metadata: { scraped_content: "old content", source_url: "https://old.com" },
    };
    const newer: MessageRow = {
      role: "assistant",
      content: "second summary",
      metadata: { scraped_content: "new content", source_url: "https://new.com" },
    };
    const messages: MessageRow[] = [
      { role: "user", content: "q1" },
      older,
      { role: "user", content: "q2" },
      newer,
    ];
    expect(findMostRecentScrapedMessage(messages)).toBe(newer);
  });

  it("skips assistant messages without scraped_content and returns the one that has it", () => {
    const withContent: MessageRow = {
      role: "assistant",
      content: "summary",
      metadata: { scraped_content: "page text" },
    };
    const withoutContent: MessageRow = {
      role: "assistant",
      content: "follow-up",
      metadata: {},
    };
    const messages: MessageRow[] = [withContent, withoutContent];
    expect(findMostRecentScrapedMessage(messages)).toBe(withContent);
  });
});

// ── buildFollowUpContextMessage ───────────────────────────────────────────────

describe("buildFollowUpContextMessage", () => {
  it("returns undefined when history is empty", () => {
    expect(buildFollowUpContextMessage([])).toBeUndefined();
  });

  it("returns undefined when no scraped messages exist", () => {
    const messages: MessageRow[] = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello", metadata: {} },
    ];
    expect(buildFollowUpContextMessage(messages)).toBeUndefined();
  });

  it("returns a system message with the source_url and truncated content", () => {
    const messages: MessageRow[] = [
      {
        role: "assistant",
        content: "summary",
        metadata: {
          scraped_content: "page text",
          source_url: "https://example.com",
        },
      },
    ];
    const result = buildFollowUpContextMessage(messages);
    expect(result).not.toBeUndefined();
    expect(result!.role).toBe("system");
    expect(result!.content).toContain("https://example.com");
    expect(result!.content).toContain("page text");
  });

  it("truncates scraped_content to 8000 chars in the output", () => {
    const longContent = "x".repeat(10000);
    const messages: MessageRow[] = [
      {
        role: "assistant",
        content: "summary",
        metadata: {
          scraped_content: longContent,
          source_url: "https://example.com",
        },
      },
    ];
    const result = buildFollowUpContextMessage(messages);
    // The content field must not exceed 8000 chars of the scraped text
    expect(result!.content).toContain("x".repeat(8000));
    expect(result!.content).not.toContain("x".repeat(8001));
  });

  it("handles missing source_url gracefully", () => {
    const messages: MessageRow[] = [
      {
        role: "assistant",
        content: "summary",
        metadata: { scraped_content: "some text" },
      },
    ];
    const result = buildFollowUpContextMessage(messages);
    expect(result).not.toBeUndefined();
    expect(result!.content).toContain("some text");
    expect(result!.content).toContain("loaded a page");
  });
});

// ── buildHistoryTurns ─────────────────────────────────────────────────────────

describe("buildHistoryTurns", () => {
  it("returns an empty array for empty input", () => {
    expect(buildHistoryTurns([])).toEqual([]);
  });

  it("filters out system messages", () => {
    const messages: MessageRow[] = [
      { role: "system", content: "system prompt" },
      { role: "user", content: "hi" },
    ];
    const turns = buildHistoryTurns(messages);
    expect(turns).toHaveLength(1);
    expect(turns[0].role).toBe("user");
  });

  it("includes user and assistant messages with correct roles", () => {
    const messages: MessageRow[] = [
      { role: "user", content: "question" },
      { role: "assistant", content: "answer" },
    ];
    const turns = buildHistoryTurns(messages);
    expect(turns).toEqual([
      { role: "user", content: "question" },
      { role: "assistant", content: "answer" },
    ]);
  });

  it("preserves ordering (oldest first)", () => {
    const messages: MessageRow[] = [
      { role: "user", content: "first" },
      { role: "assistant", content: "second" },
      { role: "user", content: "third" },
    ];
    const turns = buildHistoryTurns(messages);
    expect(turns.map((t) => t.content)).toEqual(["first", "second", "third"]);
  });

  it("includes only role and content fields (no metadata)", () => {
    const messages: MessageRow[] = [
      {
        role: "assistant",
        content: "summary",
        metadata: { scraped_content: "page data", source_url: "https://a.com" },
      },
    ];
    const turns = buildHistoryTurns(messages);
    expect(turns[0]).toEqual({ role: "assistant", content: "summary" });
    expect(Object.keys(turns[0])).toEqual(["role", "content"]);
  });
});
