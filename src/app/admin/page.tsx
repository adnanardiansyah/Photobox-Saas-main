'use client'

import { useEffect, useState, type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { Sidebar } from '@/components/admin/Sidebar'
import { Header } from '@/components/admin/Header'
import { DashboardOverview } from '@/components/admin/DashboardOverview'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { Toaster, toast } from 'sonner'

function ModuleLoading() {
  return (
    <div
      role="status"
      className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
    >
      Memuat menu...
    </div>
  )
}

// Load management screens only when they are opened.
const modules: Record<string, ComponentType> = {
  dashboard: DashboardOverview,
  galleries: dynamic(
    () => import('@/components/admin/GalleryModule').then((m) => m.GalleryModule),
    { loading: ModuleLoading }
  ),
  outlets: dynamic(() => import('@/components/admin/OutletModule').then((m) => m.OutletModule), {
    loading: ModuleLoading,
  }),
  templates: dynamic(
    () => import('@/components/admin/TemplateModule').then((m) => m.TemplateModule),
    { loading: ModuleLoading }
  ),
  users: dynamic(() => import('@/components/admin/UserModule').then((m) => m.UserModule), {
    loading: ModuleLoading,
  }),
  vouchers: dynamic(() => import('@/components/admin/VoucherModule').then((m) => m.VoucherModule), {
    loading: ModuleLoading,
  }),
  testimonials: dynamic(
    () => import('@/components/admin/TestimonialModule').then((m) => m.TestimonialModule),
    { loading: ModuleLoading }
  ),
  settings: dynamic(
    () => import('@/components/admin/BrandingModule').then((m) => m.BrandingModule),
    { loading: ModuleLoading }
  ),
  locations: dynamic(
    () => import('@/components/admin/LocationModule').then((m) => m.LocationModule),
    { loading: ModuleLoading }
  ),
  reports: dynamic(() => import('@/components/admin/ReportModule').then((m) => m.ReportModule), {
    loading: ModuleLoading,
  }),
}

export default function AdminPage() {
  const router = useRouter()
  const { activeModule, darkMode } = useDashboardStore(
    useShallow((state) => ({ activeModule: state.activeModule, darkMode: state.darkMode }))
  )
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin/session', { credentials: 'include' })
        const data = await response.json()
        if (cancelled) return
        if (!response.ok || !data.authenticated) {
          router.replace('/admin/login')
          return
        }
        setIsChecking(false)
      } catch {
        if (!cancelled) router.replace('/admin/login')
      }
    }
    checkSession()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    // Other modules load their own data; avoid fetching a year of transactions for every menu click.
    if (!isChecking && ['dashboard', 'reports', 'locations'].includes(activeModule)) {
      useDashboardStore
        .getState()
        .refreshDashboard()
        .catch((error) => toast.error(error.message))
    }
  }, [isChecking, activeModule])

  if (isChecking)
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div
          className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center"
          role="status"
        >
          <div className="admin-loading-spinner mx-auto mb-4 h-8 w-8 rounded-full border-2 border-purple-500/30 border-t-purple-500" />
          <p className="font-semibold">Memeriksa autentikasi...</p>
        </div>
      </div>
    )

  const ActiveModule = modules[activeModule] || DashboardOverview
  return (
    <div className="admin-shell relative flex h-screen bg-slate-50 text-gray-900 dark:bg-slate-950 dark:text-white">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div key={activeModule} className="admin-module-enter">
            <ActiveModule />
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors theme={darkMode ? 'dark' : 'light'} />
    </div>
  )
}
