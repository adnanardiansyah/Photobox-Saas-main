import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createNewPhotoSession } from '@/lib/gallery-code-generator'
import { requireBooth, apiError, ApiError } from '@/lib/api-security'
export async function POST(request: NextRequest) {
  try {
    const outlet = await requireBooth(request)
    rateLimit(request, `start:${outlet.id}`, 10)
    if (!outlet.config) throw new ApiError(409, 'Konfigurasi outlet belum tersedia')
    const session = await createNewPhotoSession(outlet.id, undefined, outlet.config.priceDefault)
    return NextResponse.json({ success: true, data: { sessionId: session.id, sessionCode: session.sessionCode, galleryCode: session.galleryCode, expiresAt: session.galleryExpiresAt } })
  } catch (error) { return apiError(error) }
}
