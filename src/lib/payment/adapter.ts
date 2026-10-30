import { createCharge, demoPayments } from './server'
export interface PaymentParams { amount: number; orderId: string; customerEmail?: string; customerPhone?: string; description?: string; callbackUrl?: string }
export interface PaymentResult { success: boolean; transactionRef?: string; paymentUrl?: string; qrisString?: string; expiresAt?: Date; error?: string }
export interface PaymentStatusResult { success: boolean; status: 'pending' | 'success' | 'failed' | 'refunded'; paidAt?: Date; error?: string }
export interface RefundResult { success: boolean; refundId?: string; error?: string }
export interface PaymentGateway { createPayment(params: PaymentParams): Promise<PaymentResult>; checkPayment(transactionRef: string): Promise<PaymentStatusResult>; refund(transactionRef: string, amount?: number): Promise<RefundResult> }
export type PaymentProvider = 'tokopay' | 'midtrans' | 'doku' | 'qris'
// Use the server payment routes: verification requires the stored transaction amount.
export function getPaymentGateway(provider: PaymentProvider): PaymentGateway {
  if (provider !== 'midtrans') throw new Error('Only verified Midtrans QRIS is supported')
  return new MidtransAdapter()
}
export class MidtransAdapter implements PaymentGateway {
  async createPayment(params: PaymentParams): Promise<PaymentResult> {
    const charge = await createCharge(params.orderId, params.amount)
    return { success: true, transactionRef: params.orderId, qrisString: charge.qr, expiresAt: charge.expiresAt }
  }
  async checkPayment(_ref: string): Promise<PaymentStatusResult> {
    throw new Error('Use /api/payment/status to verify against the stored transaction amount')
  }
  async refund(): Promise<RefundResult> { return { success: false, error: 'Refund requires manual provider processing' } }
}
export class DemoPaymentAdapter extends MidtransAdapter {
  constructor() { super(); if (!demoPayments()) throw new Error('Demo payments require DEMO_MODE=true outside production') }
}
