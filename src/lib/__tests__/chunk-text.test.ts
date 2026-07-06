import { describe, it, expect } from "vitest";
import { chunkTextForSummary } from "../chunk-text";

describe("chunkTextForSummary", () => {
  // ── single-chunk passthrough ──────────────────────────────────────────────
  it("returns a single chunk and no truncation when text fits in maxChars", () => {
    const text = "Hello world";
    const result = chunkTextForSummary(text, 100);
    expect(result.chunks).toEqual([text]);
    expect(result.truncated).toBe(false);
    expect(result.coveragePercent).toBe(100);
  });

  it("returns a single chunk when text length equals maxChars exactly", () => {
    const text = "a".repeat(50);
    const result = chunkTextForSummary(text, 50);
    expect(result.chunks).toHaveLength(1);
    expect(result.truncated).toBe(false);
  });

  // ── paragraph boundary splitting ─────────────────────────────────────────
  it("splits on paragraph boundaries before hard-splitting", () => {
    const para1 = "First paragraph.";
    const para2 = "Second paragraph.";
    const text = para1 + "\n\n" + para2;

    // maxChars is large enough for each paragraph but not both together
    const result = chunkTextForSummary(text, 20);
    expect(result.chunks).toHaveLength(2);
    expect(result.chunks[0]).toBe(para1);
    expect(result.chunks[1]).toBe(para2);
    expect(result.truncated).toBe(false);
  });

  it("accumulates paragraphs into one chunk when they fit", () => {
    const para1 = "Short.";
    const para2 = "Also short.";
    const text = para1 + "\n\n" + para2;

    const result = chunkTextForSummary(text, 100);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]).toContain(para1);
    expect(result.chunks[0]).toContain(para2);
  });

  it("hard-splits a single paragraph that exceeds maxChars", () => {
    const longPara = "x".repeat(150);
    const result = chunkTextForSummary(longPara, 50);
    // 150 chars / 50 = 3 chunks
    expect(result.chunks).toHaveLength(3);
    result.chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(50));
    expect(result.truncated).toBe(false);
  });

  // ── 10-chunk cap ─────────────────────────────────────────────────────────
  it("caps output at 10 chunks and marks truncated when input needs more", () => {
    // Create 15 paragraphs that each need their own chunk
    const paras = Array.from({ length: 15 }, (_, i) => `Paragraph ${i + 1} content.`);
    const text = paras.join("\n\n");

    const result = chunkTextForSummary(text, 25); // each para > 10 chars, ensure each gets its own chunk
    expect(result.chunks.length).toBeLessThanOrEqual(10);
    expect(result.truncated).toBe(true);
    expect(result.coveragePercent).toBeGreaterThan(0);
    expect(result.coveragePercent).toBeLessThan(100);
  });

  it("does not set truncated when exactly 10 chunks are produced", () => {
    // Each paragraph is 25 chars, maxChars is 25 → exactly one para per chunk
    const paras = Array.from({ length: 10 }, () => "a".repeat(25));
    const text = paras.join("\n\n");

    const result = chunkTextForSummary(text, 25);
    expect(result.chunks).toHaveLength(10);
    expect(result.truncated).toBe(false);
    expect(result.coveragePercent).toBe(100);
  });

  // ── coverage percentage ───────────────────────────────────────────────────
  it("reports coveragePercent < 100 when truncated, > 0", () => {
    // 20 paragraphs of 30 chars each; maxChars = 30 so one para per chunk
    const paras = Array.from({ length: 20 }, () => "b".repeat(30));
    const text = paras.join("\n\n");

    const result = chunkTextForSummary(text, 30);
    expect(result.truncated).toBe(true);
    expect(result.coveragePercent).toBeGreaterThan(0);
    expect(result.coveragePercent).toBeLessThanOrEqual(99);
  });

  it("sets coveragePercent to 100 when not truncated", () => {
    const text = "Para one.\n\nPara two.\n\nPara three.";
    const result = chunkTextForSummary(text, 200);
    expect(result.truncated).toBe(false);
    expect(result.coveragePercent).toBe(100);
  });

  // ── edge cases ────────────────────────────────────────────────────────────
  it("skips empty or whitespace-only paragraphs", () => {
    const text = "Real paragraph.\n\n   \n\nAnother paragraph.";
    const result = chunkTextForSummary(text, 100);
    expect(result.chunks).toHaveLength(1);
  });

  it("handles text with no paragraph breaks as a single paragraph", () => {
    const text = "a".repeat(200);
    const result = chunkTextForSummary(text, 50);
    expect(result.chunks).toHaveLength(4);
    result.chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(50));
  });
});
