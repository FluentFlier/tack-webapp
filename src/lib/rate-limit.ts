/**
 * In-memory rate limiter backed by a plain Map.
 *
 * IMPORTANT: This Map is per-process instance and resets on every deploy or
 * cold start. In a multi-instance or serverless production environment the
 * limit is not enforced across instances. Replace with a Redis-backed (or
 * other durable) store for correct multi-instance behaviour.
 */
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const MAX_ENTRIES = 10_000;
const SWEEP_INTERVAL_MS = 5 * 60_000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of rateLimit) {
    if (entry.resetTime <= now) rateLimit.delete(key);
  }
  if (rateLimit.size > MAX_ENTRIES) {
    const toDrop = rateLimit.size - MAX_ENTRIES;
    let i = 0;
    for (const key of rateLimit.keys()) {
      if (i++ >= toDrop) break;
      rateLimit.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  sweep(now);
  const entry = rateLimit.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}
