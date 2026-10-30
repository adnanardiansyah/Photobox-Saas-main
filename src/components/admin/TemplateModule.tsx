'use client'
import { WriteAccess } from './ui/WriteAccess'

import { useShallow } from 'zustand/react/shallow'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
  LayoutTemplate,
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { adminRequest } from '@/lib/admin-client'
import { ImageUpload } from './ui/ImageUpload'
import { useAdminForm } from './ui/useAdminForm'

import { Modal, ModalFooter } from './ui/Modal'
import { Field, Input, Select, Switch } from './ui/Field'

interface TemplateData {
  id: string
  name: string
  type: string
  imageUrl: string
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  price: number
  isActive: boolean
  createdAt: string
}

interface TemplateFormProps {
  open: boolean
  template?: TemplateData | null
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

function TemplateForm({ open, template, onClose, onSubmit }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'FOUR_R',
    imageUrl: template?.imageUrl || '',
    price: template?.price ?? 0,
    isActive: template?.isActive ?? true,
  })

  useEffect(() => {
    setFormData({
      name: template?.name || '',
      type: template?.type || 'FOUR_R',
      imageUrl: template?.imageUrl || '',
      price: template?.price ?? 0,
      isActive: template?.isActive ?? true,
    })
  }, [template, open])

  const [uploading, setUploading] = useState(false)
  const { saving, error, submit } = useAdminForm(open, onClose)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submit(async () => {
      if (uploading) throw new Error('Tunggu unggahan gambar selesai')
      if (!formData.imageUrl.trim()) throw new Error('Unggah gambar template terlebih dahulu')
      await onSubmit(formData)
    })
  }

  return (
    <Modal
      busy={saving || uploading}
      open={open}
      onClose={onClose}
      title={template ? 'Ubah template' : 'Tambah template'}
      description={
        template ? 'Perbarui template cetak photo booth.' : 'Tambahkan template cetak baru.'
      }
      icon={LayoutTemplate}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        {error && (
          <p
            role="alert"
            className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
          >
            {error}
          </p>
        )}
        <fieldset disabled={saving} className="contents">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <Field label="Nama template" required>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. 4R Classic"
                required
              />
            </Field>

            <Field label="Jenis" required>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="FOUR_R">4R</option>
                <option value="A4_NEWSPAPER">Koran A4</option>
                <option value="CUSTOM">Kustom</option>
              </Select>
            </Field>

            <Field label="Gambar template" required>
              <ImageUpload
                folder="templates"
                value={formData.imageUrl ? [formData.imageUrl] : []}
                onChange={(urls) => setFormData((state) => ({ ...state, imageUrl: urls[0] || '' }))}
                disabled={saving}
                onBusyChange={setUploading}
              />
            </Field>
            <details className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
              <summary className="cursor-pointer text-gray-600 dark:text-gray-300">
                Gunakan tautan gambar (opsional)
              </summary>
              <Input
                className="mt-3"
                type="text"
                aria-label="Tautan gambar template"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://... atau /photos/template.png"
              />
            </details>

            <Field label="Harga (Rp)" required>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 25000"
                required
                min="0"
              />
            </Field>

            <Switch
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              label="Aktif"
              description="Template aktif tersedia untuk dipilih pelanggan."
            />
          </div>

          <ModalFooter>
            <button
              type="button"
              disabled={uploading}
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25"
            >
              {saving ? 'Menyimpan...' : template ? 'Simpan perubahan' : 'Simpan'}
            </button>
          </ModalFooter>
        </fieldset>
      </form>
    </Modal>
  )
}

export function TemplateModule() {
  const { searchQuery } = useDashboardStore(
    useShallow((state) => ({ searchQuery: state.searchQuery }))
  )
  const [templates, setTemplates] = useState<TemplateData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/frameTemplates')
      const data = await res.json()
      if (data.success) setTemplates(data.data)
      else toast.error('Daftar template belum dapat dimuat. Coba muat ulang menu.')
    } catch {
      toast.error('Daftar template belum dapat dimuat. Coba muat ulang menu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleCreate = async (formData: any) => {
    await adminRequest('/api/admin/frameTemplates', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    toast.success('Data berhasil ditambahkan')
    void fetchTemplates()
  }
  const handleUpdate = async (formData: any) => {
    if (!editingTemplate) throw new Error('Pilih data yang akan diubah')
    await adminRequest(`/api/admin/frameTemplates?id=${encodeURIComponent(editingTemplate.id)}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    })
    toast.success('Perubahan berhasil disimpan')
    void fetchTemplates()
  }

  const [deleting, setDeleting] = useState(false)
  const handleDelete = async (id: string) => {
    if (deleting) return
    setDeleting(true)
    try {
      await adminRequest(`/api/admin/frameTemplates?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      toast.success('Data berhasil dihapus')
      setDeleteConfirm(null)
      void fetchTemplates()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || template.type === filterType
    return matchesSearch && matchesType
  })

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      FOUR_R: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      A4_NEWSPAPER: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      CUSTOM: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    }
    return styles[type] || styles.FOUR_R
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FOUR_R: '4R',
      A4_NEWSPAPER: 'Koran A4',
      CUSTOM: 'Kustom',
    }
    return labels[type] || type
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Template bingkai</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Unggah dan kelola bingkai foto yang tersedia di booth.
          </p>
        </div>
        <WriteAccess>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Tambah template
          </button>
        </WriteAccess>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Cari nama template..."
            value={searchQuery}
            onChange={(e) => useDashboardStore.getState().setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Semua jenis</option>
          <option value="FOUR_R">4R</option>
          <option value="A4_NEWSPAPER">Koran A4</option>
          <option value="CUSTOM">Kustom</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border dark:border-gray-800"
          >
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {template.imageUrl ? (
                <img
                  src={template.imageUrl}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-300" />
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getTypeBadge(template.type)}`}>
                  {getTypeLabel(template.type)}
                </span>
              </div>

              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-3">
                {formatPrice(template.price)}
              </p>

              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    template.isActive
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {template.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div className="flex gap-2">
                <WriteAccess>
                  <button
                    onClick={() => {
                      setEditingTemplate(template)
                      setShowForm(true)
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                  >
                    <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-gray-900 dark:text-white">Ubah</span>
                  </button>
                </WriteAccess>
                <WriteAccess>
                  <button
                    onClick={() => setDeleteConfirm(template.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm"
                  >
                    <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-gray-900 dark:text-white">Hapus</span>
                  </button>
                </WriteAccess>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Template tidak ditemukan</p>
        </div>
      )}

      <TemplateForm
        open={showForm}
        template={editingTemplate}
        onClose={() => {
          setShowForm(false)
          setEditingTemplate(null)
        }}
        onSubmit={editingTemplate ? handleUpdate : handleCreate}
      />

      {/* Delete confirmation */}
      <Modal
        busy={deleting}
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Nonaktifkan template?"
        description="Template akan dinonaktifkan sehingga tidak muncul di booth. Riwayat sesi yang memakainya tetap tersimpan. Lanjutkan?"
        icon={Trash2}
        size="sm"
      >
        <div className="px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2.5 rounded-xl border dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors"
            disabled={deleting}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25"
            disabled={deleting}
          >
            Hapus
          </button>
        </div>
      </Modal>
    </div>
  )
}
