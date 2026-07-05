import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "../rate-limit";

// Use a counter to generate unique keys per test so tests don't interfere
// with each other through the shared module-level Map.
let keyIndex = 0;
const uniqueKey = (label: string) => `test-${label}-${++keyIndex}`;

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit and returns correct remaining counts", () => {
    const key = uniqueKey("allow");
    const limit = 3;

    const r1 = checkRateLimit(key, limit, 60000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, limit, 60000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, limit, 60000);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks the request after the limit is reached", () => {
    const key = uniqueKey("block");
    const limit = 2;

    checkRateLimit(key, limit, 60000);
    checkRateLimit(key, limit, 60000);

    const r = checkRateLimit(key, limit, 60000);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("continues to block while within the window", () => {
    const key = uniqueKey("block-window");

    checkRateLimit(key, 1, 60000); // consume the only slot

    // Advance to just before the window expires
    vi.advanceTimersByTime(59999);

    expect(checkRateLimit(key, 1, 60000).allowed).toBe(false);
  });

  it("resets the counter after the window has elapsed", () => {
    const key = uniqueKey("reset");

    checkRateLimit(key, 1, 60000); // consume
    expect(checkRateLimit(key, 1, 60000).allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(60001);

    const r = checkRateLimit(key, 1, 60000);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(0);
  });

  it("independent keys do not affect each other", () => {
    const keyA = uniqueKey("indep-a");
    const keyB = uniqueKey("indep-b");

    checkRateLimit(keyA, 1, 60000); // exhaust keyA

    // keyB is untouched
    expect(checkRateLimit(keyB, 1, 60000).allowed).toBe(true);
    // keyA remains blocked
    expect(checkRateLimit(keyA, 1, 60000).allowed).toBe(false);
  });

  it("uses the windowMs parameter correctly", () => {
    const key = uniqueKey("window-ms");

    checkRateLimit(key, 1, 5000); // consume with a 5 s window
    expect(checkRateLimit(key, 1, 5000).allowed).toBe(false);

    vi.advanceTimersByTime(5001);

    expect(checkRateLimit(key, 1, 5000).allowed).toBe(true);
  });
});
