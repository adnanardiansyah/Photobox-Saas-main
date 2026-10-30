// ============================================
// Gallery API - Fetch Photos by Gallery Code
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { apiError } from '@/lib/api-security'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    rateLimit(request, 'gallery-lookup', 30)
    const code = request.nextUrl.searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Gallery code is required' },
        { status: 400 }
      )
    }

    // Find session by gallery code
    const session = await prisma.sessionPhoto.findUnique({
      where: { galleryCode: code },
      include: {
        outlet: true,
        frame: true,
      },
    })

    if (!session || session.status !== 'COMPLETED' || session.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Check if gallery has expired
    if (session.galleryExpiresAt && new Date() > session.galleryExpiresAt) {
      return NextResponse.json(
        { success: false, error: 'Gallery has expired' },
        { status: 410 }
      )
    }

    // Parse photos array
    const photos: string[] = Array.isArray(session.photos) ? session.photos as string[] : []

    return NextResponse.json({
      success: true,
      data: {
        code: session.galleryCode,
        photos,
        gifUrl: session.gifUrl,
        newspaperUrl: session.newspaperUrl,
        outlet: {
          name: session.outlet.name,
          location: session.outlet.address,
        },
        createdAt: session.createdAt,
        expiresAt: session.galleryExpiresAt,
      },
    })
  } catch (error) {
    return apiError(error)
  }
}
