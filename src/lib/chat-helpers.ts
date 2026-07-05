/**
 * Pure helper functions for the chat route.
 * Exported for unit testing without requiring SDK mocks.
 */

export interface MessageRow {
  role: string;
  content: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Strips surrounding quote characters (ASCII and Unicode curly quotes) from
 * an AI-generated title.
 */
export function stripTitleQuotes(title: string): string {
  // Remove leading/trailing ASCII quotes, backticks, and Unicode curly quotes
  return title
    .replace(/^["'`‘’“”]+/, "")
    .replace(/["'`‘’“”]+$/, "")
    .trim();
}

/**
 * Caps a string to maxLen characters.
 */
export function capTitle(title: string, maxLen = 80): string {
  return title.slice(0, maxLen);
}

/**
 * Build a deterministic title fallback for command-driven messages.
 *
 * - summarize: "Summarize: <hostname>"
 * - read:      "Read: <hostname>"
 * - search:    "Search: <query sliced to 60 chars>"
 *
 * Falls back to sliced args when the URL is unparseable.
 */
export function buildCommandTitle(
  command: "summarize" | "read" | "search",
  args: string
): string {
  if (command === "search") {
    return `Search: ${args.slice(0, 60)}`;
  }
  const label = command === "summarize" ? "Summarize" : "Read";
  try {
    const hostname = new URL(args.trim()).hostname;
    return `${label}: ${hostname}`;
  } catch {
    return `${label}: ${args.slice(0, 60)}`;
  }
}

/**
 * Given an array of message rows ordered ascending (oldest first), find the
 * most recent assistant message that carries `metadata.scraped_content`.
 */
export function findMostRecentScrapedMessage(
  messages: MessageRow[]
): MessageRow | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (
      msg.role === "assistant" &&
      msg.metadata != null &&
      typeof msg.metadata.scraped_content === "string"
    ) {
      return msg;
    }
  }
  return undefined;
}

/**
 * Build the follow-up context system message from prior conversation history.
 *
 * Finds the most recent assistant message with `metadata.scraped_content` and
 * returns a system message that injects the page URL and truncated content
 * (first 8000 chars). Returns undefined when no such message exists.
 */
export function buildFollowUpContextMessage(
  messages: MessageRow[]
): { role: "system"; content: string } | undefined {
  const scraped = findMostRecentScrapedMessage(messages);
  if (!scraped) return undefined;

  const sourceUrl = scraped.metadata?.source_url as string | undefined;
  const scrapedContent = (scraped.metadata!.scraped_content as string).slice(
    0,
    8000
  );

  const urlLine =
    sourceUrl != null
      ? `Earlier in this conversation the user loaded this page: ${sourceUrl}`
      : "Earlier in this conversation the user loaded a page.";

  return {
    role: "system",
    content: `${urlLine}\n\nPage content (truncated):\n${scrapedContent}`,
  };
}

/**
 * Build the list of history turns (role/content pairs) for user and assistant
 * messages only. Input messages must be ordered ascending (oldest first).
 */
export function buildHistoryTurns(
  messages: MessageRow[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}
