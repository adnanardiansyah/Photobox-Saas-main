'use client'
import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { adminRequest } from '@/lib/admin-client'
export function ImageUpload({
  value,
  onChange,
  folder,
  multiple = false,
  disabled = false,
  onBusyChange,
}: {
  value: string[]
  onChange: (urls: string[]) => void
  folder: 'templates' | 'gallery' | 'brand-logo' | 'brand-banner'
  multiple?: boolean
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const locked = useRef(false)
  return (
    <div className="space-y-3">
      <label
        className={`flex cursor-pointer focus-within:ring-2 focus-within:ring-purple-500 items-center justify-center gap-2 rounded-xl border border-dashed border-purple-300 bg-purple-50 p-4 text-sm font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-300 ${disabled || uploading ? 'opacity-50' : ''}`}
      >
        <Upload className="h-4 w-4" />
        {uploading
          ? 'Mengunggah gambar...'
          : multiple
            ? 'Pilih foto dari perangkat'
            : 'Pilih gambar dari perangkat'}
        <input
          aria-label={multiple ? 'Unggah foto galeri' : 'Unggah gambar template'}
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple={multiple}
          disabled={disabled || uploading}
          onChange={async (event) => {
            const files = Array.from(event.currentTarget.files || [])
            event.currentTarget.value = ''
            if (!files.length || locked.current) return
            if (files.length + (multiple ? value.length : 0) > 20) {
              setError('Maksimal 20 foto per galeri.')
              return
            }
            if (
              files.some(
                (f) =>
                  !['image/png', 'image/jpeg', 'image/webp'].includes(f.type) ||
                  f.size > 4 * 1024 * 1024
              )
            ) {
              setError('Pilih JPG, PNG, atau WebP maksimal 4 MB per gambar.')
              return
            }
            locked.current = true
            setUploading(true)
            onBusyChange?.(true)
            setError('')
            const next = multiple ? [...value] : []
            try {
              for (const file of files) {
                const form = new FormData()
                form.append('photo', file)
                form.append('assetFolder', folder)
                const result = await adminRequest('/api/photos/upload', {
                  method: 'POST',
                  body: form,
                })
                next.push(result.url)
                onChange([...next])
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unggah gagal. Silakan coba lagi.')
            } finally {
              locked.current = false
              setUploading(false)
              onBusyChange?.(false)
            }
          }}
        />
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        JPG, PNG, atau WebP; maksimal 4 MB per gambar.
        {folder === 'templates' && ' Gunakan PNG transparan untuk bingkai foto.'}
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {!!value.length && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, index) => (
            <div
              key={url + index}
              className="relative rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <img
                src={url}
                alt={`Pratinjau ${index + 1}`}
                className="h-24 w-full object-contain"
              />
              <button
                type="button"
                aria-label={`Hapus gambar ${index + 1} dari formulir`}
                disabled={disabled || uploading}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="absolute right-0 top-0 rounded-full bg-white p-1 text-red-600 shadow dark:bg-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
