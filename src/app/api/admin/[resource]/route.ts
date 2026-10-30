import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth'
import { ApiError, apiError, requireAdmin } from '@/lib/api-security'

export const dynamic = 'force-dynamic'
const resources: Record<string, { model: string; fields: string[]; scope: (tenantId: string) => any }> = {
  tenants: { model: 'tenant', fields: ['name', 'phone', 'logoUrl', 'primaryColor'], scope: id => ({ id }) },
  outlets: { model: 'outlet', fields: ['name', 'address', 'phone', 'latitude', 'longitude', 'operatingHours', 'isActive', 'machineId'], scope: tenantId => ({ tenantId }) },
  users: { model: 'user', fields: ['email', 'name', 'role', 'isActive', 'outletId'], scope: tenantId => ({ tenantId }) },
  frameTemplates: { model: 'frameTemplate', fields: ['name', 'type', 'imageUrl', 'thumbnailUrl', 'width', 'height', 'price', 'isActive'], scope: tenantId => ({ tenantId }) },
  vouchers: { model: 'voucher', fields: ['code', 'type', 'value', 'minOrder', 'maxUses', 'usageType', 'validFrom', 'validUntil', 'isActive'], scope: tenantId => ({ tenantId }) },
  testimonials: { model: 'testimonial', fields: ['outletId', 'customerName', 'customerPhoto', 'message', 'rating', 'isApproved'], scope: tenantId => ({ tenantId }) },
  brandAssets: { model: 'brandAsset', fields: ['type', 'url', 'isActive'], scope: tenantId => ({ tenantId }) },
  outletConfigs: { model: 'outletConfig', fields: ['outletId', 'paymentMethods', 'priceDefault', 'printEnabled', 'galleryEnabled', 'gifEnabled', 'newspaperEnabled'], scope: tenantId => ({ outlet: { tenantId } }) },
  sessionPhotos: { model: 'sessionPhoto', fields: [], scope: tenantId => ({ outlet: { tenantId } }) },
  transactions: { model: 'transaction', fields: [], scope: tenantId => ({ outlet: { tenantId } }) },
  boothHeartbeats: { model: 'boothHeartbeat', fields: [], scope: tenantId => ({ outlet: { tenantId } }) },
  galleryQueues: { model: 'galleryQueue', fields: [], scope: tenantId => ({ session: { outlet: { tenantId } } }) },
}
function sanitize(record: any): any {
  if (Array.isArray(record)) return record.map(sanitize)
  if (!record) return record
  const { passwordHash, ...safe } = record
  return safe
}
async function handle(request: NextRequest, resource: string) {
  try {
    const write = request.method !== 'GET'
    const user = await requireAdmin(request, write)
    const config = resources[resource]
    if (!config) throw new ApiError(404, 'Resource tidak tersedia')
    const model = (prisma as any)[config.model]
    const id = request.nextUrl.searchParams.get('id')
    const scope = config.scope(user.tenantId)
    if (request.method === 'GET') {
      const filters: Record<string, string> = {}
      for (const field of ['outletId', 'sessionId', 'machineId', 'galleryCode', 'code', 'email', 'sessionCode', 'transactionRef']) {
        const value = request.nextUrl.searchParams.get(field)
        if (value && (config.fields.includes(field) || ['sessionPhotos', 'transactions'].includes(resource))) filters[field] = value
      }
      const where = { AND: [scope, filters, ...(id ? [{ id }] : resource === 'outlets' ? [{ isActive: true }] : [])] }
      const take = Math.min(500, Math.max(1, Number(request.nextUrl.searchParams.get('take')) || 100))
      const include = resource === 'outlets' ? { config: true } : undefined
      const data = id ? await model.findFirst({ where, include }) : await model.findMany({ where, include, orderBy: { createdAt: 'desc' }, take })
      if (id && !data) throw new ApiError(404, 'Data tidak ditemukan')
      return NextResponse.json({ success: true, data: sanitize(data) })
    }
    if (!config.fields.length || resource === 'tenants' && request.method !== 'PUT') throw new ApiError(403, 'Operasi tidak diizinkan')
    if (request.method !== 'POST') {
      if (!id) throw new ApiError(400, 'ID wajib diisi')
      if (!await model.findFirst({ where: { AND: [scope, { id }] } })) throw new ApiError(404, 'Data tidak ditemukan')
    }
    if (request.method === 'DELETE') {
      if (resource === 'users' && id === user.id) throw new ApiError(400, 'Tidak dapat menghapus akun sendiri')
      if (['outlets', 'frameTemplates'].includes(resource)) await model.update({ where: { id }, data: { isActive: false } })
      else await model.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Data tidak valid')
    const data: any = {}
    for (const field of config.fields) if (body[field] !== undefined) data[field] = body[field]
    if (resource === 'outletConfigs' && request.method !== 'POST') delete data.outletId
    if (data.outletId === '') data.outletId = null
    if (data.outletId && !await prisma.outlet.findFirst({ where: { id: data.outletId, tenantId: user.tenantId } })) throw new ApiError(400, 'Outlet tidak valid')
    if (resource === 'outlets') {
      for (const field of ['latitude', 'longitude']) if (data[field] !== undefined && (typeof data[field] !== 'number' || !Number.isFinite(data[field]) || Math.abs(data[field]) > (field === 'latitude' ? 90 : 180))) throw new ApiError(400, 'Koordinat tidak valid')
      if (request.method === 'POST' && !data.machineId) throw new ApiError(400, 'Machine ID wajib diisi')
      if (body.config !== undefined) {
        const parsed = z.object({ priceDefault: z.number().int().nonnegative(), printEnabled: z.boolean(), paymentMethods: z.object({ qris: z.boolean(), voucher: z.boolean() }).strict() }).strict().safeParse(body.config)
        if (!parsed.success) throw new ApiError(400, 'Konfigurasi outlet tidak valid')
        data.config = request.method === 'POST' ? { create: parsed.data } : { upsert: { create: parsed.data, update: parsed.data } }
      } else if (request.method === 'POST') data.config = { create: { priceDefault: 25000, printEnabled: false } }
    }
    if (resource === 'users') {
      if (data.role && !['OWNER', 'MANAGER', 'STAFF'].includes(data.role)) throw new ApiError(400, 'Role tidak valid')
      if (id === user.id && (data.isActive === false || data.role && data.role !== user.role)) throw new ApiError(400, 'Tidak dapat menonaktifkan atau mengubah role akun sendiri')
      if (body.password) {
        if (typeof body.password !== 'string' || body.password.length < 8) throw new ApiError(400, 'Password minimal 8 karakter')
        data.passwordHash = await hashPassword(body.password)
      }
      if (request.method === 'POST' && !data.passwordHash) throw new ApiError(400, 'Password wajib diisi')
    }
    for (const field of ['price', 'priceDefault', 'minOrder', 'value']) if (data[field] !== undefined && (typeof data[field] !== 'number' || !Number.isFinite(data[field]) || data[field] < 0)) throw new ApiError(400, `${field} tidak valid`)
    if (resource === 'vouchers') {
      if (data.code) data.code = String(data.code).trim().toUpperCase()
      if (data.maxUses !== undefined && data.maxUses !== null && (!Number.isInteger(data.maxUses) || data.maxUses < 1)) throw new ApiError(400, 'Batas pemakaian tidak valid')
      if (data.type === 'PERCENTAGE' && data.value > 100) throw new ApiError(400, 'Diskon maksimal 100%')
    }
    if (request.method === 'POST') {
      if (config.scope(user.tenantId).tenantId) data.tenantId = user.tenantId
      if (resource === 'frameTemplates') {
        const a4 = data.type === 'A4_NEWSPAPER'
        data.width ??= a4 ? 2480 : 1200
        data.height ??= a4 ? 3508 : 1800
      }
    }
    const record = request.method === 'POST' ? await model.create({ data }) : await model.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: sanitize(record) }, { status: request.method === 'POST' ? 201 : 200 })
  } catch (error) { return apiError(error) }
}
export const GET = (req: NextRequest, { params }: { params: { resource: string } }) => handle(req, params.resource)
export const POST = GET
export const PUT = GET
export const DELETE = GET
