import { ApiError } from '@/lib/api-security'
export function demoPayments() { return process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE === 'true' }
function config() {
  if ((process.env.PAYMENT_PROVIDER || 'midtrans') !== 'midtrans') throw new ApiError(503, 'Gateway ini belum didukung untuk transaksi nyata. Konfigurasikan Midtrans.')
  const key = process.env.MIDTRANS_SERVER_KEY
  if (!key) throw new ApiError(503, 'Gateway pembayaran belum dikonfigurasi')
  return { base: process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com', authorization: `Basic ${Buffer.from(key + ':').toString('base64')}` }
}
async function midtrans(path: string, body?: unknown) {
  const { base, authorization } = config()
  const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { Authorization: authorization, 'Content-Type': 'application/json', Accept: 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000), cache: 'no-store' })
  const data = await response.json()
  if (!response.ok || !['200', '201', '202'].includes(String(data.status_code))) throw new ApiError(502, 'Gateway belum dapat memproses pembayaran')
  return data
}
export async function createCharge(orderId: string, amount: number) {
  if (demoPayments()) return { qr: `demo://qris?order=${orderId}&amount=${amount}`, expiresAt: new Date(Date.now() + 15 * 60000) }
  const data = await midtrans('/v2/charge', { payment_type: 'qris', transaction_details: { order_id: orderId, gross_amount: amount } })
  if (data.order_id !== orderId || Number(data.gross_amount) !== amount || typeof data.qr_string !== 'string') throw new ApiError(502, 'Respons gateway tidak valid')
  return { qr: data.qr_string, expiresAt: new Date(Date.now() + 15 * 60000) }
}
export async function checkCharge(orderId: string, amount: number) {
  if (demoPayments() && orderId.startsWith('DEMO-')) return 'success' as const
  if (orderId.startsWith('DEMO-')) throw new ApiError(409, 'Transaksi demo tidak berlaku di produksi')
  const data = await midtrans(`/v2/${encodeURIComponent(orderId)}/status`)
  if (data.order_id !== orderId || Number(data.gross_amount) !== amount || data.currency !== 'IDR' || data.payment_type !== 'qris') throw new ApiError(502, 'Data pembayaran tidak cocok')
  if (data.transaction_status === 'settlement' && (!data.fraud_status || data.fraud_status === 'accept')) return 'success' as const
  if (['expire', 'deny', 'cancel', 'failure'].includes(data.transaction_status)) return 'failed' as const
  return 'pending' as const
}
