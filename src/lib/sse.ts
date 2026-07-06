/**
 * SSE parsing utilities for consuming server-sent events streams.
 *
 * The standard SSE format is:
 *   event: <name>\n
 *   data: <payload>\n
 *   \n  ← event boundary (blank line)
 *
 * Chunks from a ReadableStream may split events across boundaries, so
 * this helper maintains a carry-over buffer between calls.
 */

export interface SSEEvent {
  /** The event name from the `event:` field (defaults to "message"). */
  event: string;
  /** The raw data string from the `data:` field. */
  data: string;
}

/**
 * Parse a new text chunk from an SSE stream, returning all complete events
 * found and the carry-over buffer to pass into the next call.
 *
 * @param chunk  New text decoded from the stream (may be empty).
 * @param buffer Carry-over text from the previous call (pass "" initially).
 * @returns      `{ events, buffer }` — complete events and the new carry-over.
 *
 * @example
 * ```ts
 * let buffer = "";
 * for await (const value of reader) {
 *   const text = decoder.decode(value, { stream: true });
 *   const { events, buffer: next } = parseSSEChunk(text, buffer);
 *   buffer = next;
 *   for (const e of events) { ... }
 * }
 * ```
 */
export function parseSSEChunk(
  chunk: string,
  buffer: string,
): { events: SSEEvent[]; buffer: string } {
  buffer += chunk;
  const events: SSEEvent[] = [];

  // Events are delimited by a blank line (\n\n). Split on that boundary.
  const parts = buffer.split("\n\n");

  // The last element is an incomplete carry-over (may be "" or partial event).
  buffer = parts.pop() ?? "";

  for (const part of parts) {
    const lines = part.split("\n");
    let event = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }

    // Only emit an event when there is a data payload.
    if (data !== "") {
      events.push({ event, data });
    }
  }

  return { events, buffer };
}
