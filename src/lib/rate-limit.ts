import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };
type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

const localBuckets = new Map<string, Bucket>();
const sharedLimiters = new Map<string, Ratelimit>();

function getClientAddress(request: Request) {
  // Vercel supplies x-real-ip at the edge. Avoid trusting arbitrary forwarded
  // values when the trusted proxy header is absent.
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function getSharedLimiter(scope: string, limit: number, windowMs: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const key = `${scope}:${limit}:${windowMs}`;
  let limiter = sharedLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
      prefix: `martivexa:ratelimit:${scope}`,
      analytics: false,
    });
    sharedLimiters.set(key, limiter);
  }
  return limiter;
}

/**
 * Distributed rate limiting for Vercel instances when Upstash REST credentials
 * are configured. Keeps a process-local fallback for development and for
 * deployments not yet configured with Upstash; production must set both
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for shared enforcement.
 */
export async function rateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const address = getClientAddress(request);
  const shared = getSharedLimiter(scope, limit, windowMs);

  if (shared) {
    try {
      const result = await shared.limit(address);
      return {
        allowed: result.success,
        remaining: result.remaining,
        retryAfterSeconds: result.success
          ? 0
          : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      };
    } catch (error) {
      // Fail closed when shared limiting is configured but unavailable. This
      // prevents a Redis outage from silently disabling production protection.
      console.error("[rate-limit] Shared limiter unavailable", error);
      return { allowed: false, remaining: 0, retryAfterSeconds: 30 };
    }
  }

  const key = scope + ":" + address;
  const now = Date.now();
  const current = localBuckets.get(key);
  if (!current || current.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + windowMs });
    if (localBuckets.size > 5000) {
      for (const [bucketKey, bucket] of localBuckets) {
        if (bucket.resetAt <= now) localBuckets.delete(bucketKey);
      }
    }
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: 0,
  };
}
