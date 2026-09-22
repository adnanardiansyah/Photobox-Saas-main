'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

/**
 * Reusable modern dialog (Shadcn-style).
 * Semua form modal di admin memakai komponen ini supaya tampilan konsisten.
 */
export function Modal({ open, onClose, title, description, icon: Icon, size = 'md', children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`relative w-full ${sizeClass[size]} flex flex-col max-h-[85vh]
                       bg-white dark:bg-gray-900 rounded-2xl
                       border border-gray-200/60 dark:border-gray-800
                       shadow-2xl shadow-gray-900/20 overflow-hidden`}
          >
            {/* ── Header ─────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                {Icon && (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 dark:bg-purple-500/10 ring-1 ring-purple-100 dark:ring-purple-500/20">
                    <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">{title}</h2>
                  {description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Body ─────────────────────────────────────────── */}
            {/* children (biasanya <form>) mengatur scroll & footer sendiri:
                form -> "flex flex-col flex-1 overflow-hidden",
                body scrollable -> "flex-1 overflow-y-auto px-6 py-5",
                footer -> <ModalFooter /> */}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Footer bar untuk form modal. Tetap berada di dalam <form> agar tombol
 * submit jalan — pakai `flex flex-col` pada form-nya.
 */
export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 shrink-0">
      {children}
    </div>
  )
}