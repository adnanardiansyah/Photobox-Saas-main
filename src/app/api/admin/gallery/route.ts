// ============================================
// Admin API - Add Gallery Code Manually
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { generateUniqueGalleryCode } from '@/lib/gallery-code-generator'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin, apiError, ApiError, validPhotoUrl } from '@/lib/api-security'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request, true)
    const body = await request.json()
    const galleryCode = body.galleryCode ? String(body.galleryCode).trim().toUpperCase() : await generateUniqueGalleryCode()
    const { photos = [], outletId, frameId, totalPrice = 25000 } = body

    if (!galleryCode || !photos || !Array.isArray(photos)) {
      return NextResponse.json(
        { success: false, error: 'Gallery code and photos array are required' },
        { status: 400 }
      )
    }

    if (!/^[A-Z0-9-]{6,64}$/.test(galleryCode) || photos.length > 20 || !photos.every((url: unknown) => validPhotoUrl(url) || typeof url === 'string' && /^\/(photos|templates)\/[a-zA-Z0-9 _./-]+\.(jpg|jpeg|png|webp)$/i.test(url) && !url.includes('..'))) throw new ApiError(400, 'Kode atau URL foto tidak valid')
    // Cek apakah gallery code sudah ada
    const existingSession = await prisma.sessionPhoto.findUnique({
      where: { galleryCode },
    })

    if (existingSession) {
      return NextResponse.json(
        { success: false, error: 'Gallery code already exists' },
        { status: 409 }
      )
    }

    // Ambil outlet default jika tidak dispecify
    let targetOutletId = outletId
    if (!targetOutletId) {
      const defaultOutlet = await prisma.outlet.findFirst({
        where: { tenantId: user.tenantId, isActive: true },
      })
      targetOutletId = defaultOutlet?.id
    }

    if (!targetOutletId) {
      return NextResponse.json(
        { success: false, error: 'No outlet found' },
        { status: 404 }
      )
    }

    if (!await prisma.outlet.findFirst({ where: { id: targetOutletId, tenantId: user.tenantId } })) throw new ApiError(404, 'Outlet tidak ditemukan')
    if (typeof totalPrice !== 'number' || !Number.isFinite(totalPrice) || totalPrice < 0) throw new ApiError(400, 'Harga tidak valid')
    // Ambil frame template default jika frameId tidak valid / tidak dispecify
    let targetFrameId: string | null = null
    if (frameId) {
      const frameExists = await prisma.frameTemplate.findFirst({ where: { id: frameId, tenantId: user.tenantId } })
      if (frameExists) targetFrameId = frameId
    }
    if (!targetFrameId) {
      const defaultFrame = await prisma.frameTemplate.findFirst({
        where: { isActive: true, tenantId: user.tenantId },
        orderBy: { createdAt: 'desc' },
      })
      targetFrameId = defaultFrame?.id ?? null
    }

    // Buat session baru
    const newSession = await prisma.sessionPhoto.create({
      data: {
        outletId: targetOutletId,
        frameId: targetFrameId,
        sessionCode: `SESSION-${galleryCode}-001`,
        status: photos.length ? 'COMPLETED' : 'CAPTURING',
        photos, // kolom Json -> simpan array langsung, bukan JSON.stringify
        totalPrice,
        completedAt: photos.length ? new Date() : null,
        transaction: photos.length ? { create: { outletId: targetOutletId, amount: totalPrice, paymentMethod: 'CASH', status: 'SUCCESS', paidAt: new Date() } } : undefined,
        paymentMethod: 'CASH',
        paymentStatus: photos.length ? 'PAID' : 'PENDING',
        galleryCode,
        galleryExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newSession.id,
        galleryCode: newSession.galleryCode,
        photos: Array.isArray(newSession.photos) ? newSession.photos : [],
        createdAt: newSession.createdAt,
      },
    })
  } catch (error) {
    return apiError(error)
  }
}

// GET - List all galleries (for admin)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    const sessions = await prisma.sessionPhoto.findMany({
      where: { outlet: { tenantId: user.tenantId } },
      include: {
        outlet: true,
        frame: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50
    })

    const galleries = sessions.map((session: any) => ({
      id: session.id,
      galleryCode: session.galleryCode,
      photos: Array.isArray(session.photos) ? session.photos : [],
      status: session.status,
      outlet: session.outlet.name,
      frame: session.frame?.name || 'No Frame',
      totalPrice: session.totalPrice,
      createdAt: session.createdAt,
      expiresAt: session.galleryExpiresAt,
    }))

    return NextResponse.json({
      success: true,
      data: galleries,
    })
  } catch (error) {
    return apiError(error)
  }
}
