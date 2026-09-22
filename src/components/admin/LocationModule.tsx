'use client'

import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Search, 
  Edit, 
  Plus,
  ExternalLink
} from 'lucide-react'
import { useDashboardStore, Outlet } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Modal, ModalFooter } from './ui/Modal'
import { Field, Input } from './ui/Field'

// ============================================
// Location Form Component
// ============================================

interface LocationFormProps {
  open: boolean
  outlet?: Outlet | null
  onClose: () => void
  onSubmit: (data: Partial<Outlet>) => void
}

function LocationForm({ open, outlet, onClose, onSubmit }: LocationFormProps) {
  const [formData, setFormData] = useState({
    name: outlet?.name || '',
    location: outlet?.location || '',
    mapsUrl: outlet?.mapsUrl || ''
  })

  // Update form when outlet prop changes (for edit mode)
  useEffect(() => {
    setFormData({
      name: outlet?.name || '',
      location: outlet?.location || '',
      mapsUrl: outlet?.mapsUrl || ''
    })
  }, [outlet])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={outlet ? 'Edit Location' : 'Add Location'}
      description={outlet ? 'Perbarui lokasi outlet Anda.' : 'Tambahkan lokasi outlet baru.'}
      icon={MapPin}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Location Name" required>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Grand Indonesia"
              required
            />
          </Field>

          <Field label="Address" required>
            <Input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Jl. M.H. Thamrin No. 1"
              required
            />
          </Field>

          <Field label="Pick Location on Map">
            <div className="space-y-2">
              <div className="relative w-full h-48 rounded-xl overflow-hidden border dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <iframe
                  id="map-embed"
                  className="w-full h-full"
                  src={formData.mapsUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126748.56398935027!2d106.698688671875!3d-6.208763868808566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5390917b5c7%3A0x2e69f5390917b5c7!2sJakarta!5e0!3m2!1sen!2sid!4v1620000000000!5m2!1sen!2sid"}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <button
                type="button"
                onClick={() => window.open('https://www.google.com/maps', '_blank')}
                className="w-full px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Open Google Maps
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {`1. Klik tombol di atas untuk membuka Google Maps
2. Cari lokasi yang diinginkan
3. Klik Share -> Embed a map
4. Salin URL src lalu tempel di bawah`}
              </p>

              <Input
                type="url"
                value={formData.mapsUrl}
                onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                placeholder="Paste Google Maps embed URL here..."
                required
              />
            </div>
          </Field>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25"
          >
            {outlet ? 'Update' : 'Create'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

// ============================================
// Location Module Component
// ============================================

export function LocationModule() {
  const { outlets, updateOutlet, searchQuery } = useDashboardStore()
  const [showForm, setShowForm] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)

  const filteredOutlets = outlets.filter(outlet =>
    outlet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    outlet.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUpdate = (data: Partial<Outlet>) => {
    if (editingOutlet) {
      updateOutlet(editingOutlet.id, data)
      toast.success('Location updated successfully!')
    }
  }

  const openMaps = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Locations</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage outlet locations and maps</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => useDashboardStore.getState().setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOutlets.map((outlet) => (
          <motion.div
            key={outlet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border dark:border-gray-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{outlet.name}</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                outlet.status === 'online'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : outlet.status === 'offline'
                  ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {outlet.status}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {outlet.location}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => openMaps(outlet.mapsUrl)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              >
                <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-white">Open Map</span>
              </button>
              <button
                onClick={() => {
                  setEditingOutlet(outlet)
                  setShowForm(true)
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-white">Edit</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOutlets.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No locations found</p>
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
