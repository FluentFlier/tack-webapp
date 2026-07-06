import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AiRequestQueue, RateLimitError, UnauthorizedError } from "../request-queue";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a task that resolves to `value` after `delayMs`. */
function makeTask<T>(value: T, delayMs = 0): () => Promise<T> {
  return () =>
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(value), delayMs)
    );
}

/** Returns a task that rejects with `error` after `delayMs`. */
function makeFailingTask(error: unknown, delayMs = 0): () => Promise<never> {
  return () =>
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(error), delayMs)
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AiRequestQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── basic resolution ──────────────────────────────────────────────────────
  it("resolves the return value of the task", async () => {
    const queue = new AiRequestQueue(2, 0); // no gap to simplify
    const promise = queue.enqueue(makeTask("hello"));
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("hello");
  });

  it("propagates non-429 errors to the caller", async () => {
    const queue = new AiRequestQueue(2, 0);
    const err = new Error("boom");
    const promise = queue.enqueue(makeFailingTask(err));
    // Attach the assertion handler BEFORE advancing timers so that when the
    // rejection fires inside runAllTimersAsync it is immediately handled.
    const assertion = expect(promise).rejects.toThrow("boom");
    await vi.runAllTimersAsync();
    await assertion;
  });

  // ── ordering ──────────────────────────────────────────────────────────────
  it("processes tasks in FIFO order", async () => {
    const queue = new AiRequestQueue(1, 0); // serial
    const results: number[] = [];

    const p1 = queue.enqueue(async () => { results.push(1); return 1; });
    const p2 = queue.enqueue(async () => { results.push(2); return 2; });
    const p3 = queue.enqueue(async () => { results.push(3); return 3; });

    await vi.runAllTimersAsync();
    await Promise.all([p1, p2, p3]);

    expect(results).toEqual([1, 2, 3]);
  });

  // ── concurrency ───────────────────────────────────────────────────────────
  it("runs no more than maxConcurrent tasks at a time", async () => {
    // No gap so the scheduler starts tasks as fast as concurrency allows.
    const queue = new AiRequestQueue(2, 0);
    let concurrent = 0;
    let maxObserved = 0;

    const task = () =>
      new Promise<void>((resolve) => {
        concurrent++;
        if (concurrent > maxObserved) maxObserved = concurrent;
        setTimeout(() => {
          concurrent--;
          resolve();
        }, 100);
      });

    // Enqueue 4 tasks; the queue must never run more than 2 simultaneously.
    const p1 = queue.enqueue(task);
    const p2 = queue.enqueue(task);
    const p3 = queue.enqueue(task);
    const p4 = queue.enqueue(task);

    await vi.runAllTimersAsync();
    await Promise.all([p1, p2, p3, p4]);

    expect(maxObserved).toBeLessThanOrEqual(2);
  });

  // ── minimum gap ───────────────────────────────────────────────────────────
  it("enforces the minimum gap between task starts", async () => {
    const startTimes: number[] = [];
    const minGapMs = 500;
    // maxConcurrent=2, but the 500 ms gap means tasks start at most 2 per second.
    const queue = new AiRequestQueue(2, minGapMs);

    // Tasks resolve immediately so the only delay is the gap itself.
    const task = () =>
      new Promise<void>((resolve) => {
        startTimes.push(Date.now());
        resolve();
      });

    const p1 = queue.enqueue(task);
    const p2 = queue.enqueue(task);
    const p3 = queue.enqueue(task);

    await vi.runAllTimersAsync();
    await Promise.all([p1, p2, p3]);

    expect(startTimes.length).toBe(3);
    // Consecutive task starts must be separated by at least minGapMs.
    for (let i = 1; i < startTimes.length; i++) {
      expect(startTimes[i] - startTimes[i - 1]).toBeGreaterThanOrEqual(minGapMs);
    }
  });

  // ── 429 retry logic ───────────────────────────────────────────────────────
  it("retries once after a RateLimitError and succeeds on retry", async () => {
    const pauseMs = 1000; // short pause for testing
    const queue = new AiRequestQueue(2, 0, pauseMs);

    let callCount = 0;
    const task = async () => {
      callCount++;
      if (callCount === 1) throw new RateLimitError();
      return "ok";
    };

    const promise = queue.enqueue(task);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(callCount).toBe(2);
  });

  it("propagates RateLimitError after two consecutive 429s", async () => {
    const pauseMs = 1000;
    const queue = new AiRequestQueue(2, 0, pauseMs);

    const task = makeFailingTask(new RateLimitError());
    const promise = queue.enqueue(task);
    // Attach assertion handler first so the rejection is not unhandled during timer run.
    const assertion = expect(promise).rejects.toBeInstanceOf(RateLimitError);
    await vi.runAllTimersAsync();
    await assertion;
  });

  it("pauses queued tasks after a 429 for the configured duration", async () => {
    // Use maxConcurrent=1 to keep the scheduler sequential: p2 cannot start
    // until p1 has completed (including the retry delay).
    const pauseMs = 5_000;
    const queue = new AiRequestQueue(1, 0, pauseMs);

    // Record only the FIRST invocation of task1 (it gets retried after the pause).
    let task1FirstCallTime = -1;
    let task2StartTime = -1;

    const task1 = async (): Promise<string> => {
      if (task1FirstCallTime === -1) task1FirstCallTime = Date.now();
      throw new RateLimitError();
    };

    const task2 = async () => {
      task2StartTime = Date.now();
      return "second";
    };

    // Pre-attach rejection handler so the rejected promise is never unhandled.
    const p1 = queue.enqueue(task1).catch(() => "caught");
    const p2 = queue.enqueue(task2);

    await vi.runAllTimersAsync();
    await Promise.allSettled([p1, p2]);

    expect(task1FirstCallTime).toBeGreaterThan(-1);
    expect(task2StartTime).toBeGreaterThan(-1);
    // task2 must start at least pauseMs after task1's first attempt (the retry
    // delay must have elapsed before the scheduler can pick up task2).
    expect(task2StartTime - task1FirstCallTime).toBeGreaterThanOrEqual(pauseMs);
  });

  // ── error types ───────────────────────────────────────────────────────────
  it("propagates UnauthorizedError without retrying", async () => {
    const queue = new AiRequestQueue(2, 0);
    let callCount = 0;

    const task = async () => {
      callCount++;
      throw new UnauthorizedError();
    };

    const promise = queue.enqueue(task);
    // Attach assertion handler first — the rejection fires during runAllTimersAsync.
    const assertion = expect(promise).rejects.toBeInstanceOf(UnauthorizedError);
    await vi.runAllTimersAsync();
    await assertion;
    // Should NOT retry (retry only happens for RateLimitError)
    expect(callCount).toBe(1);
  });

  it("exports RateLimitError and UnauthorizedError as distinct classes", () => {
    expect(new RateLimitError()).toBeInstanceOf(RateLimitError);
    expect(new RateLimitError()).toBeInstanceOf(Error);
    expect(new UnauthorizedError()).toBeInstanceOf(UnauthorizedError);
    expect(new UnauthorizedError()).toBeInstanceOf(Error);
    expect(new RateLimitError()).not.toBeInstanceOf(UnauthorizedError);
  });
});
