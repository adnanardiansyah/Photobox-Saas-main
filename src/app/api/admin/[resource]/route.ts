import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic';

const resourceMap: Record<string, string> = {
  tenants: 'tenant',
  outlets: 'outlet',
  outletConfigs: 'outletConfig',
  users: 'user',
  frameTemplates: 'frameTemplate',
  sessionPhotos: 'sessionPhoto',
  vouchers: 'voucher',
  transactions: 'transaction',
  boothHeartbeats: 'boothHeartbeat',
  galleryQueues: 'galleryQueue',
  testimonials: 'testimonial',
  brandAssets: 'brandAsset',
  apiKeys: 'apiKey',
}

const allowedFilters = [
  'id',
  'tenantId',
  'outletId',
  'sessionId',
  'machineId',
  'galleryCode',
  'code',
  'email',
  'sessionCode',
  'transactionRef',
]

// Resources yang butuh tenantId otomatis
const tenantResources = ['users', 'outlets', 'frameTemplates', 'vouchers', 'testimonials', 'brandAssets']

function getModel(resource: string) {
  return resourceMap[resource]
}

function buildWhere(searchParams: URLSearchParams) {
  const where: Record<string, any> = {}
  for (const key of allowedFilters) {
    const value = searchParams.get(key)
    if (!value) continue

    if (key === 'id' || key.endsWith('Id')) {
      where[key] = value
      continue
    }

    if (key === 'transactionRef' || key === 'sessionCode' || key === 'galleryCode' || key === 'machineId' || key === 'code' || key === 'email') {
      where[key] = value
      continue
    }
  }
  return where
}

// Auto-inject tenantId kalau resource butuh tenant
async function injectTenantId(payload: any): Promise<any> {
  if (!payload.tenantId) {
    const tenant = await prisma.tenant.findFirst({ where: { isActive: true } })
    if (tenant) payload.tenantId = tenant.id
  }
  return payload
}

async function normalizePayload(resource: string, payload: any) {
  // Hash password untuk users
  if (resource === 'users') {
    if (payload.password) {
      payload.passwordHash = await bcrypt.hash(payload.password, 10)
      delete payload.password
    }
    delete payload.passwordConfirm

    // Auto-inject tenantId
    await injectTenantId(payload)

    // Kalau outletId kosong, hapus dari payload
    if (payload.outletId === '' || payload.outletId === null) {
      delete payload.outletId
    }
  }

  // Auto-inject tenantId untuk resource lain yang butuh
  if (tenantResources.includes(resource) && resource !== 'users') {
    await injectTenantId(payload)
  }

  // Untuk frameTemplates: isi width/height wajib dari form, pakai default per tipe
  if (resource === 'frameTemplates') {
    const dimsByType: Record<string, { width: number; height: number }> = {
      FOUR_R: { width: 1200, height: 1800 },
      A4_NEWSPAPER: { width: 2480, height: 3508 },
      CUSTOM: { width: 1200, height: 1800 },
    }
    const type = payload.type || 'FOUR_R'
    const dims = dimsByType[type] || dimsByType.CUSTOM
    payload.type = type
    payload.width = payload.width ?? dims.width
    payload.height = payload.height ?? dims.height
    payload.imageUrl = payload.imageUrl ?? ''
  }

  // Fix photos field untuk sessionPhotos
  if (resource === 'sessionPhotos' && payload.photos && !Array.isArray(payload.photos)) {
    payload.photos = typeof payload.photos === 'string' ? JSON.parse(payload.photos) : payload.photos
  }

  return payload
}

export async function GET(request: NextRequest, { params }: { params: { resource: string } }) {
  const modelName = getModel(params.resource)
  if (!modelName) {
    return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
  }

  try {
    const id = request.nextUrl.searchParams.get('id')
    const where = buildWhere(request.nextUrl.searchParams)
    const prismaClient = (prisma as any)[modelName] as any

    if (id) {
      const record = await prismaClient.findUnique({ where: { id } })
      return NextResponse.json({ success: true, data: record })
    }

    const records = await prismaClient.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 })
    return NextResponse.json({ success: true, data: records })
  } catch (error) {
    console.error('[Admin API] GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch resources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { resource: string } }) {
  const modelName = getModel(params.resource)
  if (!modelName) {
    return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const prismaClient = (prisma as any)[modelName] as any
    const payload = await normalizePayload(params.resource, body)

    const record = await prismaClient.create({ data: payload })
    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (error) {
    console.error('[Admin API] POST error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { resource: string } }) {
  const modelName = getModel(params.resource)
  if (!modelName) {
    return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
  }

  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Resource id is required' }, { status: 400 })
    }

    const body = await request.json()
    const prismaClient = (prisma as any)[modelName] as any

    // Untuk PUT, tidak perlu inject tenantId lagi
    let payload = body
    if (params.resource === 'users') {
      if (payload.password) {
        payload.passwordHash = await bcrypt.hash(payload.password, 10)
        delete payload.password
      }
      delete payload.passwordConfirm
      delete payload.tenantId // Jangan update tenantId

      if (payload.outletId === '' || payload.outletId === null) {
        payload.outletId = null
      }
    }

    if (params.resource === 'sessionPhotos' && payload.photos && !Array.isArray(payload.photos)) {
      payload.photos = typeof payload.photos === 'string' ? JSON.parse(payload.photos) : payload.photos
    }

    const record = await prismaClient.update({ where: { id }, data: payload })
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('[Admin API] PUT error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { resource: string } }) {
  const modelName = getModel(params.resource)
  if (!modelName) {
    return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
  }

  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Resource id is required' }, { status: 400 })
    }

    const prismaClient = (prisma as any)[modelName] as any

    // Frame template yang sudah dipakai session tidak boleh dihapus keras ->
    // activekan false (soft delete) supaya tidak error FK
    if (params.resource === 'frameTemplates') {
      await prismaClient.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ success: true })
    }

    await prismaClient.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin API] DELETE error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}