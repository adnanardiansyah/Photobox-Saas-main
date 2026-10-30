import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { prisma } from '../src/lib/db/prisma'
import { signAuthToken, signBoothToken } from '../src/lib/auth'
import { validPhotoUrl, paymentEnabled } from '../src/lib/api-security'
import * as admin from '../src/app/api/admin/[resource]/route'
import * as galleryAdmin from '../src/app/api/admin/gallery/route'
import * as outletsAdmin from '../src/app/api/admin/outlets/route'
import * as photos from '../src/app/api/sessions/[sessionId]/photos/route'
import * as upload from '../src/app/api/photos/upload/route'
import * as qris from '../src/app/api/payment/qris/route'
import * as paymentStatus from '../src/app/api/payment/status/route'
import * as redeem from '../src/app/api/payment/redeem/route'
import * as printer from '../src/app/api/print/route'
import * as boothLogin from '../src/app/api/booth/login/route'
import * as keys from '../src/app/api/admin/booth-keys/route'
import * as dashboard from '../src/app/api/admin/dashboard/route'
import * as branding from '../src/app/api/admin/branding/route'
import * as notify from '../src/app/api/send-wa/route'
import { checkCharge, createCharge, demoPayments } from '../src/lib/payment/server'
import { voucherDiscount } from '../src/lib/payment/voucher'

async function main() {
  process.env.JWT_SECRET = 'test-secret-for-security-regressions-only-12345'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://storage.example.com'
  process.env.DEMO_MODE = 'false'
  process.env.MIDTRANS_SERVER_KEY = 'test-key'
  process.env.PAYMENT_PROVIDER = 'midtrans'
  const originalFetch = globalThis.fetch
  const originals: Array<() => void> = []
  function stub(target: any, method: string, implementation: any) {
    const original = target[method]
    target[method] = implementation
    originals.push(() => { target[method] = original })
  }
  const owner = { id: 'owner', tenantId: 'tenant-a', role: 'OWNER', isActive: true, tenant: { isActive: true } }
  const outlet = { id: 'outlet-a', tenantId: 'tenant-a', isActive: true, tenant: { isActive: true }, config: { priceDefault: 25000, paymentMethods: { qris: true, voucher: true }, printEnabled: true } }
  const adminToken = signAuthToken({ userId: 'owner', email: 'owner@example.com', role: 'OWNER', tenantId: 'tenant-a' })
  const boothToken = signBoothToken('key-a')
  const request = (path: string, method = 'GET', body?: unknown, auth?: 'admin' | 'booth') => new NextRequest(`http://localhost:3000${path}`, { method, headers: { ...(auth ? { Cookie: `${auth === 'admin' ? 'snapnext_token' : 'snapnext_booth'}=${auth === 'admin' ? adminToken : boothToken}` } : {}), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const context = { params: { resource: 'users' } }
  try {
    // Every protected mutation must reject before touching a database or storage service.
    let cases = 0
    const unauthorized = [
      () => admin.GET(request('/api/admin/users'), context),
      () => admin.POST(request('/api/admin/users', 'POST', {}), context),
      () => admin.PUT(request('/api/admin/users?id=x', 'PUT', {}), context),
      () => admin.DELETE(request('/api/admin/users?id=x', 'DELETE'), context),
      () => outletsAdmin.GET(request('/api/admin/outlets')),
      () => galleryAdmin.GET(request('/api/admin/gallery')),
      () => galleryAdmin.POST(request('/api/admin/gallery', 'POST', {})),
      () => photos.PUT(request('/api/sessions/x/photos', 'PUT', {}), { params: { sessionId: 'x' } }),
      () => upload.POST(request('/api/photos/upload', 'POST', {})),
      () => qris.POST(request('/api/payment/qris', 'POST', {})),
      () => paymentStatus.GET(request('/api/payment/status?ref=x')),
      () => redeem.POST(request('/api/payment/redeem', 'POST', {})),
      () => printer.POST(request('/api/print', 'POST', {})),
      () => notify.POST(request('/api/send-wa', 'POST', {})),
      () => keys.POST(request('/api/admin/booth-keys', 'POST', {})),
      () => dashboard.GET(request('/api/admin/dashboard')),
      () => branding.PUT(request('/api/admin/branding', 'PUT', {})),
    ]
    for (const call of unauthorized) { assert.equal((await call()).status, 401); cases++ }
    stub(prisma.user, 'findUnique', async () => owner)
    stub(prisma.apiKey, 'findUnique', async () => ({ id: 'key-a', key: 'hashed', outletId: 'outlet-a', isActive: true, expiresAt: null, permissions: ['capture', 'upload', 'print'] }))
    stub(prisma.outlet, 'findUnique', async () => outlet)
    let readWhere: any
    stub(prisma.user, 'findMany', async (args: any) => { readWhere = args.where; return [{ id: 'owner', passwordHash: 'sensitive-hash', email: 'owner@example.com' }] })
    const users = await admin.GET(request('/api/admin/users?tenantId=tenant-b', 'GET', undefined, 'admin'), context)
    assert.equal(users.status, 200)
    assert.deepEqual(readWhere.AND[0], { tenantId: 'tenant-a' })
    assert.equal('passwordHash' in (await users.json()).data[0], false); cases++
    const crossOrigin = request('/api/admin/users', 'POST', {}, 'admin')
    crossOrigin.headers.set('origin', 'https://attacker.example')
    assert.equal((await admin.POST(crossOrigin, context)).status, 403); cases++
    stub(prisma.user, 'findUnique', async () => ({ ...owner, role: 'MANAGER' }))
    assert.equal((await admin.POST(request('/api/admin/users', 'POST', {}, 'admin'), context)).status, 403); cases++
    assert.equal((await admin.GET(request('/api/admin/users', 'GET', undefined, 'admin'), context)).status, 200)
    stub(prisma.user, 'findUnique', async () => owner)
    stub(prisma.user, 'findFirst', async (args: any) => { assert.deepEqual(args.where.AND[0], { tenantId: 'tenant-a' }); return null })
    assert.equal((await admin.PUT(request('/api/admin/users?id=other-tenant-user', 'PUT', { role: 'OWNER' }, 'admin'), context)).status, 404); cases++
    stub(prisma.sessionPhoto, 'findFirst', async (args: any) => { assert.equal(args.where.outletId, 'outlet-a'); return { id: 'session-a', paymentStatus: 'PENDING' } })
    assert.equal((await photos.PUT(request('/api/sessions/session-a/photos', 'PUT', { photos: [], paymentStatus: 'PAID', totalPrice: 0 }, 'booth'), { params: { sessionId: 'session-a' } })).status, 409); cases++
    assert.equal((await qris.POST(request('/api/payment/qris', 'POST', { amount: 1 }, 'booth'))).status, 400); cases++
    assert.equal(validPhotoUrl('https://evil.example/photo.jpg'), false)
    assert.equal(validPhotoUrl('https://storage.example.com/storage/v1/object/public/photos/sessions/ABC/photo.jpg', 'sessions/ABC/'), true)
    assert.equal(validPhotoUrl('https://storage.example.com/storage/v1/object/public/photos/sessions/OTHER/photo.jpg', 'sessions/ABC/'), false)
    assert.equal(paymentEnabled('{"qris":false}', 'qris'), false); cases++
    const voucher: any = { tenantId: 'tenant-a', isActive: true, validFrom: new Date(0), validUntil: new Date(Date.now() + 60000), usageType: 'SINGLE_USE', usedCount: 0, maxUses: 100, minOrder: 0, type: 'PERCENTAGE', value: 50 }
    assert.equal(voucherDiscount(voucher, 'tenant-a', 25000), 12500)
    assert.throws(() => voucherDiscount(voucher, 'tenant-b', 25000))
    assert.throws(() => voucherDiscount({ ...voucher, usedCount: 1 }, 'tenant-a', 25000)); cases++
    // Server derives charge amount from the session and persists the order reference.
    let chargedAmount = 0
    let updatedSession: any
    const storedTransaction = { id: 'tx', sessionId: 'session-a', outletId: 'outlet-a', amount: 25000, status: 'PENDING', transactionRef: 'SN-order', qrisString: null, createdAt: new Date() }
    stub(prisma, '$transaction', async (operation: any) => typeof operation === 'function' ? operation(prisma) : Promise.all(operation))
    stub(prisma.sessionPhoto, 'findFirst', async () => ({ id: 'session-a', outletId: 'outlet-a', paymentStatus: 'PENDING', status: 'CAPTURING', totalPrice: 25000, transaction: null }))
    stub(prisma.sessionPhoto, 'update', async (args: any) => { updatedSession = args.data; return args.data })
    stub(prisma.transaction, 'create', async (args: any) => { chargedAmount = args.data.amount; return { ...storedTransaction, ...args.data } })
    stub(prisma.transaction, 'update', async () => storedTransaction)
    globalThis.fetch = async (_url, options) => {
      const body = JSON.parse(String(options?.body))
      return Response.json({ status_code: '201', order_id: body.transaction_details.order_id, gross_amount: '25000.00', qr_string: 'verified-qr' })
    }
    const charged = await qris.POST(request('/api/payment/qris', 'POST', { sessionId: 'session-a', amount: 1 }, 'booth'))
    assert.equal(charged.status, 200)
    assert.equal(chargedAmount, 25000)
    assert.equal((await charged.json()).amount, 25000); cases++
    // Gateway failure never marks a pending transaction or its session as paid.
    stub(prisma.transaction, 'findFirst', async () => storedTransaction)
    let paidWrites = 0
    stub(prisma.sessionPhoto, 'update', async () => { paidWrites++; return {} })
    stub(prisma.transaction, 'updateMany', async () => ({ count: 1 }))
    globalThis.fetch = async () => Response.json({ status_code: '503' }, { status: 503 })
    assert.equal((await paymentStatus.GET(request('/api/payment/status?ref=SN-order', 'GET', undefined, 'booth'))).status, 502)
    assert.equal(paidWrites, 0); cases++
    globalThis.fetch = async () => Response.json({ status_code: '200', order_id: 'SN-order', gross_amount: '1', currency: 'IDR', payment_type: 'qris', transaction_status: 'settlement' })
    assert.equal((await paymentStatus.GET(request('/api/payment/status?ref=SN-order', 'GET', undefined, 'booth'))).status, 502)
    assert.equal(paidWrites, 0); cases++
    globalThis.fetch = async () => Response.json({ status_code: '200', order_id: 'SN-order', gross_amount: '25000.00', currency: 'IDR', payment_type: 'qris', transaction_status: 'settlement', fraud_status: 'accept' })
    assert.equal((await paymentStatus.GET(request('/api/payment/status?ref=SN-order', 'GET', undefined, 'booth'))).status, 200)
    assert.equal(paidWrites, 1); cases++
    // A completed upload cannot be moved to another storage folder or marked paid by the caller.
    stub(prisma.sessionPhoto, 'findFirst', async () => ({ id: 'session-a', galleryCode: 'GAL-A', status: 'CAPTURING', paymentStatus: 'PAID' }))
    const injectedPhotos = await photos.PUT(request('/api/sessions/session-a/photos', 'PUT', { photos: ['https://storage.example.com/storage/v1/object/public/photos/sessions/OTHER/photo.jpg'], paymentStatus: 'PAID' }, 'booth'), { params: { sessionId: 'session-a' } })
    assert.equal(injectedPhotos.status, 400); cases++
    // Redemption is idempotent and partial discounts keep the session pending until QRIS settles.
    const redeemSession: any = { id: 'session-a', totalPrice: 25000, status: 'CAPTURING', paymentStatus: 'PENDING', transaction: null, voucherCode: null }
    let voucherClaims = 0
    stub(prisma.sessionPhoto, 'findFirst', async () => redeemSession)
    stub(prisma.voucher, 'findUnique', async () => ({ ...voucher, id: 'voucher-a', code: 'HALF' }))
    stub(prisma.voucher, 'updateMany', async () => { voucherClaims++; return { count: 1 } })
    stub(prisma.sessionPhoto, 'update', async (args: any) => Object.assign(redeemSession, args.data))
    const partial = await redeem.POST(request('/api/payment/redeem', 'POST', { sessionId: 'session-a', code: 'HALF' }, 'booth'))
    assert.equal(partial.status, 200)
    assert.equal((await partial.json()).remaining, 12500)
    assert.equal(redeemSession.paymentStatus, 'PENDING')
    assert.equal(voucherClaims, 1)
    assert.equal((await redeem.POST(request('/api/payment/redeem', 'POST', { sessionId: 'session-a', code: 'HALF' }, 'booth'))).status, 200)
    assert.equal(voucherClaims, 1); cases++
    redeemSession.voucherCode = null
    stub(prisma.voucher, 'updateMany', async () => ({ count: 0 }))
    assert.equal((await redeem.POST(request('/api/payment/redeem', 'POST', { sessionId: 'session-a', code: 'HALF' }, 'booth'))).status, 409); cases++
    stub(prisma.voucher, 'findUnique', async () => ({ ...voucher, id: 'voucher-b', code: 'OTHER', tenantId: 'tenant-b' }))
    assert.equal((await redeem.POST(request('/api/payment/redeem', 'POST', { sessionId: 'session-a', code: 'OTHER' }, 'booth'))).status, 400); cases++
    assert.equal((await redeem.POST(request('/api/payment/redeem', 'POST', { sessionId: 'session-a', method: 'event' }, 'booth'))).status, 403); cases++
    // Device login must match both the key and the requested machine.
    stub(prisma.outlet, 'findFirst', async (args: any) => args.where.machineId === 'MACHINE-A' ? outlet : null)
    stub(prisma.apiKey, 'update', async () => ({}))
    assert.equal((await boothLogin.POST(request('/api/booth/login', 'POST', { machineId: 'MACHINE-B', apiKey: 'wrong-device-key' }))).status, 401); cases++
    // Revoked devices are rejected even if their signed cookie is still valid.
    stub(prisma.apiKey, 'findUnique', async () => ({ isActive: false }))
    assert.equal((await qris.POST(request('/api/payment/qris', 'POST', { sessionId: 'session-a' }, 'booth'))).status, 401); cases++
    stub(prisma.apiKey, 'findUnique', async () => ({ id: 'key-a', key: 'hashed', outletId: 'outlet-a', isActive: true, permissions: ['capture', 'upload', 'print'] }))
    // Production ignores demo mode even when explicitly set.
    const oldNodeEnv = process.env.NODE_ENV
    Object.assign(process.env, { NODE_ENV: 'production', DEMO_MODE: 'true' })
    assert.equal(demoPayments(), false)
    await assert.rejects(() => checkCharge('DEMO-order', 25000))
    assert.equal((await paymentStatus.GET(request('/api/payment/status?ref=DEMO-order', 'GET', undefined, 'booth'))).status, 409)
    Object.assign(process.env, { NODE_ENV: oldNodeEnv || 'test', DEMO_MODE: 'false' }); cases++
    // Printer has no simulated-success fallback.
    delete process.env.PRINTER_HOST
    assert.equal((await printer.POST(request('/api/print', 'POST', {}, 'booth'))).status, 503); cases++
    // JWT signing must fail when configuration is absent.
    delete process.env.JWT_SECRET
    assert.throws(() => signAuthToken({ userId: 'owner', email: 'x', tenantId: 'tenant-a', role: 'OWNER' })); cases++
    console.log(`PASS: ${cases} security regression cases (mocked database and gateway; no external writes)`)
  } finally {
    globalThis.fetch = originalFetch
    originals.reverse().forEach(restore => restore())
    await prisma.$disconnect()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
