'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Copy, Check, RefreshCw, Loader2, QrCode, X } from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
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
  const { searchQuery } = useDashboardStore()
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
      else toast.error('Failed to fetch galleries')
    } catch {
      toast.error('Failed to fetch galleries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGalleries() }, [])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Gallery code copied!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleViewGallery = (code: string) => {
    window.open(`/gallery?code=${code}`, '_blank')
  }

  const filteredGalleries = galleries.filter(gallery =>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gallery Management</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage photo galleries and codes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchGalleries}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Add Gallery
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search galleries..."
          value={searchQuery}
          onChange={(e) => useDashboardStore.getState().setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGalleries.map((gallery, i) => (
          <motion.div
            key={gallery.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{gallery.galleryCode}</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  gallery.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {gallery.status}
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {gallery.outlet} &bull; {gallery.frame}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {gallery.photos.slice(0, 4).map((photo, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/placeholder-image.png' }}
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
                    {copiedCode === gallery.galleryCode ? 'Copied!' : 'Copy Code'}
                  </span>
                </button>
                <button
                  onClick={() => handleViewGallery(gallery.galleryCode)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>

              <div className="mt-4 pt-3 border-t dark:border-gray-800 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Rp {gallery.totalPrice.toLocaleString()}</span>
                <span>{new Date(gallery.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredGalleries.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <QrCode className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No galleries match your search' : 'No galleries found'}
          </p>
        </motion.div>
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

function AddGalleryModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [galleryCode, setGalleryCode] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [photoInput, setPhotoInput] = useState('')
  const [totalPrice, setTotalPrice] = useState(25000)
  const [saving, setSaving] = useState(false)

  const handleAddPhoto = () => {
    if (photoInput.trim()) {
      setPhotos([...photos, photoInput.trim()])
      setPhotoInput('')
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (galleryCode.trim() && photos.length === 0) {
      toast.error('Photos are required when providing gallery code')
      return
    }

    setSaving(true)
    try {
      const payload: any = { totalPrice }
      if (galleryCode.trim()) {
        payload.galleryCode = galleryCode.trim()
        payload.photos = photos
      } else {
        const outletRes = await fetch('/api/admin/outlets')
        const outletData = await outletRes.json()
        if (outletData.success && outletData.data.length > 0) {
          payload.outletId = outletData.data[0].id
        } else {
          toast.error('No outlet found')
          return
        }
      }

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(galleryCode.trim() ? 'Gallery added!' : 'Gallery session created!')
        onSuccess()
      } else {
        toast.error(data.error || 'Failed to add gallery')
      }
    } catch {
      toast.error('Failed to add gallery')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Gallery"
      description="Buat galeri baru atau hubungkan dengan kode galeri."
      icon={Plus}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Gallery Code" hint="Kosongkan untuk auto-generate.">
            <Input
              type="text"
              value={galleryCode}
              onChange={(e) => setGalleryCode(e.target.value.toUpperCase())}
              placeholder="e.g. MHN2"
            />
          </Field>

          <Field label="Total Price (Rp)" required>
            <Input
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(Number(e.target.value))}
              min="0"
            />
          </Field>

          <Field label="Photos" hint="Tambahkan URL foto satu per satu.">
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="/photos/photo1.jpg"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPhoto() } }}
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium shrink-0"
              >
                Add
              </button>
            </div>
            {photos.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {photos.map((photo, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{photo}</span>
                    <button type="button" onClick={() => handleRemovePhoto(index)} className="text-red-500 hover:text-red-700 shrink-0 ml-2 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? 'Adding...' : 'Add Gallery'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
