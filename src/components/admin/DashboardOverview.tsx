'use client'

import { useRef, useState, useEffect } from 'react'
import { 
  Store, 
  Image, 
  Users, 
  Gift, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Camera,
  Wifi,
  WifiOff,
  AlertCircle,
  ArrowRight,
  Zap,
  Activity
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { motion, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const

// ============================================
// Animated number counter
// ============================================
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1.2 }: {
  value: number; prefix?: string; suffix?: string; duration?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (isInView) motionVal.set(value)
  }, [isInView, value, motionVal])

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)))
    return unsub
  }, [spring])

  return (
    <span ref={ref}>
      {prefix}{display.toLocaleString('id-ID')}{suffix}
    </span>
  )
}

// ============================================
// Premium Stat Card — gradient + glow
// ============================================
interface StatCardProps {
  title: string
  value: string | number
  numericValue?: number
  change?: string
  positive?: boolean
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  glowColor: string
  index: number
  prefix?: string
  suffix?: string
}

function StatCard({ title, value, numericValue, change, positive, icon: Icon, gradient, glowColor, index, prefix, suffix }: StatCardProps) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl p-6 overflow-hidden cursor-default"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: hovered ? 1 : 0.7 }}
        transition={{ duration: 0.3 }}
        style={{ background: gradient }}
      />

      {/* Glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ boxShadow: hovered ? `0 0 40px ${glowColor}35, inset 0 1px 0 rgba(255,255,255,0.15)` : `0 0 0px transparent, inset 0 1px 0 rgba(255,255,255,0.08)` }}
        transition={{ duration: 0.35 }}
      />

      {/* Shine top border */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${glowColor}60, transparent)` }} />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <motion.div
            animate={{ scale: hovered ? 1.1 : 1, rotate: hovered ? 8 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${glowColor}25`, boxShadow: `0 4px 16px ${glowColor}30` }}
          >
            <Icon className="w-6 h-6 text-white dark:text-white" />
          </motion.div>

          {/* Change badge */}
          {change && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.08 + 0.3 }}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                positive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/15 text-red-600 dark:text-red-400'
              }`}
            >
              {positive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {change}
            </motion.div>
          )}
        </div>

        {/* Value */}
        <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
          {numericValue !== undefined
            ? <AnimatedNumber value={numericValue} prefix={prefix} suffix={suffix} />
            : value
          }
        </p>
        <p className="text-sm text-gray-600 dark:text-white/50 font-medium">{title}</p>

        {/* Bottom activity bar */}
        <motion.div
          className="mt-4 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.08)' }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: positive !== false ? '75%' : '35%' } : {}}
            transition={{ duration: 1, delay: index * 0.08 + 0.4, ease }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${glowColor}80, ${glowColor})` }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================
// Secondary mini stat card
// ============================================
function MiniCard({ icon: Icon, label, active, total, color, index }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; active: number; total: number
  color: string; index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [hovered, setHovered] = useState(false)
  const pct = total > 0 ? (active / total) * 100 : 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: 0.3 + index * 0.07, ease }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -3 }}
      className="relative rounded-2xl p-5 overflow-hidden bg-white/60 dark:bg-transparent"
      style={{
        border: `1px solid ${hovered ? color + '40' : 'rgba(0,0,0,0.08)'}`,
        transition: 'border-color 0.25s',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{ scale: hovered ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <span style={{ color }}><Icon className="w-[18px] h-[18px]" /></span>
        </motion.div>
        <span className="text-sm font-medium text-gray-500 dark:text-white/50">{label}</span>
      </div>

      <p className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">
        <AnimatedNumber value={active} />{' '}
        <span className="text-gray-400 dark:text-white/30 text-lg font-semibold">/ {total}</span>
      </p>
      <p className="text-xs text-gray-400 dark:text-white/35 mb-3">Active {label.toLowerCase()}</p>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden bg-black/5 dark:bg-white/7">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${pct}%` } : {}}
          transition={{ duration: 0.9, delay: 0.4 + index * 0.07, ease }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  )
}

// ============================================
// Transaction row
// ============================================
function TxRow({ id, outlet, amount, status, index, formatPrice }: {
  id: string; outlet: string; amount: number
  status: string; index: number; formatPrice: (n: number) => string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.5 + index * 0.07, ease }}
      className="flex items-center justify-between py-3 border-b last:border-0 border-black/5 dark:border-white/6"
    >
      <div>
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{id}</p>
        <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{outlet}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900 dark:text-white text-sm">{formatPrice(amount)}</p>
        <motion.span
          className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 font-semibold ${
            status === 'success'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}
        >
          {status}
        </motion.span>
      </div>
    </motion.div>
  )
}

// ============================================
// Booth status row
// ============================================
function BoothRow({ name, lastPhoto, status, index, formatTime }: {
  name: string; lastPhoto: string; status: string; index: number; formatTime: (s: string) => string
}) {
  const statusConfig = {
    online:  { icon: Wifi,        color: '#22c55e', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', label: 'online'  },
    offline: { icon: WifiOff,     color: '#6B7280', bg: 'bg-gray-500/15',    text: 'text-gray-500 dark:text-gray-400',       label: 'offline' },
    error:   { icon: AlertCircle, color: '#ef4444', bg: 'bg-red-500/15',     text: 'text-red-600 dark:text-red-400',         label: 'error'   },
  }
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline
  const StatusIcon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.55 + index * 0.07, ease }}
      className="flex items-center justify-between py-3 border-b last:border-0 border-black/5 dark:border-white/6"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: status === 'online' ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
        </motion.div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{name}</p>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Last photo: {formatTime(lastPhoto)}</p>
        </div>
      </div>
      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text} flex items-center gap-1.5`}>
        {status === 'online' && (
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}
        {cfg.label}
      </span>
    </motion.div>
  )
}

// ============================================
// Quick Action button
// ============================================
function QuickAction({ icon: Icon, label, module, color, index }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; module: string; color: string; index: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.7 + index * 0.07, ease }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => useDashboardStore.getState().setActiveModule(module)}
      className="relative flex flex-col items-center gap-3 p-5 rounded-2xl overflow-hidden text-center"
      style={{
        background: hovered ? `${color}12` : 'rgba(0,0,0,0.02)',
        border: `1.5px dashed ${hovered ? color + '60' : 'rgba(0,0,0,0.1)'}`,
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <motion.div
        animate={{ scale: hovered ? 1.15 : 1, rotate: hovered ? 10 : 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 16 }}
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}20`, boxShadow: hovered ? `0 6px 20px ${color}30` : 'none' }}
      >
        <span style={{ color }}><Icon className="w-6 h-6" /></span>
      </motion.div>
      <span className="text-sm font-semibold text-gray-500 dark:text-white/60">{label}</span>
      <motion.div
        animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 4 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-2 right-2"
      >
        <span style={{ color }}><ArrowRight className="w-3.5 h-3.5" /></span>
      </motion.div>
    </motion.button>
  )
}

// ============================================
// DashboardOverview — Full Premium
// ============================================
export function DashboardOverview() {
  const { outlets, templates, users, vouchers, transactions, boothStatuses, photosToday } = useDashboardStore()

  const totalOutlets    = outlets.length
  const activeOutlets   = outlets.filter(o => o.status === 'online').length
  const totalTemplates  = templates.length
  const activeTemplates = templates.filter(t => t.isActive).length
  const totalUsers      = users.length
  const activeUsers     = users.filter(u => u.status === 'active').length
  const totalVouchers   = vouchers.length
  const activeVouchers  = vouchers.filter(v => v.isActive).length
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const todayRevenue = transactions.filter(t => t.status === 'success' && new Date(t.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === today).reduce((sum, t) => sum + t.amount, 0)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Belum ada heartbeat'
    const diff = Date.now() - new Date(dateString).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const statCards = [
    {
      title: 'Total Outlets', value: totalOutlets, numericValue: totalOutlets,
      change: 'Outlet terdaftar', positive: true, icon: Store,
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.08) 100%)',
      glowColor: '#3b82f6',
    },
    {
      title: 'Online Outlets', value: activeOutlets, numericValue: activeOutlets,
      change: 'Currently active', positive: true, icon: Wifi,
      gradient: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(22,163,74,0.08) 100%)',
      glowColor: '#22c55e',
    },
    {
      title: 'Revenue Today', value: formatPrice(todayRevenue), numericValue: undefined,
      change: 'Transaksi terkonfirmasi hari ini', positive: true, icon: DollarSign,
      gradient: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(126,34,206,0.08) 100%)',
      glowColor: '#a855f7',
    },
    {
      title: 'Photos Today', value: photosToday, numericValue: photosToday,
      change: 'Foto tersimpan hari ini', positive: false, icon: Camera,
      gradient: 'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(190,24,93,0.08) 100%)',
      glowColor: '#ec4899',
    },
  ]

  const miniCards = [
    { icon: Image,  label: 'Templates', active: activeTemplates, total: totalTemplates, color: '#3b82f6' },
    { icon: Users,  label: 'Users',     active: activeUsers,     total: totalUsers,     color: '#22c55e' },
    { icon: Gift,   label: 'Vouchers',  active: activeVouchers,  total: totalVouchers,  color: '#a855f7' },
    { icon: Store,  label: 'Outlets',   active: activeOutlets,   total: totalOutlets,   color: '#ec4899' },
  ]

  const quickActions = [
    { icon: Store, label: 'Add Outlet',      module: 'outlets',      color: '#3b82f6' },
    { icon: Gift,  label: 'Create Voucher',  module: 'vouchers',     color: '#a855f7' },
    { icon: Image, label: 'Upload Template', module: 'templates',    color: '#22c55e' },
    { icon: Users, label: 'Add Testimonial', module: 'testimonials', color: '#ec4899' },
  ]

  return (
    <div className="space-y-6 relative">

      {/* ── Page Header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Zap className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            </motion.div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-500 dark:text-purple-400">Live Dashboard</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-400 dark:text-white/40 text-sm mt-0.5">Welcome back! Here's your overview.</p>
        </div>

        {/* Live indicator */}
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <Activity className="w-3 h-3" />
          Live
        </motion.div>
      </motion.div>

      {/* ── Main Stat Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} index={i} />
        ))}
      </div>

      {/* ── Mini Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {miniCards.map((card, i) => (
          <MiniCard key={card.label} {...card} index={i} />
        ))}
      </div>

      {/* ── Transactions + Booth Status ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease }}
          className="rounded-2xl p-6 bg-white/70 dark:bg-transparent"
          style={{
            border: '1px solid rgba(0,0,0,0.07)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
            <motion.button
              whileHover={{ x: 3 }}
              className="text-xs text-purple-500 dark:text-purple-400 font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </motion.button>
          </div>
          <div>
            {transactions.slice(0, 4).map((tx, i) => (
              <TxRow
                key={tx.id}
                id={tx.id}
                outlet={outlets.find(o => o.id === tx.outletId)?.name || 'Unknown'}
                amount={tx.amount}
                status={tx.status}
                index={i}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        </motion.div>

        {/* Booth Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.52, ease }}
          className="rounded-2xl p-6 bg-white/70 dark:bg-transparent"
          style={{
            border: '1px solid rgba(0,0,0,0.07)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Booth Status</h2>
            <span className="text-xs text-gray-400 dark:text-white/30 font-medium">
              {boothStatuses.filter(b => b.status === 'online').length} online
            </span>
          </div>
          <div>
            {boothStatuses.map((booth, i) => (
              <BoothRow
                key={booth.id}
                name={booth.name}
                lastPhoto={booth.lastPhoto}
                status={booth.status}
                index={i}
                formatTime={formatTime}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease }}
        className="rounded-2xl p-6 bg-white/70 dark:bg-transparent"
        style={{
          border: '1px solid rgba(0,0,0,0.07)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <QuickAction key={action.label} {...action} index={i} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}