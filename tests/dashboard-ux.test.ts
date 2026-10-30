import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { prisma } from '../src/lib/db/prisma'
import { signAuthToken } from '../src/lib/auth'
import { useDashboardStore } from '../src/lib/stores/dashboard-store'
import { transactionsCsv, reportTransactions, csvCell } from '../src/lib/report-utils'
import { mapCoordinates } from '../src/lib/map-coordinates'
import { GET as notifications } from '../src/app/api/admin/notifications/route'
import { GET as session } from '../src/app/api/admin/session/route'
async function main() {
  const now = Date.UTC(2026, 9, 31, 12)
  const rows: any[] = [
    {
      id: 'one',
      outletId: 'a',
      amount: 25000,
      status: 'success',
      paymentMethod: 'QRIS',
      createdAt: new Date(now - 1000).toISOString(),
    },
    {
      id: 'two',
      outletId: 'b',
      amount: 50000,
      status: 'pending',
      paymentMethod: 'CASH',
      createdAt: new Date(now - 86400000 * 10).toISOString(),
    },
    {
      id: 'future',
      outletId: 'a',
      amount: 1,
      status: 'pending',
      paymentMethod: 'CASH',
      createdAt: new Date(now + 1000).toISOString(),
    },
  ]
  assert.deepEqual(
    reportTransactions(rows, 7, 'all', now).map((t) => t.id),
    ['one']
  )
  assert.deepEqual(
    reportTransactions(rows, 30, 'b', now).map((t) => t.id),
    ['two']
  )
  const csv = transactionsCsv(
    rows.slice(0, 1),
    new Map([['a', '=HYPERLINK("https://example.invalid")']])
  )
  assert(csv.startsWith('\uFEFF'))
  assert(csv.includes('Jumlah (Rp)'))
  assert(csv.includes("'=HYPERLINK"))
  assert.equal(csvCell('a,"b"\nc'), '"a,""b""\nc"')
  assert.equal(csvCell('  +1'), '"\'  +1"')
  assert.deepEqual(mapCoordinates('https://maps.google.com/maps?q=-6.2,106.8&output=embed'), {
    latitude: -6.2,
    longitude: 106.8,
  })
  assert.deepEqual(mapCoordinates('https://www.google.com/maps/place/Test/@5.5,95.3,14z'), {
    latitude: 5.5,
    longitude: 95.3,
  })
  assert.deepEqual(mapCoordinates('https://www.google.com/maps/embed?pb=!2d95.3!3d5.5'), {
    latitude: 5.5,
    longitude: 95.3,
  })
  assert.equal(mapCoordinates('https://evil.example/?q=1,2'), null)
  assert.equal(mapCoordinates('https://maps.google.com/maps?q=100,200'), null)
  useDashboardStore.getState().setSearchQuery('old search')
  useDashboardStore.getState().setActiveModule('templates')
  assert.equal(useDashboardStore.getState().searchQuery, '')
  useDashboardStore.getState().setSearchQuery('current search')
  useDashboardStore.getState().setActiveModule('templates')
  assert.equal(useDashboardStore.getState().searchQuery, 'current search')
  useDashboardStore
    .getState()
    .setCurrentUser({
      id: 'owner',
      name: 'Nama Asli',
      email: 'owner@example.invalid',
      role: 'OWNER',
      tenantId: 'tenant-a',
      tenantName: 'Usaha Asli',
    })
  useDashboardStore.getState().clearAdminSession()
  assert.equal(useDashboardStore.getState().currentUser, null)
  assert.equal(useDashboardStore.getState().searchQuery, '')
  process.env.JWT_SECRET = 'test-secret-for-ux-regressions-only-123456789'
  const token = signAuthToken({
    userId: 'owner',
    email: 'owner@example.invalid',
    role: 'OWNER',
    tenantId: 'tenant-a',
  })
  const req = () =>
    new NextRequest('http://localhost:3000/api/admin/notifications', {
      headers: { Cookie: `snapnext_token=${token}` },
    })
  const originalUser = prisma.user.findUnique,
    originalTestimonials = prisma.testimonial.findMany,
    originalOutlets = prisma.outlet.findMany
  try {
    assert.equal(
      (await notifications(new NextRequest('http://localhost:3000/api/admin/notifications')))
        .status,
      401
    )
    ;(prisma.user as any).findUnique = async () => ({
      id: 'owner',
      name: 'Nama Asli',
      email: 'owner@example.invalid',
      role: 'OWNER',
      tenantId: 'tenant-a',
      isActive: true,
      passwordHash: 'private',
      tenant: { isActive: true, name: 'Usaha Asli' },
    })
    ;(prisma.testimonial as any).findMany = async (args: any) => {
      assert.equal(args.where.tenantId, 'tenant-a')
      assert.equal(args.where.isApproved, false)
      return [{ id: 'pending-a', customerName: 'Pelanggan A' }]
    }
    ;(prisma.outlet as any).findMany = async (args: any) => {
      assert.equal(args.where.tenantId, 'tenant-a')
      return [
        { id: 'online-a', name: 'Aktif', heartbeats: [{ status: 'ONLINE', lastSeen: new Date() }] },
        { id: 'offline-a', name: 'Belum tersambung', heartbeats: [] },
      ]
    }
    const result = await notifications(req())
    assert.equal(result.status, 200)
    const data = (await result.json()).data
    assert.equal(data.length, 2)
    assert(data.some((n: any) => n.id === 'testimonial-pending-a'))
    assert(data.some((n: any) => n.id === 'outlet-offline-a'))
    assert(!data.some((n: any) => n.id === 'outlet-online-a'))
    const identity = (await (await session(req())).json()).user
    assert.equal(identity.name, 'Nama Asli')
    assert.equal(identity.tenantName, 'Usaha Asli')
    assert.equal(identity.passwordHash, undefined)
    console.log(
      'PASS: dashboard UX unit checks for CSV export, filters, map parsing, search reset, session identity, and tenant-scoped notifications'
    )
  } finally {
    ;(prisma.user as any).findUnique = originalUser
    ;(prisma.testimonial as any).findMany = originalTestimonials
    ;(prisma.outlet as any).findMany = originalOutlets
    await prisma.$disconnect()
  }
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
