'use client'

import { useShallow } from 'zustand/react/shallow'

import {
  LayoutDashboard,
  Images,
  Store,
  Image as ImageIcon,
  Users,
  TicketPercent,
  MessageSquareHeart,
  MapPin,
  BarChart3,
  Settings2,
  ChevronRight,
  X,
  LogOut,
  Moon,
  Sun,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { useRouter } from 'next/navigation'

// ============================================
// Types
// ============================================

type BadgeTone = 'emerald' | 'amber' | 'pink' | 'sky' | 'gray'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: { text: string; tone: BadgeTone }
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const badgeStyle: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/20',
  pink: 'bg-pink-500/12 text-pink-600 dark:text-pink-400 border-pink-500/20',
  sky: 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/20',
  gray: 'bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/15',
}

const dotStyle: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  pink: 'bg-pink-500',
  sky: 'bg-sky-500',
  gray: 'bg-gray-400 dark:bg-gray-500',
}

// ============================================
// Sidebar Item — grouped, with live badge
// ============================================

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  id: string
  active?: boolean
  collapsed?: boolean
  badge?: NavItem['badge']
  onClick: () => void
}

function SidebarItem({
  icon: Icon,
  label,
  id,
  active,
  collapsed,
  badge,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`relative group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200
        ${collapsed ? 'justify-center' : ''}`}
    >
      {/* ── Active pill (shared layout for smooth slide) ─────── */}
      {active && (
        <span
          className="absolute inset-0 rounded-xl"
          style={{
            backgroundColor: 'var(--active-bg)',
            boxShadow: 'inset 0 1px 0 var(--active-ring), 0 4px 14px rgba(0,0,0,0.05)',
          }}
        />
      )}
      {!active && (
        <span
          className="absolute inset-0 rounded-xl bg-gray-900/[0.04] dark:bg-white/[0.04]
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      )}

      {/* ── Icon ─────────────────────────────────────────────── */}
      <span className="relative z-10 flex-shrink-0">
        <Icon
          className={`w-5 h-5 transition-colors duration-200 ${
            active
              ? 'text-[var(--active-color)]'
              : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
          }`}
        />
      </span>

      {/* ── Label + Badge ─────────────────────────────────────── */}
      <span
        className={`relative z-10 flex-1 items-center gap-2 min-w-0 overflow-hidden ${collapsed ? 'hidden' : 'flex'}`}
      >
        <span
          className={`whitespace-nowrap font-medium text-sm transition-colors ${
            active
              ? 'text-[var(--active-color)]'
              : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
          }`}
        >
          {label}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${badgeStyle[badge.tone]}`}
          >
            {badge.text}
          </span>
        )}
      </span>

      {/* ── Active chevron / count signal ─────────────────────── */}
      {collapsed ? (
        badge && (
          <span
            className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${dotStyle[badge.tone]} ${
              active ? 'opacity-100' : 'opacity-70'
            }`}
          />
        )
      ) : (
        <span className={`relative z-10 ml-auto ${active ? '' : 'invisible'}`}>
          <ChevronRight className="w-4 h-4 text-[var(--active-color)] opacity-70" />
        </span>
      )}
    </button>
  )
}

// ============================================
// Section label — collapses to a divider
// ============================================

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-1.5 px-3">
      {collapsed ? (
        <div key="divider" className="w-full h-px bg-gray-200 dark:bg-gray-800" />
      ) : (
        <span
          key="label"
          className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
        >
          {label}
        </span>
      )}
    </div>
  )
}

// ============================================
// Sidebar Component
// ============================================

export function Sidebar() {
  const router = useRouter()
  const {
    sidebarOpen,
    toggleSidebar,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    activeModule,
    setActiveModule,
    darkMode,
    toggleDarkMode,
    branding,
    outlets,
    templates,
    vouchers,
    testimonials,
    users,
  } = useDashboardStore(
    useShallow((state) => ({
      sidebarOpen: state.sidebarOpen,
      toggleSidebar: state.toggleSidebar,
      sidebarCollapsed: state.sidebarCollapsed,
      toggleSidebarCollapsed: state.toggleSidebarCollapsed,
      activeModule: state.activeModule,
      setActiveModule: state.setActiveModule,
      darkMode: state.darkMode,
      toggleDarkMode: state.toggleDarkMode,
      branding: state.branding,
      outlets: state.outlets,
      templates: state.templates,
      vouchers: state.vouchers,
      testimonials: state.testimonials,
      users: state.users,
    }))
  )

  const onlineOutlets = outlets.filter((o) => o.status === 'online').length
  const activeVouchers = vouchers.filter((v) => v.isActive).length
  const pendingTestimonials = testimonials.filter((t) => !t.isApproved).length
  const activeUsers = users.filter((u) => u.status === 'active').length

  const groups: NavGroup[] = [
    {
      label: 'Utama',
      items: [{ id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard }],
    },
    {
      label: 'Operasional',
      items: [
        { id: 'galleries', label: 'Galeri', icon: Images },
        {
          id: 'outlets',
          label: 'Outlet',
          icon: Store,
          badge: { text: `${onlineOutlets} online`, tone: onlineOutlets > 0 ? 'emerald' : 'gray' },
        },
        {
          id: 'templates',
          label: 'Template',
          icon: ImageIcon,
          badge: { text: `${templates.length}`, tone: 'gray' },
        },
      ],
    },
    {
      label: 'Pemasaran',
      items: [
        {
          id: 'vouchers',
          label: 'Voucher',
          icon: TicketPercent,
          badge: { text: `${activeVouchers}`, tone: 'amber' },
        },
        {
          id: 'testimonials',
          label: 'Testimoni',
          icon: MessageSquareHeart,
          badge:
            pendingTestimonials > 0 ? { text: `${pendingTestimonials}`, tone: 'pink' } : undefined,
        },
        { id: 'locations', label: 'Lokasi', icon: MapPin },
      ],
    },
    {
      label: 'Analisis',
      items: [{ id: 'reports', label: 'Laporan', icon: BarChart3 }],
    },
    {
      label: 'Administrasi',
      items: [
        { id: 'users', label: 'Tim', icon: Users, badge: { text: `${activeUsers}`, tone: 'sky' } },
        { id: 'settings', label: 'Identitas usaha', icon: Settings2 },
      ],
    },
  ]

  return (
    <>
      {/* ── Sidebar Panel ─────────────────────────────────────── */}
      <aside
        className={`flex flex-col
                   fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
                   bg-white dark:bg-gray-900
                   border-r border-gray-100 dark:border-gray-800
                   shadow-2xl shadow-gray-900/5 lg:shadow-none
                   transition-transform duration-150 ease-out
                   ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                   lg:translate-x-0
                   w-64 ${sidebarCollapsed ? 'lg:w-[4.75rem]' : 'lg:w-64'}
                   max-lg:w-64`}
        style={
          {
            '--active-color': branding.primaryColor,
            '--active-bg': `color-mix(in srgb, ${branding.primaryColor} 12%, transparent)`,
            '--active-ring': `color-mix(in srgb, ${branding.primaryColor} 30%, transparent)`,
          } as React.CSSProperties
        }
      >
        {/* ── Logo / Header ────────────────────────────────────── */}
        <div className="relative flex items-center h-16 px-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div
            className={`flex items-center gap-2.5 min-w-0 ${sidebarCollapsed ? 'mx-auto' : 'flex-1'}`}
          >
            <BrandLogo
              logoUrl={branding.logoUrl}
              companyName={branding.companyName}
              compact={sidebarCollapsed}
              className={sidebarCollapsed ? 'h-9 w-9' : 'h-10 w-auto max-w-[10rem]'}
            />
          </div>

          {/* Close (mobile) — shown only when expanded */}
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ml-2"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}

          {/* Collapse toggle (desktop) — shown only when expanded */}
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebarCollapsed}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-2"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Floating re-expand button — shown only when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebarCollapsed}
            title="Expand sidebar"
            className="absolute top-5 -right-3 z-20 hidden lg:flex w-6 h-6 items-center justify-center rounded-full
                       bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                       shadow-lg shadow-gray-900/10 text-gray-500 dark:text-gray-400
                       hover:text-gray-800 dark:hover:text-gray-200 hover:scale-105 transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* ── Navigation ───────────────────────────────────────── */}
        <nav className="flex-1 px-3 pb-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {groups.map((group) => (
            <div key={group.label}>
              <SectionLabel label={group.label} collapsed={sidebarCollapsed} />
              <div className="space-y-0.5 mb-1">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    id={item.id}
                    badge={item.badge}
                    active={activeModule === item.id}
                    collapsed={sidebarCollapsed}
                    onClick={() => setActiveModule(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Bottom Actions ───────────────────────────────────── */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-0.5 flex-shrink-0">
          {/* Dark mode */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            aria-label={darkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400
                       hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <span key={darkMode ? 'moon' : 'sun'}>
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </span>
            {!sidebarCollapsed && (
              <span className="text-sm font-medium whitespace-nowrap">
                {darkMode ? 'Mode gelap' : 'Mode terang'}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/logout', { method: 'POST' })
                if (!response.ok) throw new Error('Logout gagal')
                useDashboardStore.getState().clearAdminSession()
                router.push('/admin/login')
              } catch (error) {
                console.error('[Logout] error:', error)
              }
            }}
            title={sidebarCollapsed ? 'Keluar' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400
                       hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
                       transition-colors group ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium whitespace-nowrap">Keluar</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile Overlay ─────────────────────────────────────── */}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={toggleSidebar} />
      )}
    </>
  )
}
