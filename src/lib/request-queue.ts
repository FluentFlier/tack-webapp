// Shared request queue for AI API calls — limits concurrency and rate of requests
// to avoid triggering per-user rate limits on the server.

/** Thrown when the server returns HTTP 429 (after retry exhaustion). */
export class RateLimitError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Thrown when the server returns HTTP 401. */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface QueueItem {
  fn: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

/**
 * A scheduler-based promise queue that:
 *  - starts at most `maxConcurrent` tasks simultaneously
 *  - enforces a minimum gap of `minGapMs` between successive task *starts*
 *  - on a `RateLimitError`: pauses the queue for `pauseMs` and retries the
 *    failed task once; a second `RateLimitError` propagates to the caller
 *
 * Uses a single scheduler loop so that concurrency and gap checks are
 * serialised — no race conditions between concurrent `enqueue` callers.
 */
export class AiRequestQueue {
  private readonly _maxConcurrent: number;
  private readonly _minGapMs: number;
  private readonly _pauseMs: number;

  private _active = 0;
  private _lastStartMs = 0;
  private _pauseUntilMs = 0;

  private _pending: QueueItem[] = [];
  /** Waiters that are blocked on a concurrency slot becoming available. */
  private _slotWaiters: Array<() => void> = [];
  private _schedulerRunning = false;

  constructor(maxConcurrent = 2, minGapMs = 500, pauseMs = 30_000) {
    this._maxConcurrent = maxConcurrent;
    this._minGapMs = minGapMs;
    this._pauseMs = pauseMs;
  }

  /** Add a task to the queue and return a promise for its result. */
  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this._pending.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this._kickScheduler();
    });
  }

  private _kickScheduler(): void {
    if (this._schedulerRunning) return;
    this._schedulerRunning = true;
    void this._schedulerLoop();
  }

  /**
   * Single scheduler loop — the only place that reads/writes _active and
   * _lastStartMs, so there are no race conditions.
   */
  private async _schedulerLoop(): Promise<void> {
    while (this._pending.length > 0) {
      // 1. Respect queue-wide pause (after a 429 retry)
      const pauseRemaining = this._pauseUntilMs - Date.now();
      if (pauseRemaining > 0) {
        await delay(pauseRemaining);
        continue;
      }

      // 2. Respect concurrency limit
      if (this._active >= this._maxConcurrent) {
        await new Promise<void>((resolve) => {
          this._slotWaiters.push(resolve);
        });
        continue;
      }

      // 3. Respect minimum gap between starts
      const gapRemaining = this._minGapMs - (Date.now() - this._lastStartMs);
      if (gapRemaining > 0) {
        await delay(gapRemaining);
        continue;
      }

      // 4. All clear — start the next task
      const item = this._pending.shift()!;
      this._active++;
      this._lastStartMs = Date.now();
      void this._runItem(item);
      // Loop immediately: the scheduler decides whether to start another task.
    }

    this._schedulerRunning = false;
  }

  private async _runItem(item: QueueItem): Promise<void> {
    try {
      const result = await this._runWithRetry(item.fn);
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      this._active--;
      // Wake the scheduler if it is blocked on a concurrency slot
      const waiter = this._slotWaiters.shift();
      if (waiter) waiter();
      // If the scheduler exited while tasks are still pending, restart it
      if (this._pending.length > 0 && !this._schedulerRunning) {
        this._kickScheduler();
      }
    }
  }

  private async _runWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof RateLimitError) {
        // Pause the queue for _pauseMs, then retry once
        this._pauseUntilMs = Date.now() + this._pauseMs;
        await delay(this._pauseMs);
        // Second RateLimitError propagates to the caller
        return await fn();
      }
      throw err;
    }
  }

  /** Remaining queue pause in ms (0 if not paused). Exposed for tests. */
  get pauseRemainingMs(): number {
    return Math.max(0, this._pauseUntilMs - Date.now());
  }
}

/** Shared singleton used by PDF-reader AI features. */
export const aiRequestQueue = new AiRequestQueue();
