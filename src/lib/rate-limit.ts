type RateLimitResult = {
  ok: boolean;
  retryAfter?: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const getStore = (): Map<string, Bucket> => {
  const globalForRateLimit = globalThis as unknown as { __rateLimitStore?: Map<string, Bucket> };
  if (!globalForRateLimit.__rateLimitStore) {
    globalForRateLimit.__rateLimitStore = new Map();
  }
  return globalForRateLimit.__rateLimitStore;
};

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const store = getStore();
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.max(0, bucket.resetAt - now) };
  }

  bucket.count += 1;
  store.set(key, bucket);
  return { ok: true };
}
