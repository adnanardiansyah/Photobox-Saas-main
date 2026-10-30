import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBooth, ApiError, apiError } from '@/lib/api-security'
import { checkCharge, demoPayments } from '@/lib/payment/server'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const outlet = await requireBooth(request)
    const ref = request.nextUrl.searchParams.get('ref')
    if (ref?.startsWith('DEMO-') && !demoPayments()) throw new ApiError(409, 'Transaksi demo tidak berlaku di lingkungan ini')
    if (!ref) throw new ApiError(400, 'Referensi transaksi wajib diisi')
    const transaction = await prisma.transaction.findFirst({ where: { transactionRef: ref, outletId: outlet.id } })
    if (!transaction) throw new ApiError(404, 'Transaksi tidak ditemukan')
    if (transaction.status === 'SUCCESS') return NextResponse.json({ success: true, status: 'success', paidAt: transaction.paidAt })
    if (transaction.status === 'REFUNDED') return NextResponse.json({ success: true, status: 'refunded' })
    if (transaction.status === 'FAILED') return NextResponse.json({ success: true, status: 'failed' })
    const status = await checkCharge(ref, transaction.amount)
    if (status === 'success') {
      await prisma.$transaction([
        prisma.transaction.updateMany({ where: { id: transaction.id, status: 'PENDING' }, data: { status: 'SUCCESS', paidAt: new Date() } }),
        prisma.sessionPhoto.update({ where: { id: transaction.sessionId }, data: { paymentStatus: 'PAID' } }),
      ])
    } else if (status === 'failed') {
      await prisma.transaction.updateMany({ where: { id: transaction.id, status: 'PENDING' }, data: { status: 'FAILED' } })
    }
    return NextResponse.json({ success: true, status })
  } catch (error) { return apiError(error) }
}
