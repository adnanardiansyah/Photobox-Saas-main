import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthCookieName, verifyAuthToken, verifyBoothToken } from '@/lib/auth'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message }, { status: error.status })
  const code = (error as { code?: string } | null)?.code
  if (code === 'P2034' || code === 'P2002') return NextResponse.json({ success: false, error: 'Data sudah digunakan atau sedang diproses. Muat ulang dan coba lagi.' }, { status: 409 })
  if (code === 'P2025') return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 })
  console.error('[API]', error)
  return NextResponse.json({ success: false, error: 'Terjadi kesalahan pada server' }, { status: 500 })
}

export async function requireAdmin(request: NextRequest, write = false) {
  const token = request.cookies.get(getAuthCookieName())?.value
  if (!token) throw new ApiError(401, 'Silakan login')
  let userId: string
  try { userId = verifyAuthToken(token).userId } catch { throw new ApiError(401, 'Sesi tidak valid') }
  if (!userId) throw new ApiError(401, 'Sesi tidak valid')
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { tenant: true } })
  if (!user?.isActive || !user.tenant.isActive) throw new ApiError(401, 'Akun tidak aktif')
  if (!['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.role)) throw new ApiError(403, 'Akses admin diperlukan')
  if (write && !['SUPER_ADMIN', 'OWNER'].includes(user.role)) throw new ApiError(403, 'Hanya owner yang dapat mengubah data')
  if (request.method !== 'GET') checkOrigin(request)
  return user
}

export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  const expected = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin
  if (origin && origin !== expected) throw new ApiError(403, 'Origin tidak diizinkan')
}

export async function requireBooth(request: NextRequest, permission = 'capture') {
  const token = request.cookies.get('snapnext_booth')?.value
  if (!token) throw new ApiError(401, 'Login perangkat diperlukan')
  let id: string
  try { id = verifyBoothToken(token) } catch { throw new ApiError(401, 'Sesi perangkat tidak valid') }
  const key = await prisma.apiKey.findUnique({ where: { id } })
  if (!key?.isActive || (process.env.NODE_ENV === 'production' && key.key.startsWith('demo-key-')) || (key.expiresAt && key.expiresAt <= new Date())) throw new ApiError(401, 'Kunci perangkat tidak aktif')
  let permissions = key.permissions
  if (typeof permissions === 'string') { try { permissions = JSON.parse(permissions) } catch { permissions = [] } }
  if (!Array.isArray(permissions) || !permissions.includes(permission)) throw new ApiError(403, 'Izin perangkat tidak mencukupi')
  const outlet = await prisma.outlet.findUnique({ where: { id: key.outletId }, include: { config: true, tenant: true } })
  if (!outlet?.isActive || !outlet.tenant.isActive) throw new ApiError(403, 'Outlet tidak aktif')
  if (request.method !== 'GET') checkOrigin(request)
  return outlet
}

export function validPhotoUrl(value: unknown, prefix?: string): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    const storage = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    return url.protocol === 'https:' && url.origin === storage.origin && url.pathname.startsWith(`/storage/v1/object/public/photos/${prefix || ''}`)
  } catch { return false }
}

export function paymentEnabled(value: unknown, method: string): boolean {
  let methods = value
  if (typeof methods === 'string') { try { methods = JSON.parse(methods) } catch { return false } }
  return !!methods && typeof methods === 'object' && (methods as Record<string, unknown>)[method] === true
}
