import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBooth, apiError } from '@/lib/api-security'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const outlet = await requireBooth(request)
    const c = outlet.config
    let methods = c?.paymentMethods
    if (typeof methods === 'string') { try { methods = JSON.parse(methods) } catch { methods = {} } }
    const m = methods as Record<string, boolean> | null
    const templates = await prisma.frameTemplate.findMany({ where: { tenantId: outlet.tenantId, isActive: true }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ success: true, config: { outletId: outlet.id, outletName: outlet.name, machineId: outlet.machineId, printEnabled: c?.printEnabled ?? false, galleryEnabled: c?.galleryEnabled ?? true, gifEnabled: c?.gifEnabled ?? false, newspaperEnabled: c?.newspaperEnabled ?? false, defaultPrice: c?.priceDefault ?? 0, paymentMethods: { qris: m?.qris === true, voucher: m?.voucher === true, event: c?.priceDefault === 0 }, countdownDuration: 8, burstCount: 3, gifFrames: 0, sessionTimeout: 540 }, templates: templates.map(t => ({ id: t.id, name: t.name, theme: t.type, imageUrl: t.imageUrl, thumbnailUrl: t.thumbnailUrl || t.imageUrl, slots: 6, layout: 'grid-2x3' })) })
  } catch (error) { return apiError(error) }
}
