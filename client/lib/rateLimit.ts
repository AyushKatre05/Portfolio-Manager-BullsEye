interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  limit: number 
  window: number 
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param options - Rate limit configuration
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {limit: 60, window: 60000}
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)
  if (!entry || now > entry.resetTime) {
    const resetTime = now + options.window
    rateLimitStore.set(identifier, {count: 1, resetTime})
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: resetTime,
    }
  }

  if (entry.count < options.limit) {
    entry.count++
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - entry.count,
      reset: entry.resetTime,
    }
  }

  return {
    success: false,
    limit: options.limit,
    remaining: 0,
    reset: entry.resetTime,
  }
}


export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : "unknown"
  return `ip:${ip}`
}
