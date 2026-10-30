// ============================================
// Download API - Download Gallery Photos as ZIP
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'
import { validPhotoUrl, ApiError, apiError } from '@/lib/api-security'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    rateLimit(request, 'gallery-download', 15)
    const code = request.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Gallery code is required' },
        { status: 400 }
      )
    }
    return await handleDownload(code)
  } catch (error) {
    return apiError(error)
  }
}

async function handleDownload(code: string) {
  try {
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Gallery code is required' },
        { status: 400 }
      )
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Gallery code is required' },
        { status: 400 }
      )
    }

    // Find session by gallery code
    const session = await prisma.sessionPhoto.findUnique({
      where: { galleryCode: code },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Gallery not found' },
        { status: 404 }
      )
    }

    if (session.status !== 'COMPLETED' || session.paymentStatus !== 'PAID') throw new ApiError(404, 'Gallery not found')
    // Check if gallery has expired
    if (session.galleryExpiresAt && new Date() > session.galleryExpiresAt) {
      return NextResponse.json(
        { success: false, error: 'Gallery has expired' },
        { status: 410 }
      )
    }

    // Parse photos array
    const photos: string[] = Array.isArray(session.photos) ? session.photos as string[] : []

    if (photos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No photos to download' },
        { status: 400 }
      )
    }

    // Create ZIP file
    const zip = new JSZip()

    // Download each photo and add to ZIP
    for (let i = 0; i < photos.length; i++) {
      try {
        const photoUrl = photos[i]

        let buffer: Buffer | ArrayBuffer

        if (photoUrl.startsWith('http')) {
          // External URL - fetch from web
          if (!validPhotoUrl(photoUrl)) throw new Error('Photo storage URL is not allowed')
          const response = await fetch(photoUrl, { redirect: 'error', signal: AbortSignal.timeout(15000) })
          if (Number(response.headers.get('content-length')) > 10 * 1024 * 1024) throw new Error('Photo too large')
          if (!response.ok) {
            console.warn(`Failed to fetch photo ${i + 1}: ${photoUrl}`)
            continue
          }
          buffer = await response.arrayBuffer()
        } else {
          // Local file - read from filesystem
          const root = path.resolve(process.cwd(), 'public')
          const filePath = path.resolve(root, photoUrl.replace(/^\//, ''))
          if (!filePath.startsWith(root + path.sep) || !/^\/?(photos|templates)\//.test(photoUrl) || !/\.(jpg|jpeg|png|webp)$/i.test(photoUrl)) throw new Error('Invalid local photo path')

          if (!fs.existsSync(filePath)) {
            console.warn(`Photo file not found: ${filePath}`)
            continue
          }

          buffer = fs.readFileSync(filePath)
        }

        const filename = `photo-${i + 1}.jpg`
        zip.file(filename, buffer)
      } catch (error) {
        console.warn(`Error downloading photo ${i + 1}:`, error)
        continue
      }
    }

    // Generate ZIP buffer
    if (Object.keys(zip.files).length === 0) throw new ApiError(502, 'Foto tidak dapat diunduh')
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Return ZIP file
    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="gallery-${code}.zip"`,
      },
    })

  } catch (error) {
    return apiError(error)
  }
}