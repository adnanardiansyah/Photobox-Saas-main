import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createHash } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { signBoothToken } from '@/lib/auth'
import { ApiError, apiError, checkOrigin } from '@/lib/api-security'
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request)
    rateLimit(request, 'booth-login', 10, 15 * 60000)
    const { machineId, apiKey } = await request.json()
    if (typeof machineId !== 'string' || typeof apiKey !== 'string' || apiKey.length > 256) throw new ApiError(400, 'Machine ID dan API key wajib diisi')
    const hashed = createHash('sha256').update(apiKey).digest('hex')
    const key = await prisma.apiKey.findUnique({ where: { key: hashed } }) || (process.env.NODE_ENV !== 'production' ? await prisma.apiKey.findUnique({ where: { key: apiKey } }) : null)
    const outlet = key && await prisma.outlet.findFirst({ where: { id: key.outletId, machineId, isActive: true, tenant: { isActive: true } } })
    if (!key?.isActive || !outlet || key.expiresAt && key.expiresAt <= new Date() || process.env.NODE_ENV === 'production' && apiKey.startsWith('demo-key-')) throw new ApiError(401, 'Kredensial perangkat tidak valid')
    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsed: new Date() } })
    const response = NextResponse.json({ success: true })
    response.cookies.set('snapnext_booth', signBoothToken(key.id), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 12 * 60 * 60 })
    return response
  } catch (error) { return apiError(error) }
}
