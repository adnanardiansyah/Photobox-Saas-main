'use client'
import { WriteAccess } from './ui/WriteAccess'

import { useShallow } from 'zustand/react/shallow'

import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Copy, Check, RefreshCw, Loader2, QrCode, X } from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { adminRequest } from '@/lib/admin-client'
import { useAdminForm } from './ui/useAdminForm'
import { ImageUpload } from './ui/ImageUpload'

import { Modal, ModalFooter } from './ui/Modal'
import { Field, Input } from './ui/Field'

interface GalleryData {
  id: string
  galleryCode: string
  photos: string[]
  status: string
  outlet: string
  frame: string
  totalPrice: number
  createdAt: string
  expiresAt: string | null
}

export function GalleryModule() {
  const { searchQuery } = useDashboardStore(
    useShallow((state) => ({ searchQuery: state.searchQuery }))
  )
  const [galleries, setGalleries] = useState<GalleryData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchGalleries = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gallery')
      const data = await res.json()
      if (data.success) setGalleries(data.data)
      else toast.error('Galeri belum dapat dimuat. Coba muat ulang menu.')
    } catch {
      toast.error('Galeri belum dapat dimuat. Coba muat ulang menu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGalleries()
  }, [])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Gallery code copied!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleViewGallery = (code: string) => {
    window.open(`/gallery?code=${code}`, '_blank')
  }

  const filteredGalleries = galleries.filter(
    (gallery) =>
      gallery.galleryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gallery.outlet.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kelola galeri</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Lihat foto, salin kode, dan kelola galeri pelanggan.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchGalleries}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className="w-4 h-4" />
            Muat ulang
          </button>
          <WriteAccess>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              Tambah galeri
            </button>
          </WriteAccess>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Cari kode galeri atau outlet..."
          value={searchQuery}
          onChange={(e) => useDashboardStore.getState().setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGalleries.map((gallery, i) => (
          <div
            key={gallery.id}
            className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {gallery.galleryCode}
                  </h3>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    gallery.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {gallery.status}
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {gallery.outlet} &bull; {gallery.frame}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {gallery.photos.slice(0, 4).map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png'
                      }}
                    />
                  </div>
                ))}
                {gallery.photos.length > 4 && (
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-500">+{gallery.photos.length - 4}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyCode(gallery.galleryCode)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                >
                  {copiedCode === gallery.galleryCode ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {copiedCode === gallery.galleryCode ? 'Tersalin' : 'Salin kode'}
                  </span>
                </button>
                <button
                  onClick={() => handleViewGallery(gallery.galleryCode)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Lihat
                </button>
              </div>

              <div className="mt-4 pt-3 border-t dark:border-gray-800 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Rp {gallery.totalPrice.toLocaleString()}</span>
                <span>{new Date(gallery.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGalleries.length === 0 && !loading && (
        <div className="text-center py-12">
          <QrCode className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No galleries match your search' : 'Galeri tidak ditemukan'}
          </p>
        </div>
      )}

      <AddGalleryModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          fetchGalleries()
        }}
      />
    </div>
  )
}

function AddGalleryModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [galleryCode, setGalleryCode] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [photoInput, setPhotoInput] = useState('')
  const [totalPrice, setTotalPrice] = useState(25000)
  const [outlets, setOutlets] = useState<{ id: string; name: string }[]>([])
  const [outletId, setOutletId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const { saving, error, submit } = useAdminForm(open, onSuccess)
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setGalleryCode('')
    setPhotos([])
    setPhotoInput('')
    setTotalPrice(25000)
    setLoadError('')
    setOutletId('')
    setOutlets([])
    adminRequest('/api/admin/outlets')
      .then((result) => {
        if (!cancelled) {
          setOutlets(result.data)
          setOutletId(result.data[0]?.id || '')
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [open])
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving || uploading}
      title="Tambah galeri"
      description="Unggah foto, pilih outlet, lalu simpan. Kode galeri dibuat otomatis."
      icon={Plus}
    >
      <form
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={(event) => {
          event.preventDefault()
          void submit(async () => {
            if (uploading) throw new Error('Tunggu unggahan selesai')
            if (!outletId)
              throw new Error('Pilih outlet terlebih dahulu. Buat outlet jika daftar masih kosong.')
            if (!photos.length) throw new Error('Unggah minimal satu foto untuk galeri ini')
            await adminRequest('/api/admin/gallery', {
              method: 'POST',
              body: JSON.stringify({
                outletId,
                photos,
                totalPrice,
                ...(galleryCode.trim() ? { galleryCode: galleryCode.trim().toUpperCase() } : {}),
              }),
            })
            toast.success('Galeri berhasil disimpan')
          })
        }}
      >
        {(error || loadError) && (
          <p
            role="alert"
            className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
          >
            {error || loadError}
          </p>
        )}
        <fieldset disabled={saving} className="contents">
          <div className="space-y-4 overflow-y-auto px-6 py-5">
            <Field label="Outlet" required>
              <select
                aria-label="Outlet galeri"
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Pilih outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Foto galeri" required>
              <ImageUpload
                folder="gallery"
                multiple
                value={photos}
                onChange={setPhotos}
                disabled={saving}
                onBusyChange={setUploading}
              />
            </Field>
            <Field
              label="Pembayaran tunai tercatat (Rp)"
              hint="Galeri manual ini dicatat sebagai sesi selesai dengan pembayaran tunai yang sudah lunas."
              required
            >
              <Input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(Number(e.target.value))}
                min="0"
                step="1"
                required
              />
            </Field>
            <details className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
              <summary className="cursor-pointer text-gray-600 dark:text-gray-300">
                Pengaturan lanjutan (opsional)
              </summary>
              <div className="mt-3 space-y-3">
                <Field
                  label="Kode galeri sendiri"
                  hint="Kosongkan agar otomatis. Minimal 6 huruf besar/angka, boleh tanda hubung."
                >
                  <Input
                    value={galleryCode}
                    onChange={(e) => setGalleryCode(e.target.value.toUpperCase())}
                  />
                </Field>
                <Field label="Tambahkan tautan foto tersimpan">
                  <div className="flex gap-2">
                    <Input
                      value={photoInput}
                      onChange={(e) => setPhotoInput(e.target.value)}
                      placeholder="URL foto Supabase atau /photos/..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (photoInput.trim() && photos.length < 20) {
                          setPhotos([...photos, photoInput.trim()])
                          setPhotoInput('')
                        }
                      }}
                      className="rounded-lg border px-3"
                    >
                      Tambah
                    </button>
                  </div>
                </Field>
              </div>
            </details>
          </div>
          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading || !outletId}
              className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : uploading ? 'Mengunggah...' : 'Simpan galeri'}
            </button>
          </ModalFooter>
        </fieldset>
      </form>
    </Modal>
  )
}
