import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { mapOutlet, mapBranding } from '@/lib/dashboard-data'
import { apiError } from '@/lib/api-security'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const tenantId = process.env.PUBLIC_TENANT_ID
    if (!tenantId) return NextResponse.json({ success: true, data: { outlets: [], testimonials: [] } })
    const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, isActive: true }, include: { brandAssets: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } } })
    if (!tenant) return NextResponse.json({ success: true, data: { outlets: [], testimonials: [] } })
    const [outlets, testimonials] = await Promise.all([
      prisma.outlet.findMany({ where: { tenantId, isActive: true }, include: { config: true, heartbeats: { orderBy: { lastSeen: 'desc' }, take: 1 } } }),
      prisma.testimonial.findMany({ where: { tenantId, isApproved: true }, select: { id: true, customerName: true, message: true, rating: true, outletId: true, isApproved: true, createdAt: true } }),
    ])
    return NextResponse.json({ success: true, data: { branding: mapBranding(tenant), outlets: outlets.map(mapOutlet), testimonials: testimonials.map(t => ({ ...t, comment: t.message })) } })
  } catch (error) { return apiError(error) }
}
