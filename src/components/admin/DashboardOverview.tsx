'use client'

import { useMemo, type ComponentType } from 'react'
import {
  Store,
  Image,
  Users,
  Gift,
  DollarSign,
  Camera,
  Wifi,
  WifiOff,
  AlertCircle,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { WriteAccess } from './ui/WriteAccess'
import { useDashboardStore } from '@/lib/stores/dashboard-store'

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
type IconType = ComponentType<{ className?: string }>
const panelClass =
  'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6'

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  caption: string
  icon: IconType
  color: string
}) {
  return (
    <div className={`${panelClass} relative overflow-hidden`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-right text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {caption}
        </span>
      </div>
      <p className="mb-1 break-words text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ backgroundColor: color }} />
    </div>
  )
}

function MiniCard({
  icon: Icon,
  label,
  active,
  total,
  color,
}: {
  icon: IconType
  label: string
  active: number
  total: number
  color: string
}) {
  const percent = total > 0 ? Math.min(100, (active / total) * 100) : 0
  return (
    <div className={panelClass}>
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ color, backgroundColor: `${color}15` }}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
        {active.toLocaleString('id-ID')}{' '}
        <span className="text-lg font-medium text-gray-400">/ {total.toLocaleString('id-ID')}</span>
      </p>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Aktif {label.toLowerCase()}</p>
      <div className="h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function formatTime(dateString: string) {
  if (!dateString) return 'Belum ada heartbeat'
  const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return hours < 24
    ? `${hours} hour${hours > 1 ? 's' : ''} ago`
    : new Date(dateString).toLocaleDateString('id-ID')
}

export function DashboardOverview() {
  const { outlets, templates, users, vouchers, transactions, boothStatuses, photosToday } =
    useDashboardStore(
      useShallow((state) => ({
        outlets: state.outlets,
        templates: state.templates,
        users: state.users,
        vouchers: state.vouchers,
        transactions: state.transactions,
        boothStatuses: state.boothStatuses,
        photosToday: state.photosToday,
      }))
    )
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const todayRevenue = useMemo(() => {
    const start = new Date(`${today}T00:00:00+07:00`).getTime()
    const end = start + 86400000
    return transactions.reduce((sum, tx) => {
      const time = new Date(tx.createdAt).getTime()
      return tx.status === 'success' && time >= start && time < end ? sum + tx.amount : sum
    }, 0)
  }, [transactions, today])
  const outletNames = useMemo(
    () => new Map(outlets.map((outlet) => [outlet.id, outlet.name])),
    [outlets]
  )
  const activeOutlets = outlets.filter((outlet) => outlet.status === 'online').length
  const statCards = [
    {
      title: 'Total outlet',
      value: outlets.length.toLocaleString('id-ID'),
      caption: 'Outlet terdaftar',
      icon: Store,
      color: '#3b82f6',
    },
    {
      title: 'Outlet online',
      value: activeOutlets.toLocaleString('id-ID'),
      caption: 'Sedang aktif',
      icon: Wifi,
      color: '#22c55e',
    },
    {
      title: 'Pendapatan hari ini',
      value: currency.format(todayRevenue),
      caption: 'Transaksi terkonfirmasi hari ini',
      icon: DollarSign,
      color: '#a855f7',
    },
    {
      title: 'Foto hari ini',
      value: photosToday.toLocaleString('id-ID'),
      caption: 'Foto tersimpan hari ini',
      icon: Camera,
      color: '#ec4899',
    },
  ]
  const miniCards = [
    {
      icon: Image,
      label: 'Template',
      active: templates.filter((t) => t.isActive).length,
      total: templates.length,
      color: '#3b82f6',
    },
    {
      icon: Users,
      label: 'Tim',
      active: users.filter((u) => u.status === 'active').length,
      total: users.length,
      color: '#22c55e',
    },
    {
      icon: Gift,
      label: 'Voucher',
      active: vouchers.filter((v) => v.isActive).length,
      total: vouchers.length,
      color: '#a855f7',
    },
    {
      icon: Store,
      label: 'Outlet',
      active: activeOutlets,
      total: outlets.length,
      color: '#ec4899',
    },
  ]
  const actions = [
    { icon: Store, label: 'Tambah outlet', module: 'outlets', color: '#3b82f6' },
    { icon: Gift, label: 'Buat voucher', module: 'vouchers', color: '#a855f7' },
    { icon: Image, label: 'Unggah template', module: 'templates', color: '#22c55e' },
    { icon: Users, label: 'Tambah testimoni', module: 'testimonials', color: '#ec4899' },
  ]
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">
            Ringkasan
          </p>
          <h1 className="text-2xl font-bold">Ringkasan</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pantau ringkasan operasional usaha Anda.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Activity className="h-3.5 w-3.5" />
          Ringkasan
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {miniCards.map((card) => (
          <MiniCard key={card.label} {...card} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={panelClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Transaksi terbaru</h2>
            <button
              onClick={() => useDashboardStore.getState().setActiveModule('reports')}
              className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              Lihat semua <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {transactions.slice(0, 4).map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-gray-800"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{tx.id}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {outletNames.get(tx.outletId) || 'Tidak diketahui'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{currency.format(tx.amount)}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}
                >
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
          {!transactions.length && (
            <p className="py-6 text-sm text-gray-500 dark:text-gray-400">Belum ada transaksi.</p>
          )}
        </section>
        <section className={panelClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Status booth</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{activeOutlets} online</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {boothStatuses.map((booth) => {
              const online = booth.status === 'online'
              const error = booth.status === 'error'
              const Icon = online ? Wifi : error ? AlertCircle : WifiOff
              return (
                <div
                  key={booth.id}
                  className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-gray-800"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${online ? 'text-emerald-500' : error ? 'text-red-500' : 'text-gray-400'}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{booth.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Kabar perangkat terakhir: {formatTime(booth.lastPhoto)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${online ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : error ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}
                  >
                    {booth.status}
                  </span>
                </div>
              )
            })}
          </div>
          {!boothStatuses.length && (
            <p className="py-6 text-sm text-gray-500 dark:text-gray-400">Belum ada booth.</p>
          )}
        </section>
      </div>
      <WriteAccess>
        <section className={panelClass}>
          <h2 className="mb-4 font-semibold">Tindakan cepat</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {actions.map(({ icon: Icon, label, module, color }) => (
              <button
                key={module}
                onClick={() => useDashboardStore.getState().setActiveModule(module)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 p-5 text-sm font-medium text-gray-600 transition-colors duration-150 hover:border-purple-300 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-gray-700 dark:text-gray-300 dark:hover:border-purple-500 dark:hover:bg-purple-500/10"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ color, backgroundColor: `${color}15` }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </button>
            ))}
          </div>
        </section>
      </WriteAccess>
    </div>
  )
}
