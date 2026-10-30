import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBooth, apiError, ApiError, validPhotoUrl } from '@/lib/api-security'
export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const outlet = await requireBooth(request, 'upload')
    const session = await prisma.sessionPhoto.findFirst({ where: { id: params.sessionId, outletId: outlet.id } })
    if (!session) throw new ApiError(404, 'Sesi tidak ditemukan')
    if (session.paymentStatus !== 'PAID') throw new ApiError(409, 'Pembayaran belum terkonfirmasi')
    if (session.galleryExpiresAt && session.galleryExpiresAt <= new Date()) throw new ApiError(410, 'Sesi kedaluwarsa')
    if (session.status === 'COMPLETED') return NextResponse.json({ success: true, data: { sessionId: session.id, galleryCode: session.galleryCode, photos: session.photos } })
    const { photos, frameId } = await request.json()
    if (!Array.isArray(photos) || !photos.length || photos.length > 20 || !photos.every(url => validPhotoUrl(url, `sessions/${session.galleryCode}/`))) throw new ApiError(400, 'Foto harus berasal dari sesi ini')
    if (frameId && !await prisma.frameTemplate.findFirst({ where: { id: frameId, tenantId: outlet.tenantId, isActive: true } })) throw new ApiError(400, 'Template tidak valid')
    const updated = await prisma.sessionPhoto.update({ where: { id: session.id }, data: { photos, frameId: frameId || undefined, status: 'COMPLETED', completedAt: new Date() } })
    return NextResponse.json({ success: true, data: { sessionId: updated.id, galleryCode: updated.galleryCode, photos: updated.photos } })
  } catch (error) { return apiError(error) }
}

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const outlet = await requireBooth(request)
    const session = await prisma.sessionPhoto.findFirst({ where: { id: params.sessionId, outletId: outlet.id } })
    if (!session) throw new ApiError(404, 'Sesi tidak ditemukan')
    if (session.galleryExpiresAt && session.galleryExpiresAt <= new Date()) throw new ApiError(410, 'Sesi kedaluwarsa')
    return NextResponse.json({ success: true, paymentStatus: session.paymentStatus, status: session.status, galleryCode: session.galleryCode, totalPrice: session.totalPrice })
  } catch (error) { return apiError(error) }
}
