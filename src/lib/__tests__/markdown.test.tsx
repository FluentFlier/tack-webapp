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
    expect(out).toContain('href="https://google.com"');
    expect(out).toContain("Google");
  });

  it("anchor has target=_blank and rel=noopener noreferrer", () => {
    const out = html("[Example](https://example.com)");
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("bare URL becomes a link with the URL as text", () => {
    const out = html("Visit https://example.com today.");
    expect(out).toContain('href="https://example.com"');
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

  it("ALL-CAPS line is rendered without crashing (backward compat)", () => {
    const out = html("INTRODUCTION\n\nSome text here.");
    expect(out).toBeDefined();
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

  // ── XSS guard ─────────────────────────────────────────────────────────────

  it("javascript: links are NOT rendered as anchors (XSS guard)", () => {
    const out = html("[click me](javascript:alert(1))");
    // Must not emit a javascript: href attribute — that is the XSS vector
    expect(out).not.toMatch(/href=["']javascript:/i);
    // The link text must still be visible (rendered as plain text, not an anchor)
    expect(out).toContain("click me");
    // No <a> tag should be present for this input
    expect(out).not.toContain("<a ");
  });

  // ── Trailing hashes in headings ───────────────────────────────────────────

  it("trailing hashes on a heading are stripped", () => {
    const out = html("## Introduction ##");
    expect(out).toContain("Introduction");
    expect(out).not.toContain("##");
  });

  it("trailing hashes with no space are not stripped (not trailing hash syntax)", () => {
    // "## Foo##" has no space before the trailing hashes — HEADING_RE captures
    // "Foo##" as text and our strip regex requires a leading space, so it is
    // left as-is, which is the expected behaviour.
    const out = html("## Foo##");
    expect(out).toContain("<h2");
  });
});
