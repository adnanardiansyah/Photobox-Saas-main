'use client'
import { WriteAccess } from './ui/WriteAccess'

import { useShallow } from 'zustand/react/shallow'

import { useState, useEffect } from 'react'
import { MapPin, Search, Edit, Plus, ExternalLink } from 'lucide-react'
import { useDashboardStore, Outlet } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { adminRequest } from '@/lib/admin-client'
import { mapCoordinates } from '@/lib/map-coordinates'
import { useAdminForm } from './ui/useAdminForm'

import { Modal, ModalFooter } from './ui/Modal'
import { Field, Input } from './ui/Field'

// ============================================
// Location Form Component
// ============================================

interface LocationFormProps {
  open: boolean
  outlet?: Outlet | null
  onClose: () => void
  onSubmit: (data: Partial<Outlet>) => Promise<void>
}
function LocationForm({ open, outlet, onClose, onSubmit }: LocationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: '' as string | number,
    longitude: '' as string | number,
  })
  const [link, setLink] = useState('')
  const [mapError, setMapError] = useState('')
  const { saving, error, submit } = useAdminForm(open, onClose)
  useEffect(() => {
    if (!open) return
    const parsed = mapCoordinates(outlet?.mapsUrl || '')
    setFormData({
      name: outlet?.name || '',
      location: outlet?.location || '',
      latitude: outlet?.latitude ?? parsed?.latitude ?? '',
      longitude: outlet?.longitude ?? parsed?.longitude ?? '',
    })
    setLink('')
    setMapError('')
  }, [open, outlet])
  return (
    <Modal
      open={open}
      busy={saving}
      onClose={onClose}
      title="Ubah lokasi outlet"
      description="Perbarui alamat. Titik peta dapat ditambahkan jika diperlukan."
      icon={MapPin}
    >
      <form
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={(event) => {
          event.preventDefault()
          void submit(async () => {
            if ((formData.latitude === '') !== (formData.longitude === ''))
              throw new Error('Isi kedua koordinat atau kosongkan keduanya')
            await onSubmit({
              name: formData.name,
              location: formData.location,
              latitude: formData.latitude === '' ? null : Number(formData.latitude),
              longitude: formData.longitude === '' ? null : Number(formData.longitude),
            })
          })
        }}
      >
        {error && (
          <p role="alert" className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <fieldset disabled={saving} className="contents">
          <div className="space-y-4 overflow-y-auto px-6 py-5">
            <Field label="Nama outlet" required>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Alamat" required>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Field>
            <details className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
              <summary className="cursor-pointer">Atur titik peta (opsional)</summary>
              <div className="mt-3 space-y-3">
                <p className="text-xs text-gray-500">
                  Tempel URL lengkap Google Maps yang memuat koordinat. Untuk tautan pendek, buka
                  dahulu di browser lalu salin URL lengkapnya.
                </p>
                <Input
                  aria-label="Tautan Google Maps"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://www.google.com/maps/..."
                />
                <button
                  type="button"
                  onClick={() => {
                    const point = mapCoordinates(link)
                    if (!point) {
                      setMapError(
                        'Koordinat belum ditemukan. Gunakan URL lengkap Google Maps atau isi koordinat di bawah.'
                      )
                      return
                    }
                    setFormData({ ...formData, ...point })
                    setMapError('')
                  }}
                  className="rounded-lg border px-3 py-2"
                >
                  Gunakan titik dari tautan
                </button>
                {mapError && (
                  <p role="alert" className="text-xs text-red-600">
                    {mapError}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Lintang">
                    <Input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </Field>
                  <Field label="Bujur">
                    <Input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </details>
          </div>
          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border py-2.5 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white"
            >
              {saving ? 'Menyimpan...' : 'Simpan perubahan'}
            </button>
          </ModalFooter>
        </fieldset>
      </form>
    </Modal>
  )
}

export function LocationModule() {
  const { outlets, updateOutlet, searchQuery } = useDashboardStore(
    useShallow((state) => ({
      outlets: state.outlets,
      updateOutlet: state.updateOutlet,
      searchQuery: state.searchQuery,
    }))
  )
  const [showForm, setShowForm] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)

  const filteredOutlets = outlets.filter(
    (outlet) =>
      outlet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outlet.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUpdate = async (data: Partial<Outlet>) => {
    if (!editingOutlet) throw new Error('Pilih outlet terlebih dahulu')
    await adminRequest(`/api/admin/outlets?id=${encodeURIComponent(editingOutlet.id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        address: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
      }),
    })
    useDashboardStore.getState().updateOutlet(editingOutlet.id, {
      ...data,
      mapsUrl:
        data.latitude != null && data.longitude != null
          ? `https://maps.google.com/maps?q=${data.latitude},${data.longitude}&output=embed`
          : '',
    })
    toast.success('Lokasi tersimpan')
  }

  const openMaps = (url: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lokasi</h1>
          <p className="text-gray-500 dark:text-gray-400">Atur alamat dan titik peta outlet.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Cari nama atau alamat lokasi..."
          value={searchQuery}
          onChange={(e) => useDashboardStore.getState().setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOutlets.map((outlet) => (
          <div
            key={outlet.id}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border dark:border-gray-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{outlet.name}</h3>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  outlet.status === 'online'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : outlet.status === 'offline'
                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {outlet.status}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{outlet.location}</p>

            <div className="flex gap-2">
              <button
                disabled={!outlet.mapsUrl}
                title={outlet.mapsUrl ? 'Lihat titik peta' : 'Titik peta belum diatur'}
                onClick={() => openMaps(outlet.mapsUrl)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              >
                <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-white">Lihat peta</span>
              </button>
              <WriteAccess>
                <button
                  onClick={() => {
                    setEditingOutlet(outlet)
                    setShowForm(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                >
                  <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-gray-900 dark:text-white">Ubah</span>
                </button>
              </WriteAccess>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOutlets.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Lokasi tidak ditemukan</p>
        </div>
      )}

      {/* Form Modal */}
      <LocationForm
        open={showForm}
        outlet={editingOutlet}
        onClose={() => {
          setShowForm(false)
          setEditingOutlet(null)
        }}
        onSubmit={handleUpdate}
      />
    </div>
  )
}
