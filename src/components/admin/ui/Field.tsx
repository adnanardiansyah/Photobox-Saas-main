'use client'

import { Check } from 'lucide-react'

// ============================================
// Form primitives — Shadcn-style, konsisten
// untuk semua modal admin.
// ============================================

const base =
  'w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 ' +
  'bg-white dark:bg-gray-900 px-3.5 text-sm text-gray-900 dark:text-white ' +
  'placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {children}
      {required && <span className="ml-0.5 text-purple-600 dark:text-purple-400">*</span>}
    </span>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export function Input({ className = '', ...props }: InputProps) {
  return <input className={`${base} ${className}`} {...props} />
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`${base} appearance-none pr-9 bg-no-repeat bg-[right_0.75rem_center] bg-[length:14px]
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')]
        ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`${base} h-auto py-2.5 resize-none ${className}`}
      {...props}
    />
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
}
export function Switch({ checked, onChange, label, description }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      {(label || description) && (
        <span className="text-left">
          {label && <span className="block text-sm font-medium text-gray-900 dark:text-white">{label}</span>}
          {description && <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</span>}
        </span>
      )}

      <span
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        >
          {checked && <Check className="h-3 w-3 text-purple-600" strokeWidth={3} />}
        </span>
      </span>
    </button>
  )
}

interface FieldProps {
  label?: string
  htmlFor?: string
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
}
export function Field({ label, htmlFor, required, hint, className = '', children }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="block">
          <Label required={required}>{label}</Label>
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  )
}