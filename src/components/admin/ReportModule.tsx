'use client'

import { useShallow } from 'zustand/react/shallow'

import { useState, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Camera,
  Store,
  Download,
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'


// ============================================
// Report Module Component
// ============================================

export function ReportModule() {
  const { outlets, transactions, templates } = useDashboardStore(useShallow(state => ({ outlets: state.outlets, transactions: state.transactions, templates: state.templates })))
  const [dateRange, setDateRange] = useState('week')
  const [selectedOutlet, setSelectedOutlet] = useState('all')

  // ============================================
  // Filter transactions by date range & outlet
  // ============================================
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    let startDate: Date

    if (dateRange === 'week') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
    } else if (dateRange === 'month') {
      startDate = new Date(now)
      startDate.setMonth(now.getMonth() - 1)
    } else {
      startDate = new Date(now)
      startDate.setFullYear(now.getFullYear() - 1)
    }

    return transactions.filter(t => {
      const txDate = new Date(t.createdAt)
      const inRange = txDate >= startDate
      const inOutlet = selectedOutlet === 'all' || t.outletId === selectedOutlet
      return inRange && inOutlet
    })
  }, [transactions, dateRange, selectedOutlet])

  // ============================================
  // Stats dari data real
  // ============================================
  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalPhotos = filteredTransactions.filter(t => t.status === 'success').length
  const activeOutlets = outlets.filter(o => o.status === 'online').length

  // ============================================
  // Generate chart data dari transaksi real
  // ============================================
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayMap: Record<string, { revenue: number; photos: number }> = {}

    // Init 7 hari terakhir
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = days[d.getDay()]
      const dateKey = `${key}-${d.getDate()}`
      dayMap[dateKey] = { revenue: 0, photos: 0 }
    }

    // Isi dengan data transaksi
    filteredTransactions
      .filter(t => t.status === 'success')
      .forEach(t => {
        const d = new Date(t.createdAt)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays <= 6) {
          const key = `${days[d.getDay()]}-${d.getDate()}`
          if (dayMap[key]) {
            dayMap[key].revenue += t.amount
            dayMap[key].photos += 1
          }
        }
      })

    // Convert ke array dengan label hari
    return Object.entries(dayMap).map(([key, value]) => ({
      day: key.split('-')[0],
      revenue: value.revenue,
      photos: value.photos,
    }))
  }, [filteredTransactions])

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-500 dark:text-gray-400">Analytics and performance reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        <select
          value={selectedOutlet}
          onChange={(e) => setSelectedOutlet(e.target.value)}
          className="px-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Outlets</option>
          {outlets.map((outlet) => (
            <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>+15%</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{formatPrice(totalRevenue)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
        </div>

        <div
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Camera className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>+8%</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalPhotos}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
        </div>

        <div
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>+2</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{activeOutlets}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Outlets</p>
        </div>

        <div
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <BarChart3 className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="flex items-center gap-1 text-sm text-red-600">
              <TrendingDown className="w-4 h-4" />
              <span>-3%</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{templates.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Templates</p>
        </div>
      </div>

      {/* Weekly Revenue Chart */}
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
      >
        <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Weekly Revenue</h2>

        {chartData.every(d => d.revenue === 0) ? (
          // Empty state kalau belum ada transaksi
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
            <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Belum ada transaksi minggu ini</p>
            <p className="text-xs mt-1 opacity-70">Data akan muncul setelah ada pembayaran berhasil</p>
          </div>
        ) : (
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((data) => (
              <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: '220px' }}>
                  {data.revenue > 0 && (
                    <span className="text-xs text-gray-500 mb-1">
                      {formatPrice(data.revenue).replace('Rp\u00a0', 'Rp ')}
                    </span>
                  )}
                  <div
                    className="w-full bg-purple-500 rounded-t-lg transition-colors duration-150 hover:bg-purple-600 cursor-pointer"
                    style={{
                      height: `${Math.max((data.revenue / maxRevenue) * 180, data.revenue > 0 ? 4 : 0)}px`
                    }}
                    title={`${data.day}: ${formatPrice(data.revenue)}`}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{data.day}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Transactions</h2>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-600">
            <p className="text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Outlet</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="border-b dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-900 dark:text-white">
                      {tx.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {outlets.find(o => o.id === tx.outletId)?.name || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatPrice(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 uppercase">
                      {tx.paymentMethod || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === 'success'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : tx.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
