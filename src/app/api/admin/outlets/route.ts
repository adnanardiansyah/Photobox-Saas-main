// ============================================
// Admin Outlets API - GET / POST / PUT / DELETE
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

async function getTenantId(): Promise<string | null> {
  const tenant = await prisma.tenant.findFirst({ where: { isActive: true } })
  return tenant?.id ?? null
}

function sanitizePayload(payload: any) {
  const data = { ...payload }
  delete data.id
  delete data.createdAt
  delete data.updatedAt
  delete data.tenantId
  return data
}

function prismaError(response: any) {
  if (response instanceof Prisma.PrismaClientKnownRequestError) {
    if (response.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Machine ID sudah dipakai outlet lain' },
        { status: 400 }
      )
    }
    if (response.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Outlet tidak ditemukan' },
        { status: 404 }
      )
    }
  }
  return NextResponse.json(
    { success: false, error: String(response instanceof Error ? response.message : response) },
    { status: 500 }
  )
}

// ============================================
// GET - List outlets (active only)
// ============================================

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    if (id) {
      const outlet = await prisma.outlet.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          machineId: true,
          address: true,
          phone: true,
          latitude: true,
          longitude: true,
          operatingHours: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      if (!outlet) {
        return NextResponse.json({ success: false, error: 'Outlet tidak ditemukan' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: outlet })
    }

    const outlets = await prisma.outlet.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        machineId: true,
        address: true,
        phone: true,
        latitude: true,
        longitude: true,
        operatingHours: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, data: outlets })
  } catch (error) {
    console.error('[Admin Outlets API] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch outlets' },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create outlet
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tenantId = (body.tenantId as string | undefined) || (await getTenantId())
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada tenant aktif. Buat tenant dulu.' },
        { status: 400 }
      )
    }

    const data = sanitizePayload(body)

    const outlet = await prisma.outlet.create({
      data: {
        ...data,
        tenantId,
        name: String(data.name || ''),
        machineId: String(data.machineId || `BOOTH-${Date.now().toString(36).toUpperCase()}`),
        isActive: data.isActive ?? true,
      },
    })
    return NextResponse.json({ success: true, data: outlet }, { status: 201 })
  } catch (error) {
    console.error('[Admin Outlets API] POST error:', error)
    return prismaError(error)
  }
}

// ============================================
// PUT - Update outlet
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Outlet id wajib diisi' }, { status: 400 })
    }

    const body = await request.json()
    const data = sanitizePayload(body)

    const outlet = await prisma.outlet.update({
      where: { id },
      data: {
        ...data,
        name: data.name !== undefined ? String(data.name) : undefined,
        machineId: data.machineId !== undefined ? String(data.machineId) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    })
    return NextResponse.json({ success: true, data: outlet })
  } catch (error) {
    console.error('[Admin Outlets API] PUT error:', error)
    return prismaError(error)
  }
}

// ============================================
// DELETE - Soft delete (isActive = false)
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Outlet id wajib diisi' }, { status: 400 })
    }

    const existing = await prisma.outlet.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Outlet tidak ditemukan' }, { status: 404 })
    }

    // Soft delete supaya data session foto & transaksi tetap tersimpan
    await prisma.outlet.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Outlets API] DELETE error:', error)
    return prismaError(error)
  }
}