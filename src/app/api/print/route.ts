import { NextRequest, NextResponse } from 'next/server'
import net from 'net'
import sharp from 'sharp'
import { prisma } from '@/lib/db/prisma'
import { requireBooth, apiError, ApiError } from '@/lib/api-security'

export async function POST(request: NextRequest) {
  try {
    const outlet = await requireBooth(request, 'print')
    if (!outlet.config?.printEnabled) throw new ApiError(403, 'Cetak tidak aktif untuk outlet ini')
    const host = process.env.PRINTER_HOST
    const port = Number(process.env.PRINTER_PORT || 9100)
    if (!host || process.env.PRINTER_PROTOCOL !== 'escpos') throw new ApiError(503, 'Printer belum dikonfigurasi. Diperlukan printer jaringan ESC/POS.')
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new ApiError(503, 'Port printer tidak valid')
    const { sessionId, imageBase64, copies = 1 } = await request.json()
    if (typeof sessionId !== 'string' || !sessionId || copies !== 1 || typeof imageBase64 !== 'string' || imageBase64.length > 14000000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(imageBase64)) throw new ApiError(400, 'Data cetak tidak valid; satu cetakan per sesi')
    const session = await prisma.sessionPhoto.findFirst({ where: { id: sessionId, outletId: outlet.id, paymentStatus: 'PAID' } })
    if (!session) throw new ApiError(404, 'Sesi berbayar tidak ditemukan')
    const width = Number(process.env.PRINTER_WIDTH_DOTS || 576)
    if (!Number.isInteger(width) || width < 8 || width > 2048 || width % 8 !== 0) throw new ApiError(503, 'Lebar printer tidak valid')
    const { data, info } = await sharp(Buffer.from(imageBase64.split(',')[1], 'base64'), { limitInputPixels: 40000000 }).resize({ width }).flatten({ background: '#fff' }).greyscale().raw().toBuffer({ resolveWithObject: true })
    if (info.height > 10000) throw new ApiError(400, 'Gambar terlalu tinggi untuk printer')
    const bytesPerRow = width / 8
    const parts: Buffer[] = [Buffer.from([0x1b, 0x40])]
    for (let top = 0; top < info.height; top += 256) {
      const height = Math.min(256, info.height - top)
      const bitmap = Buffer.alloc(bytesPerRow * height)
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(top + y) * width + x] < 128) bitmap[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x % 8)
      parts.push(Buffer.from([0x1d, 0x76, 0x30, 0, bytesPerRow & 255, bytesPerRow >> 8, height & 255, height >> 8]), bitmap)
    }
    parts.push(Buffer.from([0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0]))
    const claimed = await prisma.sessionPhoto.updateMany({ where: { id: session.id, status: 'CAPTURING', paymentStatus: 'PAID' }, data: { status: 'PROCESSING' } })
    if (claimed.count !== 1) throw new ApiError(409, 'Pekerjaan cetak sudah dikirim atau sesi telah selesai')
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection({ host, port })
        socket.setTimeout(15000)
        socket.once('error', reject)
        socket.once('timeout', () => socket.destroy(new Error('Printer timeout')))
        socket.once('connect', () => socket.end(Buffer.concat(parts)))
        socket.once('close', hadError => { if (!hadError) resolve() })
      })
    } catch {
      // Do not retry automatically: a connection failure may occur after bytes reached the printer.
      throw new ApiError(502, 'Koneksi printer gagal. Periksa printer sebelum mencetak ulang; foto masih dapat disimpan.')
    }
    return NextResponse.json({ success: true, message: 'Data cetak telah dikirim ke printer' })
  } catch (error) { return apiError(error) }
}
export async function GET(request: NextRequest) {
  try {
    await requireBooth(request, 'print')
    return NextResponse.json({ configured: !!process.env.PRINTER_HOST && process.env.PRINTER_PROTOCOL === 'escpos' })
  } catch (error) { return apiError(error) }
}
