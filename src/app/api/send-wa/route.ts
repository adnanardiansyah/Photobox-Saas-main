import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendGalleryNotification } from '@/lib/whatsapp-service'
import { requireBooth, apiError, ApiError } from '@/lib/api-security'
import { rateLimit } from '@/lib/rate-limit'
export async function POST(request: NextRequest) {
  try {
    const outlet = await requireBooth(request)
    rateLimit(request, `wa:${outlet.id}`, 5)
    const { phoneNumber, galleryCode } = await request.json()
    if (typeof phoneNumber !== 'string' || !/^\+?[0-9]{9,15}$/.test(phoneNumber) || typeof galleryCode !== 'string' || !galleryCode) throw new ApiError(400, 'Nomor telepon dan kode galeri tidak valid')
    const session = await prisma.sessionPhoto.findFirst({ where: { galleryCode, outletId: outlet.id, status: 'COMPLETED', paymentStatus: 'PAID' } })
    if (!session) throw new ApiError(404, 'Galeri tidak ditemukan')
    if (session.galleryExpiresAt && session.galleryExpiresAt <= new Date()) throw new ApiError(410, 'Galeri kedaluwarsa')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) throw new ApiError(503, 'URL aplikasi belum dikonfigurasi')
    const result = await sendGalleryNotification({ phoneNumber, outletName: outlet.name, galleryCode: session.galleryCode, galleryUrl: `${appUrl.replace(/\/$/, '')}/gallery?code=${encodeURIComponent(session.galleryCode)}`, photoCount: Array.isArray(session.photos) ? session.photos.length : 0 })
    if (!result.success) throw new ApiError(502, 'Notifikasi WhatsApp gagal dikirim')
    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) { return apiError(error) }
}
