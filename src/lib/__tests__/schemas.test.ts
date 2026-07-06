import { describe, it, expect } from "vitest";
import {
  chatSchema,
  shortenSchema,
  summarizeSchema,
  extractSchema,
} from "../validation";

// ── chatSchema ────────────────────────────────────────────────────────────────

describe("chatSchema", () => {
  it("accepts a minimal valid message", () => {
    const result = chatSchema.safeParse({ message: "Hello" });
    expect(result.success).toBe(true);
  });

  it("accepts a message with optional fields", () => {
    const result = chatSchema.safeParse({
      message: "Search this",
      conversation_id: "123e4567-e89b-12d3-a456-426614174000",
      command: "search",
      args: "example query",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    const result = chatSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a message that exceeds 4000 characters", () => {
    const result = chatSchema.safeParse({ message: "x".repeat(4001) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBeTruthy();
  });

  it("accepts a message of exactly 4000 characters", () => {
    const result = chatSchema.safeParse({ message: "x".repeat(4000) });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid conversation_id (not a UUID)", () => {
    const result = chatSchema.safeParse({
      message: "Hello",
      conversation_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown command value", () => {
    const result = chatSchema.safeParse({ message: "Hi", command: "delete" });
    expect(result.success).toBe(false);
  });

  it("rejects args exceeding 2000 characters", () => {
    const result = chatSchema.safeParse({
      message: "Hi",
      command: "search",
      args: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing message field", () => {
    const result = chatSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── shortenSchema ─────────────────────────────────────────────────────────────

describe("shortenSchema", () => {
  it("accepts valid text and percent", () => {
    const result = shortenSchema.safeParse({ text: "Hello world", percent: 30 });
    expect(result.success).toBe(true);
  });

  it("accepts boundary values (percent 5 and 95)", () => {
    expect(shortenSchema.safeParse({ text: "Hi", percent: 5 }).success).toBe(true);
    expect(shortenSchema.safeParse({ text: "Hi", percent: 95 }).success).toBe(true);
  });

  it("rejects an empty text string", () => {
    const result = shortenSchema.safeParse({ text: "", percent: 30 });
    expect(result.success).toBe(false);
  });

  it("rejects text exceeding 20000 characters", () => {
    const result = shortenSchema.safeParse({
      text: "x".repeat(20001),
      percent: 30,
    });
    expect(result.success).toBe(false);
  });

  it("rejects percent below 5", () => {
    const result = shortenSchema.safeParse({ text: "Hi", percent: 4 });
    expect(result.success).toBe(false);
  });

  it("rejects percent above 95", () => {
    const result = shortenSchema.safeParse({ text: "Hi", percent: 96 });
    expect(result.success).toBe(false);
  });

  it("rejects a string percent (type mismatch)", () => {
    const result = shortenSchema.safeParse({ text: "Hi", percent: "50" });
    expect(result.success).toBe(false);
  });
});

// ── summarizeSchema ───────────────────────────────────────────────────────────

describe("summarizeSchema", () => {
  it("accepts valid text and targetLength", () => {
    const result = summarizeSchema.safeParse({
      text: "Hello world",
      targetLength: 200,
    });
    expect(result.success).toBe(true);
  });

  it("accepts boundary values (targetLength 50 and 2000)", () => {
    expect(
      summarizeSchema.safeParse({ text: "Hi", targetLength: 50 }).success
    ).toBe(true);
    expect(
      summarizeSchema.safeParse({ text: "Hi", targetLength: 2000 }).success
    ).toBe(true);
  });

  it("rejects an empty text string", () => {
    const result = summarizeSchema.safeParse({ text: "", targetLength: 200 });
    expect(result.success).toBe(false);
  });

  it("rejects text exceeding 20000 characters", () => {
    const result = summarizeSchema.safeParse({
      text: "x".repeat(20001),
      targetLength: 200,
    });
    expect(result.success).toBe(false);
  });

  it("rejects targetLength below 50", () => {
    const result = summarizeSchema.safeParse({ text: "Hi", targetLength: 49 });
    expect(result.success).toBe(false);
  });

  it("rejects targetLength above 2000", () => {
    const result = summarizeSchema.safeParse({
      text: "Hi",
      targetLength: 2001,
    });
    expect(result.success).toBe(false);
  });
});

// ── extractSchema ─────────────────────────────────────────────────────────────

describe("extractSchema", () => {
  it("accepts a valid https URL", () => {
    const result = extractSchema.safeParse({ url: "https://example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid http URL with a path", () => {
    const result = extractSchema.safeParse({
      url: "http://example.com/articles/1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty url string", () => {
    const result = extractSchema.safeParse({ url: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL string", () => {
    const result = extractSchema.safeParse({ url: "not a url" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBeTruthy();
  });

  it("rejects a missing url field", () => {
    const result = extractSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
