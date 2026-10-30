import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBooth, apiError, ApiError, paymentEnabled } from '@/lib/api-security'
import { voucherDiscount } from '@/lib/payment/voucher'
export async function POST(request: NextRequest) {
  try {
    const outlet = await requireBooth(request)
    const { sessionId, code, method } = await request.json()
    if (typeof sessionId !== 'string' || !sessionId) throw new ApiError(400, 'ID sesi wajib diisi')
    const result = await prisma.$transaction(async tx => {
      const session = await tx.sessionPhoto.findFirst({ where: { id: sessionId, outletId: outlet.id }, include: { transaction: true } })
      if (!session) throw new ApiError(404, 'Sesi tidak ditemukan')
      if (session.galleryExpiresAt && session.galleryExpiresAt <= new Date()) throw new ApiError(410, 'Sesi kedaluwarsa')
      if (session.paymentStatus === 'PAID') return { paid: true, remaining: 0 }
      if (session.transaction || session.status !== 'CAPTURING') throw new ApiError(409, 'Sesi sedang diproses')
      let remaining = session.totalPrice
      let voucherCode: string | undefined
      if (method === 'event') {
        if (remaining !== 0 || outlet.config?.priceDefault !== 0) throw new ApiError(403, 'Mode event hanya untuk outlet gratis')
      } else {
        if (!paymentEnabled(outlet.config?.paymentMethods, 'voucher')) throw new ApiError(403, 'Voucher tidak aktif')
        if (session.voucherCode) return { paid: false, remaining }
        if (typeof code !== 'string' || !code.trim() || code.length > 100) throw new ApiError(400, 'Kode voucher wajib diisi')
        const voucher = await tx.voucher.findUnique({ where: { code: code.trim().toUpperCase() } })
        const discount = voucherDiscount(voucher, outlet.tenantId, remaining)
        const claimed = await tx.voucher.updateMany({ where: { id: voucher!.id, usedCount: voucher!.usedCount }, data: { usedCount: { increment: 1 } } })
        if (claimed.count !== 1) throw new ApiError(409, 'Voucher sedang digunakan, coba lagi')
        remaining -= discount; voucherCode = voucher!.code
      }
      await tx.sessionPhoto.update({ where: { id: session.id }, data: { totalPrice: remaining, voucherCode, paymentMethod: 'VOUCHER', paymentStatus: remaining === 0 ? 'PAID' : 'PENDING' } })
      if (remaining === 0) await tx.transaction.create({ data: { outletId: outlet.id, sessionId: session.id, amount: 0, paymentMethod: 'VOUCHER', status: 'SUCCESS', paidAt: new Date() } })
      return { paid: remaining === 0, remaining }
    }, { isolationLevel: 'Serializable' })
    return NextResponse.json({ success: true, ...result })
  } catch (error) { return apiError(error) }
}
