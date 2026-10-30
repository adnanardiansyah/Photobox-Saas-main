'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  size?: 'sm' | 'md' | 'lg'
  busy?: boolean
  children: ReactNode
}
const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }
export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  size = 'md',
  busy = false,
  children,
}: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => panel.current?.focus())
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = oldOverflow
      previous?.focus()
    }
  }, [open])
  useEffect(() => {
    if (!open) return
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!busy) onClose()
      }
      if (event.key !== 'Tab') return
      const elements = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button,a[href],input,select,textarea,[tabindex]'
        ) || []
      ).filter((el) => el.tabIndex >= 0 && !el.matches(':disabled') && el.getClientRects().length)
      const first = elements[0],
        last = elements[elements.length - 1]
      if (!first) {
        event.preventDefault()
        panel.current?.focus()
        return
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel.current)
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === panel.current)
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [open, busy, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ margin: 0 }}>
      <div
        className="admin-modal-backdrop absolute inset-0 bg-black/60"
        onClick={() => {
          if (!busy) onClose()
        }}
      />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-busy={busy}
        className={`admin-modal-panel relative flex max-h-[85vh] w-full ${sizeClass[size]} flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl outline-none dark:border-gray-800 dark:bg-gray-900`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-6 pb-4 pt-5 dark:border-gray-800">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <Icon className="h-5 w-5" />
              </span>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup dialog"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-950/40">
      {children}
    </div>
  )
}
