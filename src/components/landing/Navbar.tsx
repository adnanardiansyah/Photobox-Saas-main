'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Camera, ChevronDown, Menu, X, LayoutDashboard, Zap } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useDashboardStore } from '@/lib/stores/dashboard-store'

const ease = [0.22, 1, 0.36, 1] as const

// ============================================
// Magnetic Nav Link — 3D tilt + spotlight glow
// ============================================
function MagneticNavLink({
  href,
  label,
  isActive,
  primaryColor,
  secondaryColor,
  index,
  onClick,
}: {
  href: string
  label: string
  isActive: boolean
  primaryColor: string
  secondaryColor: string
  index: number
  onClick: () => void
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 180, damping: 18 })
  const springY = useSpring(mouseY, { stiffness: 180, damping: 18 })
  const rotateX = useTransform(springY, [-20, 20], [6, -6])
  const rotateY = useTransform(springX, [-40, 40], [-8, 8])

  const [spotPos, setSpotPos] = useState({ x: 50, y: 50 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      mouseX.set(x * 0.4)
      mouseY.set(y * 0.4)
      setSpotPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      })
    },
    [mouseX, mouseY]
  )

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
    setHovered(false)
  }, [mouseX, mouseY])

  return (
    <motion.a
      ref={ref}
      href={href}
      onClick={onClick}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.06 * index, ease }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 600,
      }}
      className="relative px-4 py-2 rounded-xl text-sm font-medium select-none cursor-pointer overflow-hidden"
    >
      {/* Active sliding pill */}
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: `${primaryColor}14` }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}

      {/* Spotlight hover glow */}
      <AnimatePresence>
        {hovered && !isActive && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${spotPos.x}% ${spotPos.y}%, ${primaryColor}22 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Label */}
      <motion.span
        className="relative z-10 block"
        animate={{ color: isActive ? primaryColor : hovered ? '#111827' : '#4B5563' }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.span>

      {/* Gradient underline on hover (non-active) */}
      <motion.span
        className="absolute bottom-1 left-4 right-4 h-0.5 rounded-full origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isActive ? 0 : hovered ? 1 : 0 }}
        transition={{ duration: 0.25, ease }}
        style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
      />
    </motion.a>
  )
}

// ============================================
// Cinematic Dropdown Item — blur-in + sweep
// ============================================
function DropdownItem({
  href,
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  index,
  onClick,
}: {
  href: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  index: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, x: -14, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.28, delay: 0.06 + index * 0.07, ease }}
      className="relative flex items-center gap-3 px-4 py-3.5 overflow-hidden group"
    >
      {/* Hover background sweep */}
      <motion.span
        className="absolute inset-0"
        initial={{ scaleX: 0, originX: '0%' }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.22, ease }}
        style={{ backgroundColor: `${iconColor}08` }}
      />

      {/* Icon with spring pop */}
      <motion.div
        animate={{
          scale: hovered ? 1.12 : 1,
          rotate: hovered ? 8 : 0,
          boxShadow: hovered ? `0 6px 20px ${iconColor}30` : '0 0px 0px transparent',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </motion.div>

      {/* Text slides right on hover */}
      <div className="relative z-10">
        <motion.p
          animate={{ x: hovered ? 2 : 0 }}
          transition={{ duration: 0.2 }}
          className="font-semibold text-gray-900 text-sm"
        >
          {title}
        </motion.p>
        <motion.p
          animate={{ x: hovered ? 2 : 0 }}
          transition={{ duration: 0.2, delay: 0.03 }}
          className="text-xs text-gray-400"
        >
          {subtitle}
        </motion.p>
      </div>

      {/* Arrow appears on hover */}
      <motion.span
        className="ml-auto relative z-10"
        animate={{ x: hovered ? 0 : -6, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-4 h-4 -rotate-90" style={{ color: iconColor }} />
      </motion.span>
    </motion.a>
  )
}

// ============================================
// Navbar Component — Full Premium
// ============================================
export function Navbar() {
  useEffect(() => {
    useDashboardStore
      .getState()
      .refreshPublic()
      .catch(() => {})
  }, [])

  const { branding } = useDashboardStore()
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false)
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeLink, setActiveLink] = useState('/')
  const loginDropdownRef = useRef<HTMLDivElement>(null)
  const featuresDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setActiveLink(window.location.pathname)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(e.target as Node))
        setLoginDropdownOpen(false)
      if (featuresDropdownRef.current && !featuresDropdownRef.current.contains(e.target as Node))
        setFeaturesDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/locations', label: 'Locations' },
    { href: '/testimonials', label: 'Testimonials' },
  ]

  const featuresDropdown = [
    {
      image: '/photos/features/qris.jpg',
      title: 'QRIS Payment',
      desc: 'Bayar scan QRIS dari e-wallet atau m-banking.',
    },
    {
      image: '/photos/features/silent-print.jpg',
      title: 'Silent Print',
      desc: 'Cetak foto senyap, cocok acara formal.',
    },
    {
      image: '/photos/features/gif-engine.jpg',
      title: 'GIF Engine',
      desc: 'Buat GIF dari burst foto, share ke medsos.',
    },
    {
      image: '/photos/features/newspaper.jpg',
      title: 'Newspaper A4',
      desc: 'Template koran vintage, custom caption.',
    },
  ]

  const dropdownItems = [
    {
      href: '/admin/login',
      icon: LayoutDashboard,
      iconBg: `${branding.primaryColor}18`,
      iconColor: branding.primaryColor,
      title: 'Admin / Owner',
      subtitle: 'Dashboard & Management',
    },
    {
      href: '/booth/login',
      icon: Camera,
      iconBg: `${branding.secondaryColor}18`,
      iconColor: branding.secondaryColor,
      title: 'Booth / Outlet',
      subtitle: 'Photo Session Interface',
    },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0)',
        backdropFilter: scrolled ? 'blur(18px) saturate(200%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(200%)' : 'none',
        borderBottom: scrolled ? `1px solid ${branding.primaryColor}18` : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.07)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* ── Logo ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <a href="/" className="flex items-center gap-2.5 group">
            <BrandLogo
              logoUrl={branding.logoUrl}
              companyName={branding.companyName}
              tone="light"
              className="h-10 w-auto max-w-[9rem] sm:max-w-[11rem]"
            />
          </a>
        </motion.div>

        {/* ── Desktop Nav ────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-0.5" style={{ perspective: '800px' }}>
          <MagneticNavLink
            href="/"
            label="Home"
            isActive={activeLink === '/'}
            primaryColor={branding.primaryColor}
            secondaryColor={branding.secondaryColor}
            index={0}
            onClick={() => setActiveLink('/')}
          />

          {/* Features Dropdown */}
          <div
            className="relative"
            ref={featuresDropdownRef}
            onMouseEnter={() => setFeaturesDropdownOpen(true)}
            onMouseLeave={() => setFeaturesDropdownOpen(false)}
          >
            <MagneticNavLink
              href="/features"
              label="Features"
              isActive={activeLink === '/features'}
              primaryColor={branding.primaryColor}
              secondaryColor={branding.secondaryColor}
              index={1}
              onClick={() => setActiveLink('/features')}
            />

            <AnimatePresence>
              {featuresDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.93, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, scale: 0.93, filter: 'blur(4px)' }}
                  transition={{ duration: 0.22, ease }}
                  className="absolute left-1/2 -translate-x-1/2 mt-2.5 w-[580px] bg-white rounded-2xl overflow-hidden"
                  style={{
                    transformOrigin: 'top center',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Gradient top stripe */}
                  <div
                    className="h-1 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
                    }}
                  />

                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {featuresDropdown.map((feat, i) => (
                        <a
                          key={feat.title}
                          href="/features"
                          onClick={() => {
                            setActiveLink('/features')
                            setFeaturesDropdownOpen(false)
                          }}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={feat.image}
                              alt={feat.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{feat.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{feat.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>

                    <a
                      href="/features"
                      onClick={() => {
                        setActiveLink('/features')
                        setFeaturesDropdownOpen(false)
                      }}
                      className="mt-3 block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: `${branding.primaryColor}10`,
                        color: branding.primaryColor,
                      }}
                    >
                      Lihat Semua Fitur →
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.slice(1).map((link, i) => (
            <MagneticNavLink
              key={link.href}
              href={link.href}
              label={link.label}
              isActive={activeLink === link.href}
              primaryColor={branding.primaryColor}
              secondaryColor={branding.secondaryColor}
              index={i + 2}
              onClick={() => setActiveLink(link.href)}
            />
          ))}
        </nav>

        {/* ── Right side ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
          className="flex items-center gap-3"
        >
          {/* Login dropdown trigger */}
          <div className="relative" ref={loginDropdownRef}>
            <motion.button
              onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white text-sm overflow-hidden shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
                boxShadow: `0 4px 16px ${branding.primaryColor}40`,
              }}
            >
              {/* Shimmer sweep */}
              <motion.span
                className="absolute inset-0 pointer-events-none"
                animate={{ x: loginDropdownOpen ? '200%' : '-100%' }}
                transition={{
                  duration: 0.7,
                  ease: 'linear',
                  repeat: loginDropdownOpen ? 0 : Infinity,
                  repeatDelay: 2,
                }}
                style={{
                  background:
                    'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%)',
                  width: '100%',
                }}
              />
              <Zap className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Login</span>
              <motion.span
                animate={{ rotate: loginDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease }}
                className="relative z-10"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </motion.button>

            {/* ── Dropdown panel ────────────────────────────── */}
            <AnimatePresence>
              {loginDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.93, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, scale: 0.93, filter: 'blur(4px)' }}
                  transition={{ duration: 0.22, ease }}
                  className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl overflow-hidden"
                  style={{
                    transformOrigin: 'top right',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Gradient top stripe */}
                  <div
                    className="h-1 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
                    }}
                  />

                  {/* Role hint label */}
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    Pilih peran Anda
                  </motion.p>

                  {dropdownItems.map((item, i) => (
                    <DropdownItem
                      key={item.href}
                      {...item}
                      index={i}
                      onClick={() => setLoginDropdownOpen(false)}
                    />
                  ))}

                  {/* Footer hint */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.22 }}
                    className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/60"
                  >
                    <p className="text-[11px] text-gray-400 text-center">
                      Butuh bantuan?{' '}
                      <a
                        href="/contact"
                        className="font-semibold"
                        style={{ color: branding.primaryColor }}
                      >
                        Hubungi kami
                      </a>
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.93 }}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6 text-gray-700" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6 text-gray-700" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>

      {/* ── Mobile Menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
            animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
            exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.32, ease }}
            className="md:hidden overflow-hidden bg-white/96 backdrop-blur-2xl border-t"
            style={{ borderColor: `${branding.primaryColor}14` }}
          >
            <nav className="flex flex-col p-3 gap-0.5">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ delay: i * 0.055, duration: 0.3, ease }}
                  whileHover={{ x: 4 }}
                  className="relative flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm overflow-hidden group"
                  style={{
                    color: activeLink === link.href ? branding.primaryColor : '#374151',
                    backgroundColor:
                      activeLink === link.href ? `${branding.primaryColor}10` : undefined,
                  }}
                  onClick={() => {
                    setActiveLink(link.href)
                    setMobileMenuOpen(false)
                  }}
                >
                  {/* Hover sweep */}
                  <motion.span
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ backgroundColor: `${branding.primaryColor}08` }}
                  />
                  <span className="relative z-10">{link.label}</span>
                  {/* Active dot slides between items */}
                  {activeLink === link.href && (
                    <motion.span
                      layoutId="mobile-active-dot"
                      className="relative z-10 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: branding.primaryColor }}
                    />
                  )}
                </motion.a>
              ))}

              {/* Mobile Features */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.3, ease }}
                className="mt-2 pt-2.5 border-t"
                style={{ borderColor: `${branding.primaryColor}14` }}
              >
                <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Fitur
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {featuresDropdown.map((feat) => (
                    <a
                      key={feat.title}
                      href="/features"
                      onClick={() => {
                        setActiveLink('/features')
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-8 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={feat.image}
                          alt={feat.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{feat.title}</span>
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Mobile login shortcuts */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.055 + 0.06, duration: 0.3, ease }}
                className="mt-2 pt-2.5 border-t grid grid-cols-2 gap-2"
                style={{ borderColor: `${branding.primaryColor}14` }}
              >
                <a
                  href="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: `${branding.primaryColor}30`,
                    color: branding.primaryColor,
                  }}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Admin
                </a>
                <a
                  href="/booth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
                  }}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Booth
                </a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
