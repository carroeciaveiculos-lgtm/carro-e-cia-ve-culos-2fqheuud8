const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30

const buckets = new Map<string, { count: number; resetAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of buckets) {
    if (entry.resetAt < now) buckets.delete(key)
  }
}, 120_000)

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = buckets.get(ip)
  if (!entry || entry.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
}
