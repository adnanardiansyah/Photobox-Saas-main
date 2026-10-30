'use client'
import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Download } from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { reportTransactions, transactionsCsv } from '@/lib/report-utils'
const money = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const panel =
  'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900'
export function ReportModule() {
  const { outlets, transactions } = useDashboardStore(
    useShallow((s) => ({ outlets: s.outlets, transactions: s.transactions }))
  )
  const [days, setDays] = useState(7)
  const [outletId, setOutletId] = useState('all')
  const filtered = useMemo(
    () => reportTransactions(transactions, days, outletId),
    [transactions, days, outletId]
  )
  const names = useMemo(() => new Map(outlets.map((o) => [o.id, o.name])), [outlets])
  const successful = filtered.filter((tx) => tx.status === 'success')
  const revenue = successful.reduce((sum, tx) => sum + tx.amount, 0)
  const chart = useMemo(() => {
    const now = new Date()
    const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const midnight = new Date(`${today}T00:00:00+07:00`).getTime()
    return Array.from({ length: 7 }, (_, index) => {
      const start = midnight - (6 - index) * 86400000
      return {
        label: new Date(start).toLocaleDateString('id-ID', {
          timeZone: 'Asia/Jakarta',
          day: 'numeric',
          month: 'short',
        }),
        revenue: successful.reduce((sum, tx) => {
          const time = new Date(tx.createdAt).getTime()
          return time >= start && time < start + 86400000 ? sum + tx.amount : sum
        }, 0),
      }
    })
  }, [successful])
  const maximum = Math.max(1, ...chart.map((d) => d.revenue))
  const exportReport = () => {
    const blob = new Blob([transactionsCsv(filtered, names)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-${days}-hari-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Laporan</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pendapatan dan transaksi sesuai periode serta outlet yang dipilih.
          </p>
        </div>
        <button
          onClick={exportReport}
          disabled={!filtered.length}
          title={
            filtered.length
              ? 'Unduh transaksi sesuai filter dalam format CSV'
              : 'Belum ada transaksi untuk diekspor'
          }
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Ekspor CSV
        </button>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="text-sm">
          Periode
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value={7}>7 hari terakhir</option>
            <option value={30}>30 hari terakhir</option>
            <option value={365}>365 hari terakhir</option>
          </select>
        </label>
        <label className="text-sm">
          Outlet
          <select
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
            className="mt-1 block rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">Semua outlet</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pendapatan terkonfirmasi', value: money.format(revenue) },
          { label: 'Transaksi berhasil', value: successful.length.toLocaleString('id-ID') },
          {
            label: 'Menunggu pembayaran',
            value: filtered.filter((t) => t.status === 'pending').length.toLocaleString('id-ID'),
          },
          { label: 'Total transaksi', value: filtered.length.toLocaleString('id-ID') },
        ].map((stat) => (
          <div key={stat.label} className={panel}>
            <p className="break-words text-2xl font-bold">{stat.value}</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>
      <section className={panel}>
        <h2 className="font-semibold">Pendapatan harian ? 7 hari terakhir</h2>
        <p className="mt-1 text-xs text-gray-500">
          Waktu Jakarta. Mengikuti pilihan outlet dan hanya menghitung transaksi berhasil.
        </p>
        {chart.every((d) => !d.revenue) ? (
          <p className="py-12 text-center text-sm text-gray-500">
            Belum ada transaksi berhasil dalam tujuh hari terakhir.
          </p>
        ) : (
          <div className="mt-6 flex h-56 items-end gap-2">
            {chart.map((day) => (
              <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  title={money.format(day.revenue)}
                  className="w-full rounded-t-lg bg-purple-500"
                  style={{ height: `${Math.max(2, (day.revenue / maximum) * 170)}px` }}
                />
                <span className="text-center text-[10px] text-gray-500 sm:text-xs">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className={`${panel} overflow-x-auto`}>
        <h2 className="mb-4 font-semibold">Transaksi sesuai filter</h2>
        {!filtered.length ? (
          <p className="py-8 text-sm text-gray-500">
            Tidak ada transaksi pada periode dan outlet ini. Coba ubah filter.
          </p>
        ) : (
          <>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
                  <th className="py-3 pr-3">Transaksi / waktu Jakarta</th>
                  <th className="pr-3">Outlet</th>
                  <th className="pr-3">Jumlah</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="py-3 pr-3">
                      <p className="font-medium">{tx.id}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                        })}
                      </p>
                    </td>
                    <td className="pr-3">{names.get(tx.outletId) || tx.outletId}</td>
                    <td className="pr-3">{money.format(tx.amount)}</td>
                    <td>
                      {(
                        {
                          success: 'Berhasil',
                          pending: 'Menunggu',
                          failed: 'Gagal',
                          refunded: 'Dikembalikan',
                        } as Record<string, string>
                      )[tx.status] || tx.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <p className="mt-3 text-xs text-gray-500">
                Menampilkan 100 dari {filtered.length} transaksi. Ekspor CSV untuk mengunduh seluruh
                hasil filter.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
