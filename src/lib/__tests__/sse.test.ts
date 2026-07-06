import { describe, it, expect } from "vitest";
import { parseSSEChunk } from "../sse";

describe("parseSSEChunk", () => {
  it("parses a single complete event", () => {
    const { events, buffer } = parseSSEChunk(
      'event: token\ndata: {"delta":"hello"}\n\n',
      "",
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ event: "token", data: '{"delta":"hello"}' });
    expect(buffer).toBe("");
  });

  it("parses multiple events in one chunk", () => {
    const { events, buffer } = parseSSEChunk(
      'event: token\ndata: {"delta":"a"}\n\nevent: token\ndata: {"delta":"b"}\n\n',
      "",
    );
    expect(events).toHaveLength(2);
    expect(events[0].data).toBe('{"delta":"a"}');
    expect(events[1].data).toBe('{"delta":"b"}');
    expect(buffer).toBe("");
  });

  it("carries over an incomplete event across chunks", () => {
    const first = parseSSEChunk('event: token\ndata: {"delt', "");
    expect(first.events).toHaveLength(0);
    expect(first.buffer).toBe('event: token\ndata: {"delt');

    const second = parseSSEChunk('a":"x"}\n\n', first.buffer);
    expect(second.events).toHaveLength(1);
    expect(second.events[0]).toEqual({
      event: "token",
      data: '{"delta":"x"}',
    });
    expect(second.buffer).toBe("");
  });

  it("defaults the event name to 'message' when no event: field is present", () => {
    const { events } = parseSSEChunk('data: {"foo":"bar"}\n\n', "");
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("message");
    expect(events[0].data).toBe('{"foo":"bar"}');
  });

  it("ignores event blocks with no data field", () => {
    const { events } = parseSSEChunk("event: ping\n\n", "");
    expect(events).toHaveLength(0);
  });

  it("handles a split that breaks across the blank-line boundary", () => {
    // First chunk ends with the first \n of the \n\n boundary.
    const first = parseSSEChunk('event: done\ndata: {"x":1}\n', "");
    expect(first.events).toHaveLength(0);

    // Second chunk supplies the second \n to complete the boundary.
    const second = parseSSEChunk("\n", first.buffer);
    expect(second.events).toHaveLength(1);
    expect(second.events[0]).toEqual({ event: "done", data: '{"x":1}' });
  });

  it("accumulates buffer correctly through many partial chunks", () => {
    let { buffer } = parseSSEChunk("event: tok", "");
    ({ buffer } = parseSSEChunk("en\ndata: {", buffer));
    ({ buffer } = parseSSEChunk('"delta":"z"}\n', buffer));
    const { events } = parseSSEChunk("\n", buffer);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ event: "token", data: '{"delta":"z"}' });
  });

  it("returns empty events and empty buffer for an empty chunk", () => {
    const { events, buffer } = parseSSEChunk("", "");
    expect(events).toHaveLength(0);
    expect(buffer).toBe("");
  });

  it("handles a non-empty buffer with an empty chunk", () => {
    const partial = 'event: status\ndata: {"message":"Fetching page..."}';
    const { events, buffer } = parseSSEChunk("", partial);
    expect(events).toHaveLength(0);
    // Buffer should be unchanged since nothing completed.
    expect(buffer).toBe(partial);
  });

  it("parses done event with JSON payload", () => {
    const payload = JSON.stringify({ message: { id: "abc" }, conversation_id: "cid" });
    const { events } = parseSSEChunk(`event: done\ndata: ${payload}\n\n`, "");
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("done");
    const parsed = JSON.parse(events[0].data);
    expect(parsed.conversation_id).toBe("cid");
  });

  it("handles status and token events in sequence", () => {
    const chunk =
      'event: status\ndata: {"message":"Fetching page..."}\n\n' +
      'event: token\ndata: {"delta":"Hello"}\n\n' +
      'event: token\ndata: {"delta":" world"}\n\n';
    const { events, buffer } = parseSSEChunk(chunk, "");
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ event: "status", data: '{"message":"Fetching page..."}' });
    expect(events[1]).toEqual({ event: "token", data: '{"delta":"Hello"}' });
    expect(events[2]).toEqual({ event: "token", data: '{"delta":" world"}' });
    expect(buffer).toBe("");
  });
});
