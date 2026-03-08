/**
 * In-memory rate limiter for API routes.
 * Limits requests per IP to protect against abuse (no auth required).
 *
 * Uses a fixed window: max N requests per windowMs per identifier.
 * Store is in-memory; in serverless, limits are per instance (still reduces abuse per container).
 */

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Checks if the request should be rate limited. If not, increments the counter.
 * Call this at the start of an API route handler.
 *
 * @returns null if allowed, or a Response (429) to return immediately if limited
 */
export function checkRateLimit(
  request: Request,
  options: { maxRequests?: number; windowMs?: number } = {}
): Response | null {
  const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const key = getClientIdentifier(request);
  const now = Date.now();

  let window = store.get(key);
  if (!window || now >= window.resetAt) {
    window = { count: 0, resetAt: now + windowMs };
    store.set(key, window);
  }

  if (window.count >= maxRequests) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((window.resetAt - now) / 1000)),
        },
      }
    );
  }

  window.count += 1;
  return null;
}
