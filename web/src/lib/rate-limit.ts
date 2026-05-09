interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

const buckets = new Map<string, Bucket>();
let lastGc = 0;

function gc(now: number): void {
  if (now - lastGc < 60_000) return;
  lastGc = now;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

export function checkRate(
  key: string,
  options: { windowMs: number; max: number },
  now: number = Date.now(),
): RateLimitResult {
  gc(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    const fresh: Bucket = { count: 1, resetAt: now + options.windowMs };
    buckets.set(key, fresh);
    return {
      ok: true,
      remaining: options.max - 1,
      resetAt: fresh.resetAt,
      retryAfterSeconds: 0,
    };
  }
  existing.count += 1;
  const remaining = Math.max(0, options.max - existing.count);
  const ok = existing.count <= options.max;
  return {
    ok,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSeconds: ok ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

export function rateLimitHeaders(r: RateLimitResult, max: number): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.floor(r.resetAt / 1000)),
  };
  if (!r.ok) headers["Retry-After"] = String(r.retryAfterSeconds);
  return headers;
}

export function _resetForTests(): void {
  buckets.clear();
  lastGc = 0;
}
