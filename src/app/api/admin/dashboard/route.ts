import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin, apiError } from '@/lib/api-security'
import { mapOutlet, mapBranding } from '@/lib/dashboard-data'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    const tenantId = user.tenantId
    const since = new Date(Date.now() - 366 * 86400000)
    const [outlets, templates, users, vouchers, transactions, sessions, tenant] = await Promise.all([
      prisma.outlet.findMany({ where: { tenantId, isActive: true }, include: { config: true, heartbeats: { orderBy: { lastSeen: 'desc' }, take: 1 } } }),
      prisma.frameTemplate.findMany({ where: { tenantId } }),
      prisma.user.findMany({ where: { tenantId }, select: { id: true, name: true, email: true, role: true, outletId: true, isActive: true, createdAt: true } }),
      prisma.voucher.findMany({ where: { tenantId } }),
      prisma.transaction.findMany({ where: { outlet: { tenantId }, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' } }),
      prisma.sessionPhoto.findMany({ where: { outlet: { tenantId }, status: 'COMPLETED', createdAt: { gte: new Date(Date.now() - 48 * 3600000) } }, select: { photos: true, createdAt: true } }),
      prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, include: { brandAssets: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } } }),
    ])
    const mapped = outlets.map(mapOutlet)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const photosToday = sessions.filter(s => s.createdAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === today).reduce((sum, s) => sum + (Array.isArray(s.photos) ? s.photos.length : 0), 0)
    return NextResponse.json({ success: true, data: { outlets: mapped, templates: templates.map(t => ({ ...t, category: t.type === 'FOUR_R' ? '4R' : t.type === 'A4_NEWSPAPER' ? 'A4 Newspaper' : 'Custom' })), users: users.map(u => ({ ...u, role: u.role.toLowerCase(), status: u.isActive ? 'active' : 'inactive' })), vouchers: vouchers.map(v => ({ id: v.id, code: v.code, discountType: v.type === 'PERCENTAGE' ? 'percentage' : 'fixed', discountValue: v.value, minPurchase: v.minOrder, usageLimit: v.maxUses || 0, usedCount: v.usedCount, validFrom: v.validFrom, validUntil: v.validUntil, isActive: v.isActive, createdAt: v.createdAt })), transactions: transactions.map(t => ({ ...t, status: t.status.toLowerCase() })), boothStatuses: mapped.map(o => ({ id: o.id, name: o.name, outletId: o.id, status: o.status, lastPhoto: o.lastHeartbeat })), photosToday, branding: mapBranding(tenant) } })
  } catch (error) { return apiError(error) }
}
