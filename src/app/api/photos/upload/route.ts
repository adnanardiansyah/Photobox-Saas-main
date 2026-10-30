import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin, requireBooth, apiError, ApiError } from '@/lib/api-security'
export const dynamic = 'force-dynamic'
function storage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new ApiError(503, 'Storage belum dikonfigurasi')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}
async function upload(request: NextRequest, multiple: boolean) {
  try {
    if (request.cookies.has('snapnext_token')) await requireAdmin(request, true)
    else await requireBooth(request, 'upload')
    if (Number(request.headers.get('content-length')) > 50 * 1024 * 1024)
      throw new ApiError(413, 'Ukuran upload terlalu besar')
    const form = await request.formData()
    const folder = form.get('assetFolder')
    let prefix: string
    let sessionId: string | undefined
    let galleryCode: string | undefined
    if (folder) {
      const admin = await requireAdmin(request, true)
      if (!['brand-logo', 'brand-banner', 'templates', 'gallery'].includes(String(folder)))
        throw new ApiError(400, 'Folder tidak valid')
      prefix = `assets/${admin.tenantId}/${folder}/`
    } else {
      const outlet = await requireBooth(request, 'upload')
      sessionId = String(form.get('sessionId') || '')
      if (!sessionId) throw new ApiError(400, 'ID sesi wajib diisi')
      const session = await prisma.sessionPhoto.findFirst({
        where: { id: sessionId, outletId: outlet.id },
      })
      if (!session) throw new ApiError(404, 'Sesi tidak ditemukan')
      if (session.paymentStatus !== 'PAID')
        throw new ApiError(409, 'Pembayaran belum terkonfirmasi')
      if (session.galleryExpiresAt && session.galleryExpiresAt <= new Date())
        throw new ApiError(410, 'Sesi kedaluwarsa')
      if (session.status === 'COMPLETED') throw new ApiError(409, 'Sesi sudah selesai')
      galleryCode = session.galleryCode
      prefix = `sessions/${galleryCode}/`
    }
    const files = form.getAll(multiple ? 'photos' : 'photo')
    if (
      !files.length ||
      files.length > 20 ||
      !files.every(
        (file) =>
          file instanceof File &&
          ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
          file.size > 0 &&
          file.size <= 10 * 1024 * 1024
      )
    )
      throw new ApiError(400, 'Gunakan JPG, PNG, atau WebP, maksimal 10 MB per foto')
    const client = storage()
    const paths: string[] = []
    const urls: string[] = []
    try {
      for (const entry of files) {
        const file = entry as File
        const buffer = Buffer.from(await file.arrayBuffer())
        const sharp = (await import('sharp')).default
        const metadata = await sharp(buffer, { limitInputPixels: 40000000 }).metadata()
        if (!['jpeg', 'png', 'webp'].includes(metadata.format || ''))
          throw new ApiError(400, 'Isi file bukan gambar yang didukung')
        const filename = `${randomUUID()}.${metadata.format === 'jpeg' ? 'jpg' : metadata.format}`
        const path = prefix + filename
        const { error } = await client.storage
          .from('photos')
          .upload(path, buffer, { contentType: `image/${metadata.format}`, upsert: false })
        if (error) throw new ApiError(502, 'Upload foto gagal, silakan coba lagi')
        paths.push(path)
        urls.push(client.storage.from('photos').getPublicUrl(path).data.publicUrl)
      }
    } catch (error) {
      if (paths.length) await client.storage.from('photos').remove(paths)
      throw error
    }
    return NextResponse.json({
      success: true,
      url: urls[0],
      urls,
      filename: paths[0].split('/').pop(),
      galleryCode,
      sessionId,
    })
  } catch (error) {
    return apiError(error)
  }
}
export const POST = (request: NextRequest) => upload(request, false)
export const PUT = (request: NextRequest) => upload(request, true)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, true)
    const code = request.nextUrl.searchParams.get('galleryCode')
    const filename = request.nextUrl.searchParams.get('filename')
    if (!code || !filename || !/^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/.test(filename))
      throw new ApiError(400, 'Nama file tidak valid')
    if (
      !(await prisma.sessionPhoto.findFirst({
        where: { galleryCode: code, outlet: { tenantId: admin.tenantId } },
      }))
    )
      throw new ApiError(404, 'Galeri tidak ditemukan')
    const { error } = await storage()
      .storage.from('photos')
      .remove([`sessions/${code}/${filename}`])
    if (error) throw new ApiError(502, 'Penghapusan foto gagal')
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
