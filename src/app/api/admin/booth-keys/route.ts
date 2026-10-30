import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin, ApiError, apiError } from '@/lib/api-security'
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request, true)
    const { outletId } = await request.json()
    if (typeof outletId !== 'string' || !outletId) throw new ApiError(400, 'Outlet wajib diisi')
    const outlet = await prisma.outlet.findFirst({ where: { id: outletId, tenantId: user.tenantId, isActive: true } })
    if (!outlet) throw new ApiError(404, 'Outlet tidak ditemukan')
    const apiKey = randomBytes(32).toString('hex')
    await prisma.apiKey.create({ data: { outletId, name: outlet.name, key: createHash('sha256').update(apiKey).digest('hex'), permissions: ['capture', 'upload', 'print'] } })
    return NextResponse.json({ success: true, apiKey, machineId: outlet.machineId }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return apiError(error) }
}
