import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin, apiError } from '@/lib/api-security'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    const [testimonials, outlets] = await Promise.all([
      prisma.testimonial.findMany({
        where: { tenantId: user.tenantId, isApproved: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, customerName: true },
      }),
      prisma.outlet.findMany({
        where: { tenantId: user.tenantId, isActive: true },
        orderBy: { name: 'asc' },
        take: 50,
        include: { heartbeats: { orderBy: { lastSeen: 'desc' }, take: 1 } },
      }),
    ])
    const pending = testimonials.map((t) => ({
      id: `testimonial-${t.id}`,
      title: 'Testimoni menunggu persetujuan',
      message: `Testimoni dari ${t.customerName} belum disetujui.`,
      module: 'testimonials',
    }))
    const offline = outlets
      .filter(
        (o) =>
          !o.heartbeats[0] ||
          o.heartbeats[0].status !== 'ONLINE' ||
          Date.now() - o.heartbeats[0].lastSeen.getTime() > 300000
      )
      .slice(0, 5)
      .map((o) => ({
        id: `outlet-${o.id}`,
        title: o.name,
        message: o.heartbeats.length
          ? 'Perangkat tidak mengirim kabar aktif dalam lima menit terakhir atau melaporkan masalah.'
          : 'Belum ada kabar aktif dari perangkat booth.',
        module: 'outlets',
      }))
    return NextResponse.json(
      { success: true, data: [...pending, ...offline] },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    return apiError(error)
  }
}
