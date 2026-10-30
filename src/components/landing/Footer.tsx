'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Phone,
  Clock,
  Instagram,
  Twitter,
  Youtube,
  ArrowUpRight,
  Heart,
  Sparkles,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useDashboardStore } from '@/lib/stores/dashboard-store'

const ease = [0.22, 1, 0.36, 1] as const

// ============================================
// Floating Particle — decorative dot
// ============================================
function Particle({
  x,
  y,
  size,
  duration,
  delay,
  color,
}: {
  x: number
  y: number
  size: number
  duration: number
  delay: number
  color: string
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, backgroundColor: color }}
      animate={{
        y: [0, -24, 0],
        opacity: [0, 0.6, 0],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// ============================================
// Typewriter text hook
// ============================================
function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    const timeout = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1))
        i++
        if (i >= text.length) {
          clearInterval(interval)
          setDone(true)
        }
      }, speed)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(timeout)
  }, [text, speed, startDelay])

  return { displayed, done }
}

// ============================================
// Magnetic Social Icon
// ============================================
function MagneticSocial({
  icon: Icon,
  href,
  label,
  primaryColor,
  index,
  isInView,
}: {
  icon: React.ComponentType<{ className?: string }>
  href: string
  label: string
  primaryColor: string
  index: number
  isInView: boolean
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 200, damping: 16 })
  const springY = useSpring(mouseY, { stiffness: 200, damping: 16 })
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLAnchorElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left - rect.width / 2) * 0.35)
    mouseY.set((e.clientY - rect.top - rect.height / 2) * 0.35)
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      aria-label={label}
      initial={{ opacity: 0, scale: 0.5, y: 16 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: 0.5 + index * 0.1, ease }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        mouseX.set(0)
        mouseY.set(0)
        setHovered(false)
      }}
      style={{ x: springX, y: springY }}
      className="relative w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <motion.span
        className="absolute inset-0 rounded-2xl"
        animate={{
          backgroundColor: hovered ? primaryColor : '#1f2937',
          boxShadow: hovered ? `0 8px 24px ${primaryColor}50` : '0 0px 0px transparent',
        }}
        transition={{ duration: 0.25 }}
      />
      {/* Shine sweep on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ x: '-100%', opacity: 0.6 }}
            animate={{ x: '200%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'linear' }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
              width: '100%',
            }}
          />
        )}
      </AnimatePresence>
      <motion.span
        animate={{ scale: hovered ? 1.2 : 1, rotate: hovered ? 12 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="relative z-10"
      >
        <Icon className="w-4 h-4 text-white" />
      </motion.span>
    </motion.a>
  )
}

// ============================================
// Quick Link Item — with arrow reveal
// ============================================
function QuickLinkItem({
  href,
  label,
  index,
  primaryColor,
  isInView,
}: {
  href: string
  label: string
  index: number
  primaryColor: string
  isInView: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.li
      initial={{ opacity: 0, x: -16 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.28 + index * 0.08, ease }}
    >
      <a
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-2.5 group py-0.5"
      >
        {/* Animated dot → bar */}
        <motion.span
          animate={{
            width: hovered ? 20 : 6,
            backgroundColor: hovered ? primaryColor : '#6B7280',
          }}
          transition={{ duration: 0.25, ease }}
          className="h-0.5 rounded-full flex-shrink-0"
        />
        <motion.span
          animate={{ x: hovered ? 3 : 0, color: hovered ? '#ffffff' : '#9CA3AF' }}
          transition={{ duration: 0.2 }}
          className="text-sm"
        >
          {label}
        </motion.span>
        <motion.span
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -6 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <ArrowUpRight className="w-3.5 h-3.5" style={{ color: primaryColor }} />
        </motion.span>
      </a>
    </motion.li>
  )
}

// ============================================
// Contact Item — icon pulse on hover
// ============================================
function ContactItem({
  icon: Icon,
  text,
  index,
  primaryColor,
  isInView,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  text: string
  index: number
  primaryColor: string
  isInView: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.li
      initial={{ opacity: 0, x: -16 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.35 + index * 0.09, ease }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-3 text-sm cursor-default"
    >
      <motion.span
        animate={{
          backgroundColor: hovered ? primaryColor : `${primaryColor}20`,
          scale: hovered ? 1.12 : 1,
          rotate: hovered ? 8 : 0,
          boxShadow: hovered ? `0 4px 14px ${primaryColor}40` : '0 0 0 transparent',
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
      >
        <Icon
          className="w-3.5 h-3.5 transition-colors duration-200"
          style={{ color: hovered ? '#ffffff' : primaryColor }}
        />
      </motion.span>
      <motion.span
        animate={{ color: hovered ? '#ffffff' : '#9CA3AF' }}
        transition={{ duration: 0.2 }}
      >
        {text}
      </motion.span>
    </motion.li>
  )
}

// ============================================
// Footer Component — Full Premium
// ============================================
export function Footer() {
  const { branding } = useDashboardStore()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.12 })

  const tagline =
    branding.tagline || 'Platform photo booth profesional untuk event dan bisnis di Indonesia.'
  const { displayed, done } = useTypewriter(isInView ? tagline : '', 32, 400)

  // Decorative particles config
  const particles = [
    { x: 8, y: 20, size: 3, duration: 4.5, delay: 0, color: `${branding.primaryColor}60` },
    { x: 18, y: 60, size: 2, duration: 5.2, delay: 0.8, color: `${branding.secondaryColor}50` },
    { x: 35, y: 35, size: 4, duration: 3.8, delay: 1.5, color: `${branding.primaryColor}40` },
    { x: 55, y: 15, size: 2, duration: 6, delay: 0.4, color: `${branding.secondaryColor}60` },
    { x: 72, y: 70, size: 3, duration: 4.2, delay: 2, color: `${branding.primaryColor}50` },
    { x: 85, y: 30, size: 2, duration: 5.5, delay: 1.2, color: `${branding.secondaryColor}40` },
    { x: 92, y: 55, size: 3, duration: 4.8, delay: 0.6, color: `${branding.primaryColor}55` },
  ]

  const quickLinks = [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/locations', label: 'Locations' },
    { href: '/testimonials', label: 'Testimonials' },
  ]

  const contactItems = [
    { icon: Phone, text: '+62 21 1234 5678' },
    { icon: MapPin, text: 'Jakarta, Indonesia' },
    { icon: Clock, text: 'Mon-Fri: 9AM - 6PM' },
  ]

  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'Youtube' },
  ]

  return (
    <footer ref={ref} className="relative bg-gray-950 text-white pt-20 pb-8 px-4 overflow-hidden">
      {/* ── Floating particles ────────────────────────────────── */}
      {isInView && particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* ── Gradient mesh blobs ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 0.12, scale: 1 } : {}}
        transition={{ duration: 1.2, ease }}
        className="absolute top-0 left-1/4 w-[700px] h-[350px] rounded-full pointer-events-none blur-3xl"
        style={{ background: `radial-gradient(circle, ${branding.primaryColor}, transparent 65%)` }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 0.1, scale: 1 } : {}}
        transition={{ duration: 1.4, delay: 0.2, ease }}
        className="absolute bottom-0 right-1/4 w-[500px] h-[250px] rounded-full pointer-events-none blur-3xl"
        style={{
          background: `radial-gradient(circle, ${branding.secondaryColor}, transparent 65%)`,
        }}
      />

      {/* ── Subtle grid pattern ───────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(${branding.primaryColor} 1px, transparent 1px),
            linear-gradient(90deg, ${branding.primaryColor} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* ── Brand Column ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease }}
            className="md:col-span-2"
          >
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex items-center gap-3 mb-5 w-fit"
            >
              <BrandLogo
                logoUrl={branding.logoUrl}
                companyName={branding.companyName}
                tone="dark"
                className="h-14 w-auto max-w-full"
              />
            </motion.div>

            {/* Typewriter tagline */}
            <div className="text-gray-400 mb-7 max-w-sm leading-relaxed text-sm min-h-[3rem]">
              <span>{displayed}</span>
              {!done && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-0.5 h-3.5 ml-0.5 align-middle rounded-full"
                  style={{ backgroundColor: branding.primaryColor }}
                />
              )}
            </div>

            {/* Magnetic social icons */}
            <div className="flex gap-2.5">
              {socialLinks.map(({ icon, href, label }, i) => (
                <MagneticSocial
                  key={label}
                  icon={icon}
                  href={href}
                  label={label}
                  primaryColor={branding.primaryColor}
                  index={i}
                  isInView={isInView}
                />
              ))}
            </div>
          </motion.div>

          {/* ── Quick Links ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease }}
          >
            <div className="flex items-center gap-2 mb-6">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider">
                Quick Links
              </h4>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: branding.primaryColor }} />
              </motion.div>
            </div>
            <ul className="space-y-3.5">
              {quickLinks.map(({ href, label }, i) => (
                <QuickLinkItem
                  key={href}
                  href={href}
                  label={label}
                  index={i}
                  primaryColor={branding.primaryColor}
                  isInView={isInView}
                />
              ))}
            </ul>
          </motion.div>

          {/* ── Contact ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.22, ease }}
          >
            <h4 className="font-semibold mb-6 text-white text-sm uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3.5">
              {contactItems.map(({ icon, text }, i) => (
                <ContactItem
                  key={text}
                  icon={icon}
                  text={text}
                  index={i}
                  primaryColor={branding.primaryColor}
                  isInView={isInView}
                />
              ))}
            </ul>
          </motion.div>
        </div>

        {/* ── Bottom bar ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.55, ease }}
          className="border-t border-gray-800/60 pt-8"
        >
          {/* Animated gradient divider */}
          <motion.div
            className="h-px w-full mb-8 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${branding.primaryColor}, ${branding.secondaryColor}, transparent)`,
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <motion.p
              className="text-gray-500 text-sm flex items-center gap-1.5"
              whileHover={{ color: '#9CA3AF' }}
            >
              © {new Date().getFullYear()} {branding.companyName}. Made with
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Heart
                  className="w-3.5 h-3.5 fill-current"
                  style={{ color: branding.primaryColor }}
                />
              </motion.span>
              in Indonesia
            </motion.p>

            {/* Gradient pill badge */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{
                background: `linear-gradient(135deg, ${branding.primaryColor}30, ${branding.secondaryColor}30)`,
                border: `1px solid ${branding.primaryColor}30`,
              }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#22c55e' }}
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              All systems operational
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
