import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { requireBooth, ApiError, apiError, paymentEnabled } from '@/lib/api-security'
import { createCharge, demoPayments } from '@/lib/payment/server'
export async function POST(request: NextRequest) {
  try {
    const outlet = await requireBooth(request)
    if (!paymentEnabled(outlet.config?.paymentMethods, 'qris')) throw new ApiError(403, 'QRIS tidak aktif')
    const { sessionId } = await request.json()
    if (typeof sessionId !== 'string' || !sessionId) throw new ApiError(400, 'ID sesi wajib diisi')
    const transaction = await prisma.$transaction(async tx => {
      const session = await tx.sessionPhoto.findFirst({ where: { id: sessionId, outletId: outlet.id }, include: { transaction: true } })
      if (!session) throw new ApiError(404, 'Sesi tidak ditemukan')
      if (session.paymentStatus === 'PAID' || session.status !== 'CAPTURING' || session.totalPrice <= 0) throw new ApiError(409, 'Sesi tidak dapat ditagih')
      if (session.galleryExpiresAt && session.galleryExpiresAt <= new Date()) throw new ApiError(410, 'Sesi kedaluwarsa')
      if (session.transaction) return session.transaction
      // Competes with voucher redemption on the same row under serializable isolation.
      await tx.sessionPhoto.update({ where: { id: session.id }, data: { paymentMethod: 'QRIS' } })
      return tx.transaction.create({ data: { outletId: outlet.id, sessionId: session.id, amount: session.totalPrice, paymentMethod: 'QRIS', paymentGateway: 'MIDTRANS', transactionRef: `${demoPayments() ? 'DEMO-' : 'SN-'}${randomUUID()}` } })
    }, { isolationLevel: 'Serializable' })
    if (transaction.status === 'FAILED') throw new ApiError(409, 'Pembayaran gagal. Mulai sesi baru.')
    let qr = transaction.qrisString
    let expiresAt = new Date(transaction.createdAt.getTime() + 15 * 60000)
    if (!qr) {
      const charge = await createCharge(transaction.transactionRef!, transaction.amount)
      qr = charge.qr; expiresAt = charge.expiresAt
      await prisma.transaction.update({ where: { id: transaction.id }, data: { qrisString: qr } })
      await prisma.sessionPhoto.update({ where: { id: transaction.sessionId }, data: { paymentMethod: 'QRIS', paymentRef: transaction.transactionRef } })
    }
    return NextResponse.json({ success: true, qrString: qr, transactionRef: transaction.transactionRef, amount: transaction.amount, expiresAt: expiresAt.toISOString() })
  } catch (error) { return apiError(error) }
}
