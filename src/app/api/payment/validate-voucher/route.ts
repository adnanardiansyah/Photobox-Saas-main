import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBooth, apiError, ApiError } from '@/lib/api-security'
import { voucherDiscount } from '@/lib/payment/voucher'
export async function POST(request: NextRequest) {
  try {
    const outlet = await requireBooth(request)
    const { code } = await request.json()
    if (typeof code !== 'string' || !code.trim() || code.length > 100) throw new ApiError(400, 'Kode voucher tidak valid')
    const voucher = await prisma.voucher.findUnique({ where: { code: code.trim().toUpperCase() } })
    const amount = outlet.config?.priceDefault ?? 0
    const discount = voucherDiscount(voucher, outlet.tenantId, amount)
    return NextResponse.json({ success: true, data: { code: voucher!.code, discount, finalPrice: amount - discount } })
  } catch (error) { return apiError(error) }
}
