import { NextRequest } from 'next/server'
import { ApiError } from '@/lib/api-security'
const attempts = new Map<string, { count: number; until: number }>()
// Per-process backstop. Configure shared rate limiting at the reverse proxy for multiple instances.
export function rateLimit(request: NextRequest, bucket: string, limit = 10, windowMs = 60000) {
  const now = Date.now()
  if (attempts.size > 10000) attempts.forEach((entry, key) => { if (entry.until <= now) attempts.delete(key) })
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const key = `${bucket}:${address}`
  const entry = attempts.get(key)
  if (!entry || entry.until <= now) {
    if (!entry && attempts.size >= 10000) throw new ApiError(429, 'Terlalu banyak request. Coba lagi nanti.')
    attempts.set(key, { count: 1, until: now + windowMs }); return }
  if (entry.count >= limit) throw new ApiError(429, 'Terlalu banyak percobaan. Coba lagi nanti.')
  entry.count++
}
