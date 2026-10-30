'use client'
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Menu, Bell, Search, User, X, RefreshCw } from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { adminRequest } from '@/lib/admin-client'
type Notice = { id: string; title: string; message: string; module: string }
const searchable: Record<string, string> = {
  galleries: 'galeri',
  outlets: 'outlet',
  templates: 'template',
  users: 'anggota tim',
  vouchers: 'voucher',
  testimonials: 'testimoni',
  locations: 'lokasi',
}
export function Header() {
  const {
    toggleSidebar,
    searchQuery,
    setSearchQuery,
    activeModule,
    currentUser,
    branding,
    setActiveModule,
  } = useDashboardStore(
    useShallow((state) => ({
      toggleSidebar: state.toggleSidebar,
      searchQuery: state.searchQuery,
      setSearchQuery: state.setSearchQuery,
      activeModule: state.activeModule,
      currentUser: state.currentUser,
      branding: state.branding,
      setActiveModule: state.setActiveModule,
    }))
  )
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notices, setNotices] = useState<Notice[]>([])
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', key)
    }
  }, [open])
  const loadNotices = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await adminRequest('/api/admin/notifications')
      setNotices(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pemberitahuan gagal dimuat')
    } finally {
      setLoading(false)
    }
  }
  const role =
    currentUser?.role === 'MANAGER'
      ? 'Manager ? mode baca'
      : currentUser?.role === 'SUPER_ADMIN'
        ? 'Super admin'
        : 'Pemilik'
  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Buka atau tutup menu"
          onClick={toggleSidebar}
          className="rounded-lg p-2 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        {searchable[activeModule] && (
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              aria-label={`Cari ${searchable[activeModule]}`}
              placeholder={`Cari ${searchable[activeModule]}...`}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:w-64 dark:border-gray-700 dark:bg-gray-800"
            />
            {searchQuery && (
              <button
                aria-label="Hapus pencarian"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-3 text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="relative" ref={box}>
          <button
            aria-label="Pemberitahuan"
            aria-expanded={open}
            onClick={() => {
              const next = !open
              setOpen(next)
              if (next) void loadNotices()
            }}
            className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bell className="h-5 w-5" />
            {!!notices.length && (
              <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1 text-[10px] text-white">
                {notices.length}
              </span>
            )}
          </button>
          {open && (
            <div
              className="fixed right-4 top-16 z-50 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:absolute sm:right-0 sm:top-12 dark:border-gray-700 dark:bg-gray-900"
              aria-label="Daftar pemberitahuan"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Perlu perhatian</h2>
                <button
                  aria-label="Muat ulang pemberitahuan"
                  disabled={loading}
                  onClick={() => void loadNotices()}
                  className="rounded p-1 text-gray-500"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {loading ? (
                <p role="status" className="text-sm text-gray-500">
                  Memuat pemberitahuan...
                </p>
              ) : error ? (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              ) : !notices.length ? (
                <p className="text-sm text-gray-500">
                  Tidak ada hal yang memerlukan perhatian saat ini.
                </p>
              ) : (
                notices.map((notice) => (
                  <button
                    key={notice.id}
                    onClick={() => {
                      setActiveModule(notice.module)
                      setOpen(false)
                    }}
                    className="mb-2 block w-full rounded-lg border border-gray-100 p-3 text-left hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                  >
                    <p className="text-sm font-medium">{notice.title}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {notice.message}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <span className="hidden max-w-44 truncate rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 md:block dark:bg-purple-500/10 dark:text-purple-300">
          {branding.companyName || currentUser?.tenantName}
        </span>
        <div className="flex items-center gap-2" title={currentUser?.email}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
            <User className="h-4 w-4" />
          </span>
          <div className="hidden sm:block">
            <p className="max-w-36 truncate text-sm font-medium">
              {currentUser?.name || 'Pengguna'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
