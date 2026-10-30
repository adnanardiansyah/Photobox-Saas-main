'use client'
import { WriteAccess } from './ui/WriteAccess'

import { useShallow } from 'zustand/react/shallow'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { adminRequest } from '@/lib/admin-client'
import { useAdminForm } from './ui/useAdminForm'

import { Modal, ModalFooter } from './ui/Modal'
import { Field, Input, Select, Textarea, Switch } from './ui/Field'

interface TestimonialData {
  id: string
  customerName: string
  message: string
  rating: number
  outletId: string | null
  isApproved: boolean
  createdAt: string
}

interface OutletOption {
  id: string
  name: string
}

interface TestimonialFormProps {
  open: boolean
  testimonial?: TestimonialData | null
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

function TestimonialForm({ open, testimonial, onClose, onSubmit }: TestimonialFormProps) {
  const [outlets, setOutlets] = useState<OutletOption[]>([])
  const [formData, setFormData] = useState({
    customerName: testimonial?.customerName || '',
    message: testimonial?.message || '',
    rating: testimonial?.rating || 5,
    outletId: testimonial?.outletId || '',
    isApproved: testimonial?.isApproved ?? false,
  })

  useEffect(() => {
    if (!open) return
    fetch('/api/admin/outlets?take=200')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOutlets(data.data)
      })
      .catch(() => {})
  }, [open])

  useEffect(() => {
    setFormData({
      customerName: testimonial?.customerName || '',
      message: testimonial?.message || '',
      rating: testimonial?.rating || 5,
      outletId: testimonial?.outletId || '',
      isApproved: testimonial?.isApproved ?? false,
    })
  }, [testimonial, open])

  const { saving, error, submit } = useAdminForm(open, onClose)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submit(async () => {
      const payload: any = {
        customerName: formData.customerName,
        message: formData.message,
        rating: formData.rating,
        isApproved: formData.isApproved,
      }
      if (formData.outletId) payload.outletId = formData.outletId
      await onSubmit(payload)
    })
  }

  return (
    <Modal
      busy={saving}
      open={open}
      onClose={onClose}
      title={testimonial ? 'Ubah testimoni' : 'Tambah testimoni'}
      description={testimonial ? 'Perbarui ulasan pelanggan.' : 'Tambahkan ulasan pelanggan baru.'}
      icon={MessageSquare}
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
            <Field label="Nama pelanggan" required>
              <Input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="e.g. Rina Kartika"
                required
              />
            </Field>

            <Field label="Outlet">
              <Select
                value={formData.outletId}
                onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
              >
                <option value="">Pilih outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Penilaian" required>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= formData.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Pesan" required>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                placeholder="Tulis ulasan pelanggan..."
                required
              />
            </Field>

            <Switch
              checked={formData.isApproved}
              onChange={(checked) => setFormData({ ...formData, isApproved: checked })}
              label="Disetujui"
              description="Ulasan yang disetujui tampil di halaman publik."
            />
          </div>

          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25"
            >
              {saving ? 'Menyimpan...' : testimonial ? 'Simpan perubahan' : 'Simpan'}
            </button>
          </ModalFooter>
        </fieldset>
      </form>
    </Modal>
  )
}

export function TestimonialModule() {
  const { searchQuery } = useDashboardStore(
    useShallow((state) => ({ searchQuery: state.searchQuery }))
  )
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([])
  const [outlets, setOutlets] = useState<OutletOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/admin/testimonials')
      const data = await res.json()
      if (data.success) setTestimonials(data.data)
      else toast.error('Daftar testimoni belum dapat dimuat. Coba muat ulang menu.')
    } catch {
      toast.error('Daftar testimoni belum dapat dimuat. Coba muat ulang menu.')
    } finally {
      setLoading(false)
    }
  }

  const fetchOutlets = async () => {
    try {
      const res = await fetch('/api/admin/outlets?take=200')
      const data = await res.json()
      if (data.success) setOutlets(data.data)
    } catch {}
  }

  useEffect(() => {
    fetchTestimonials()
    fetchOutlets()
  }, [])

  const handleCreate = async (formData: any) => {
    await adminRequest('/api/admin/testimonials', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    toast.success('Data berhasil ditambahkan')
    void fetchTestimonials()
  }
  const handleUpdate = async (formData: any) => {
    if (!editingTestimonial) throw new Error('Pilih data yang akan diubah')
    await adminRequest(`/api/admin/testimonials?id=${encodeURIComponent(editingTestimonial.id)}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    })
    toast.success('Perubahan berhasil disimpan')
    void fetchTestimonials()
  }

  const [deleting, setDeleting] = useState(false)
  const handleDelete = async (id: string) => {
    if (deleting) return
    setDeleting(true)
    try {
      await adminRequest(`/api/admin/testimonials?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      toast.success('Data berhasil dihapus')
      setDeleteConfirm(null)
      void fetchTestimonials()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await adminRequest(`/api/admin/testimonials?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ isApproved: true }),
      })
      toast.success('Testimoni disetujui')
      void fetchTestimonials()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyetujui testimoni')
    }
  }
  const handleReject = async (id: string) => {
    try {
      await adminRequest(`/api/admin/testimonials?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ isApproved: false }),
      })
      toast.success('Persetujuan testimoni dibatalkan')
      void fetchTestimonials()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui testimoni')
    }
  }

  const filteredTestimonials = testimonials.filter((testimonial) => {
    const matchesSearch =
      testimonial.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testimonial.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'approved' && testimonial.isApproved) ||
      (filterStatus === 'pending' && !testimonial.isApproved)
    return matchesSearch && matchesStatus
  })

  const getOutletName = (outletId: string | null) => {
    if (!outletId) return 'Outlet tidak diketahui'
    const outlet = outlets.find((o) => o.id === outletId)
    return outlet?.name || 'Outlet tidak diketahui'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Testimoni</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Kelola ulasan pelanggan dan persetujuan tampil di halaman publik.
          </p>
        </div>
        <WriteAccess>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Tambah testimoni
          </button>
        </WriteAccess>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Cari nama pelanggan atau pesan..."
            value={searchQuery}
            onChange={(e) => useDashboardStore.getState().setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Semua status</option>
          <option value="approved">Disetujui</option>
          <option value="pending">Menunggu persetujuan</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTestimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border dark:border-gray-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {testimonial.customerName}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  testimonial.isApproved
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}
              >
                {testimonial.isApproved ? 'Disetujui' : 'Menunggu persetujuan'}
              </span>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= testimonial.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
              &ldquo;{testimonial.message}&rdquo;
            </p>

            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              <p>{getOutletName(testimonial.outletId)}</p>
              <p>{formatDate(testimonial.createdAt)}</p>
            </div>

            <div className="flex gap-2">
              {!testimonial.isApproved && (
                <WriteAccess>
                  <button
                    onClick={() => handleApprove(testimonial.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 text-sm"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Setujui
                  </button>
                </WriteAccess>
              )}
              {testimonial.isApproved && (
                <WriteAccess>
                  <button
                    onClick={() => handleReject(testimonial.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-sm"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Batalkan persetujuan
                  </button>
                </WriteAccess>
              )}
              <WriteAccess>
                <button
                  onClick={() => {
                    setEditingTestimonial(testimonial)
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
                  onClick={() => setDeleteConfirm(testimonial.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm"
                >
                  <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-gray-900 dark:text-white">Hapus</span>
                </button>
              </WriteAccess>
            </div>
          </div>
        ))}
      </div>

      {filteredTestimonials.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Testimoni tidak ditemukan</p>
        </div>
      )}

      <TestimonialForm
        open={showForm}
        testimonial={editingTestimonial}
        onClose={() => {
          setShowForm(false)
          setEditingTestimonial(null)
        }}
        onSubmit={editingTestimonial ? handleUpdate : handleCreate}
      />

      {/* Delete confirmation */}
      <Modal
        busy={deleting}
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus testimoni?"
        description="Testimoni ini akan dihapus permanen. Lanjutkan?"
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
