import { describe, it, expect } from "vitest";
import { parseCommand, COMMANDS } from "../commands";

describe("parseCommand", () => {
  // ── Non-command inputs ────────────────────────────────────────────────────

  it("returns isCommand false for plain text", () => {
    const result = parseCommand("hello world");
    expect(result.isCommand).toBe(false);
    expect(result.command).toBeUndefined();
    expect(result.args).toBeUndefined();
  });

  it("returns isCommand false for an empty string", () => {
    expect(parseCommand("").isCommand).toBe(false);
  });

  it("returns isCommand false for an unknown slash command", () => {
    const result = parseCommand("/unknowncommand");
    expect(result.isCommand).toBe(false);
    expect(result.command).toBeUndefined();
  });

  it("returns isCommand false for a slash-only input", () => {
    // "/" alone has no command name after the slash
    const result = parseCommand("/");
    expect(result.isCommand).toBe(false);
  });

  // ── Known commands ────────────────────────────────────────────────────────

  it("recognises /summarize and extracts the URL as args", () => {
    const result = parseCommand("/summarize https://example.com");
    expect(result.isCommand).toBe(true);
    expect(result.command?.name).toBe("summarize");
    expect(result.args).toBe("https://example.com");
  });

  it("recognises /read and extracts the URL as args", () => {
    const result = parseCommand("/read https://example.com/page");
    expect(result.isCommand).toBe(true);
    expect(result.command?.name).toBe("read");
    expect(result.args).toBe("https://example.com/page");
  });

  it("recognises /search and joins multi-word query as args", () => {
    const result = parseCommand("/search hello world");
    expect(result.isCommand).toBe(true);
    expect(result.command?.name).toBe("search");
    expect(result.args).toBe("hello world");
  });

  it("recognises /help with no args", () => {
    const result = parseCommand("/help");
    expect(result.isCommand).toBe(true);
    expect(result.command?.name).toBe("help");
    expect(result.args).toBe("");
  });

  it("recognises /clear with no args", () => {
    const result = parseCommand("/clear");
    expect(result.isCommand).toBe(true);
    expect(result.command?.name).toBe("clear");
  });

  it("is case-insensitive for command names", () => {
    const result = parseCommand("/SUMMARIZE https://example.com");
    expect(result.isCommand).toBe(true);
    expect(result.command?.name).toBe("summarize");
  });

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

  // ── COMMANDS registry ─────────────────────────────────────────────────────

  it("COMMANDS contains expected command names", () => {
    const names = COMMANDS.map((c) => c.name);
    expect(names).toContain("help");
    expect(names).toContain("summarize");
    expect(names).toContain("read");
    expect(names).toContain("search");
    expect(names).toContain("clear");
  });
});
