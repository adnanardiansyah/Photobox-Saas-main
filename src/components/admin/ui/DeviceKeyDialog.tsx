'use client'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { Modal, ModalFooter } from './Modal'
export function DeviceKeyDialog({
  value,
  onClose,
}: {
  value: { machineId: string; apiKey: string } | null
  onClose: () => void
}) {
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Berhasil disalin')
    } catch {
      toast.error('Belum dapat menyalin otomatis. Pilih teks dan salin secara manual.')
    }
  }
  return (
    <Modal
      open={!!value}
      onClose={onClose}
      title="Hubungkan perangkat booth"
      description="Lakukan langkah berikut pada perangkat yang akan digunakan untuk mengambil foto."
    >
      {value && (
        <div className="space-y-4 overflow-y-auto px-6 py-5">
          <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>
              Buka{' '}
              <a
                href="/booth/login"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-purple-600 underline"
              >
                halaman login booth
              </a>{' '}
              pada perangkat.
            </li>
            <li>Masukkan kode perangkat dan kunci akses di bawah.</li>
            <li>Simpan kunci akses; nilainya hanya ditampilkan sekali di dialog ini.</li>
          </ol>
          {[
            { label: 'Kode perangkat (Machine ID)', text: value.machineId },
            { label: 'Kunci akses (API key)', text: value.apiKey },
          ].map((item) => (
            <label key={item.label} className="block text-sm font-medium">
              {item.label}
              <div className="mt-2 flex gap-2">
                <input
                  readOnly
                  value={item.text}
                  onFocus={(e) => e.target.select()}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2.5 font-mono text-xs dark:border-gray-700 dark:bg-gray-800"
                />
                <button
                  type="button"
                  aria-label={`Salin ${item.label}`}
                  onClick={() => void copy(item.text)}
                  className="rounded-lg border px-3 text-purple-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </label>
          ))}
          <p className="text-xs text-gray-500">
            Bagikan kunci hanya kepada petugas yang menyiapkan perangkat booth.
          </p>
        </div>
      )}
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white"
        >
          Selesai
        </button>
      </ModalFooter>
    </Modal>
  )
}
