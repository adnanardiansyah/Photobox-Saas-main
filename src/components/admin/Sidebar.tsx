'use client'

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
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
  Activity
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

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
  amber:   'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/20',
  pink:    'bg-pink-500/12 text-pink-600 dark:text-pink-400 border-pink-500/20',
  sky:     'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/20',
  gray:    'bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/15',
}

const dotStyle: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  pink:    'bg-pink-500',
  sky:     'bg-sky-500',
  gray:    'bg-gray-400 dark:bg-gray-500',
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

function SidebarItem({ icon: Icon, label, id, active, collapsed, badge, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`relative group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200
        ${collapsed ? 'justify-center' : ''}`}
    >
      {/* ── Active pill (shared layout for smooth slide) ─────── */}
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl"
          style={{
            backgroundColor: 'var(--active-bg)',
            boxShadow: 'inset 0 1px 0 var(--active-ring), 0 4px 14px rgba(0,0,0,0.05)',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      {!active && (
        <span
          className="absolute inset-0 rounded-xl bg-gray-900/[0.04] dark:bg-white/[0.04]
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      )}

      {/* ── Icon ─────────────────────────────────────────────── */}
      <motion.span
        className="relative z-10 flex-shrink-0"
        whileHover={{ rotate: active ? 0 : 6, scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      >
        <Icon
          className={`w-5 h-5 transition-colors duration-200 ${
            active ? 'text-[var(--active-color)]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
          }`}
        />
      </motion.span>

      {/* ── Label + Badge ─────────────────────────────────────── */}
      <motion.span
        className="relative z-10 flex-1 flex items-center gap-2 min-w-0 overflow-hidden"
        animate={{ width: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <span
          className={`whitespace-nowrap font-medium text-sm transition-colors ${
            active ? 'text-[var(--active-color)]' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
          }`}
        >
          {label}
        </span>
        {badge && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${badgeStyle[badge.tone]}`}>
            {badge.text}
          </span>
        )}
      </motion.span>

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
        <motion.span
          className="relative z-10 ml-auto"
          animate={{ opacity: active ? 1 : 0, x: active ? 0 : -4 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 text-[var(--active-color)] opacity-70" />
        </motion.span>
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
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.div
            key="divider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-px bg-gray-200 dark:bg-gray-800"
          />
        ) : (
          <motion.span
            key="label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
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
  } = useDashboardStore()

  const onlineOutlets      = outlets.filter(o => o.status === 'online').length
  const activeVouchers     = vouchers.filter(v => v.isActive).length
  const pendingTestimonials = testimonials.filter(t => !t.isApproved).length
  const activeUsers        = users.filter(u => u.status === 'active').length

  const groups: NavGroup[] = [
    {
      label: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'galleries',   label: 'Gallery',  icon: Images },
        { id: 'outlets',     label: 'Outlets',  icon: Store,  badge: { text: `${onlineOutlets} online`, tone: onlineOutlets > 0 ? 'emerald' : 'gray' } },
        { id: 'templates',   label: 'Templates', icon: ImageIcon, badge: { text: `${templates.length}`, tone: 'gray' } },
      ],
    },
    {
      label: 'Growth',
      items: [
        { id: 'vouchers',     label: 'Vouchers',     icon: TicketPercent,      badge: { text: `${activeVouchers}`, tone: 'amber' } },
        { id: 'testimonials', label: 'Testimonials', icon: MessageSquareHeart, badge: pendingTestimonials > 0 ? { text: `${pendingTestimonials}`, tone: 'pink' } : undefined },
        { id: 'locations',    label: 'Locations',    icon: MapPin },
      ],
    },
    {
      label: 'Insights',
      items: [
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'users',     label: 'Team',     icon: Users,     badge: { text: `${activeUsers}`, tone: 'sky' } },
        { id: 'settings',  label: 'Settings', icon: Settings2 },
      ],
    },
  ]

  return (
    <>
      {/* ── Sidebar Panel ─────────────────────────────────────── */}
      <aside
        className={`flex flex-col
                   fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
                   bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl
                   border-r border-gray-100 dark:border-gray-800
                   shadow-2xl shadow-gray-900/5 lg:shadow-none
                   transition-[width,transform] duration-300 ease-out
                   ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                   lg:translate-x-0
                   w-64 ${sidebarCollapsed ? 'lg:w-[4.75rem]' : 'lg:w-64'}
                   max-lg:w-64`}
        style={{
          '--active-color': branding.primaryColor,
          '--active-bg': `color-mix(in srgb, ${branding.primaryColor} 12%, transparent)`,
          '--active-ring': `color-mix(in srgb, ${branding.primaryColor} 30%, transparent)`,
        } as React.CSSProperties}
      >
        {/* ── Logo / Header ────────────────────────────────────── */}
        <div className="relative flex items-center h-16 px-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className={`flex items-center gap-2.5 min-w-0 ${sidebarCollapsed ? 'mx-auto' : 'flex-1'}`}>
            {/* Brand mark */}
            <motion.div
              whileHover={{ rotate: 12, scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className="relative w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
                boxShadow: `0 4px 14px color-mix(in srgb, ${branding.primaryColor} 40%, transparent)`,
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>

            {/* Brand text */}
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  key="brand-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="min-w-0 overflow-hidden whitespace-nowrap"
                >
                  <p className="text-sm font-bold leading-tight bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                    {branding.companyName || 'SnapNext'}
                  </p>
                  <p className="flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    <Activity className="w-2.5 h-2.5 text-emerald-500" />
                    Admin Console
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
            onClick={toggleSidebarCollapsed}
            title="Expand sidebar"
            className="absolute top-5 -right-3 z-20 hidden lg:flex w-6 h-6 items-center justify-center rounded-full
                       bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                       shadow-lg shadow-gray-900/10 text-gray-500 dark:text-gray-400
                       hover:text-gray-800 dark:hover:text-gray-200 hover:scale-105 transition-all"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </motion.button>
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
            title={sidebarCollapsed ? 'Toggle theme' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400
                       hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <motion.span
              key={darkMode ? 'sun' : 'moon'}
              initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {darkMode
                ? <Sun className="w-5 h-5 text-amber-400" />
                : <Moon className="w-5 h-5" />}
            </motion.span>
            {!sidebarCollapsed && <span className="text-sm font-medium whitespace-nowrap">Light Mode</span>}
          </button>

          {/* Logout */}
          <button
            onClick={async () => {
              try {
                await fetch('/api/admin/logout', { method: 'POST' })
                router.push('/admin/login')
              } catch (error) {
                console.error('[Logout] error:', error)
              }
            }}
            title={sidebarCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400
                       hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
                       transition-colors group ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            {!sidebarCollapsed && <span className="text-sm font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile Overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>
    </>
  )
}