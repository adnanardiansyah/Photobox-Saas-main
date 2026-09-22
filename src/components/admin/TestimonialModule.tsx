'use client'

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
  Loader2
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
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
  onSubmit: (data: any) => void
}

function TestimonialForm({ open, testimonial, onClose, onSubmit }: TestimonialFormProps) {
  const [outlets, setOutlets] = useState<OutletOption[]>([])
  const [formData, setFormData] = useState({
    customerName: testimonial?.customerName || '',
    message: testimonial?.message || '',
    rating: testimonial?.rating || 5,
    outletId: testimonial?.outletId || '',
    isApproved: testimonial?.isApproved ?? false
  })

  useEffect(() => {
    if (!open) return
    fetch('/api/admin/outlets?take=200')
      .then(r => r.json())
      .then(data => { if (data.success) setOutlets(data.data) })
      .catch(() => {})
  }, [open])

  useEffect(() => {
    setFormData({
      customerName: testimonial?.customerName || '',
      message: testimonial?.message || '',
      rating: testimonial?.rating || 5,
      outletId: testimonial?.outletId || '',
      isApproved: testimonial?.isApproved ?? false
    })
  }, [testimonial])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      customerName: formData.customerName,
      message: formData.message,
      rating: formData.rating,
      isApproved: formData.isApproved
    }
    if (formData.outletId) payload.outletId = formData.outletId
    onSubmit(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={testimonial ? 'Edit Testimonial' : 'Add Testimonial'}
      description={testimonial ? 'Perbarui ulasan customer.' : 'Tambahkan ulasan customer baru.'}
      icon={MessageSquare}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Customer Name" required>
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
              <option value="">Select Outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Rating" required>
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

          <Field label="Message" required>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              placeholder="Pesan ulasan dari customer..."
              required
            />
          </Field>

          <Switch
            checked={formData.isApproved}
            onChange={(checked) => setFormData({ ...formData, isApproved: checked })}
            label="Approved"
            description="Ulasan yang disetujui tampil di halaman publik."
          />
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
            {testimonial ? 'Update' : 'Create'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export function TestimonialModule() {
  const { searchQuery } = useDashboardStore()
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
      else toast.error('Failed to load testimonials')
    } catch {
      toast.error('Failed to load testimonials')
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
    const res = await fetch('/api/admin/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Testimonial created successfully!')
      fetchTestimonials()
    } else {
      toast.error(data.error || 'Failed to create testimonial')
    }
  }

  const handleUpdate = async (formData: any) => {
    if (!editingTestimonial) return
    const res = await fetch(`/api/admin/testimonials?id=${editingTestimonial.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Testimonial updated successfully!')
      fetchTestimonials()
    } else {
      toast.error(data.error || 'Failed to update testimonial')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      toast.success('Testimonial deleted successfully!')
      setDeleteConfirm(null)
      fetchTestimonials()
    } else {
      toast.error(data.error || 'Failed to delete testimonial')
    }
  }

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/admin/testimonials?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: true })
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Testimonial approved!')
      fetchTestimonials()
    } else {
      toast.error(data.error || 'Failed to approve testimonial')
    }
  }

  const handleReject = async (id: string) => {
    const res = await fetch(`/api/admin/testimonials?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: false })
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Testimonial rejected!')
      fetchTestimonials()
    } else {
      toast.error(data.error || 'Failed to reject testimonial')
    }
  }

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch =
      testimonial.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testimonial.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'approved' && testimonial.isApproved) ||
      (filterStatus === 'pending' && !testimonial.isApproved)
    return matchesSearch && matchesStatus
  })

  const getOutletName = (outletId: string | null) => {
    if (!outletId) return 'Unknown Outlet'
    const outlet = outlets.find(o => o.id === outletId)
    return outlet?.name || 'Unknown Outlet'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Testimonials</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage customer testimonials and reviews</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Search testimonials..."
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
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTestimonials.map((testimonial) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border dark:border-gray-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-gray-900 dark:text-white">{testimonial.customerName}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                testimonial.isApproved
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {testimonial.isApproved ? 'Approved' : 'Pending'}
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
                <button
                  onClick={() => handleApprove(testimonial.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 text-sm"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Approve
                </button>
              )}
              {testimonial.isApproved && (
                <button
                  onClick={() => handleReject(testimonial.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-sm"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject
                </button>
              )}
              <button
                onClick={() => {
                  setEditingTestimonial(testimonial)
                  setShowForm(true)
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              >
                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-white">Edit</span>
              </button>
              <button
                onClick={() => setDeleteConfirm(testimonial.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm"
              >
                <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-white">Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTestimonials.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No testimonials found</p>
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
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Testimonial?"
        description="This action cannot be undone. Are you sure you want to delete this testimonial?"
        icon={Trash2}
        size="sm"
      >
        <div className="px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2.5 rounded-xl border dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
