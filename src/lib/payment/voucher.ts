import { Voucher } from '@prisma/client'
import { ApiError } from '@/lib/api-security'
export function voucherDiscount(voucher: Voucher | null, tenantId: string, amount: number) {
  const now = new Date()
  if (!voucher || voucher.tenantId !== tenantId || !voucher.isActive || now < voucher.validFrom || now > voucher.validUntil) throw new ApiError(400, 'Voucher tidak valid atau kedaluwarsa')
  const limit = voucher.usageType === 'SINGLE_USE' ? 1 : voucher.maxUses
  if (limit !== null && voucher.usedCount >= limit) throw new ApiError(409, 'Batas pemakaian voucher tercapai')
  if (amount < voucher.minOrder) throw new ApiError(400, 'Minimum pembelian voucher belum terpenuhi')
  if (voucher.value < 0 || voucher.type === 'PERCENTAGE' && voucher.value > 100) throw new ApiError(400, 'Nilai voucher tidak valid')
  return Math.min(amount, voucher.type === 'PERCENTAGE' ? Math.round(amount * voucher.value / 100) : Math.round(voucher.value))
}
