import type { Transaction } from '@/lib/stores/dashboard-store'
export function reportTransactions(
  transactions: Transaction[],
  days: number,
  outletId: string,
  now = Date.now()
) {
  const start = now - days * 86400000
  return transactions.filter((tx) => {
    const time = new Date(tx.createdAt).getTime()
    return time >= start && time <= now && (outletId === 'all' || tx.outletId === outletId)
  })
}
export function csvCell(value: unknown) {
  let text = String(value ?? '')
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text
  return '"' + text.replace(/"/g, '""') + '"'
}
export function transactionsCsv(transactions: Transaction[], outletNames: Map<string, string>) {
  const rows = [
    [
      'ID transaksi',
      'Waktu (Asia/Jakarta)',
      'Outlet',
      'Jumlah (Rp)',
      'Metode pembayaran',
      'Status',
    ],
    ...transactions.map((tx) => [
      tx.id,
      new Date(tx.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false }),
      outletNames.get(tx.outletId) || tx.outletId,
      tx.amount,
      tx.paymentMethod,
      tx.status,
    ]),
  ]
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}
