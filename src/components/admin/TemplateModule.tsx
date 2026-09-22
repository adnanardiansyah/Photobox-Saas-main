'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
  LayoutTemplate
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
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
  onSubmit: (data: any) => void
}

function TemplateForm({ open, template, onClose, onSubmit }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'FOUR_R',
    imageUrl: template?.imageUrl || '',
    price: template?.price ?? 0,
    isActive: template?.isActive ?? true
  })

  useEffect(() => {
    setFormData({
      name: template?.name || '',
      type: template?.type || 'FOUR_R',
      imageUrl: template?.imageUrl || '',
      price: template?.price ?? 0,
      isActive: template?.isActive ?? true
    })
  }, [template])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={template ? 'Edit Template' : 'Add New Template'}
      description={template ? 'Perbarui template cetak photo booth.' : 'Tambahkan template cetak baru.'}
      icon={LayoutTemplate}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Template Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 4R Classic"
              required
            />
          </Field>

          <Field label="Type" required>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="FOUR_R">4R</option>
              <option value="A4_NEWSPAPER">A4 Newspaper</option>
              <option value="CUSTOM">Custom</option>
            </Select>
          </Field>

          <Field label="Image URL">
            <Input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://.../template.png"
            />
            {formData.imageUrl && (
              <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            )}
          </Field>

          <Field label="Price (Rp)" required>
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
            label="Active"
            description="Template aktif tersedia untuk dipilih customer."
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
            {template ? 'Update' : 'Create'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export function TemplateModule() {
  const { searchQuery } = useDashboardStore()
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
      else toast.error('Failed to load templates')
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTemplates() }, [])

  const handleCreate = async (formData: any) => {
    const res = await fetch('/api/admin/frameTemplates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Template created successfully!')
      fetchTemplates()
    } else {
      toast.error(data.error || 'Failed to create template')
    }
  }

  const handleUpdate = async (formData: any) => {
    if (!editingTemplate) return
    const res = await fetch(`/api/admin/frameTemplates?id=${editingTemplate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Template updated successfully!')
      fetchTemplates()
    } else {
      toast.error(data.error || 'Failed to update template')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/frameTemplates?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      toast.success('Template deleted successfully!')
      setDeleteConfirm(null)
      fetchTemplates()
    } else {
      toast.error(data.error || 'Failed to delete template')
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || template.type === filterType
    return matchesSearch && matchesType
  })

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      FOUR_R: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      A4_NEWSPAPER: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      CUSTOM: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
    }
    return styles[type] || styles.FOUR_R
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FOUR_R: '4R',
      A4_NEWSPAPER: 'A4 Newspaper',
      CUSTOM: 'Custom'
    }
    return labels[type] || type
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Template Frames</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your photo booth frame templates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Search templates..."
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
          <option value="all">All Types</option>
          <option value="FOUR_R">4R</option>
          <option value="A4_NEWSPAPER">A4 Newspaper</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                <span className={`text-xs px-2 py-1 rounded-full ${
                  template.isActive
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingTemplate(template)
                    setShowForm(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                >
                  <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-gray-900 dark:text-white">Edit</span>
                </button>
                <button
                  onClick={() => setDeleteConfirm(template.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm"
                >
                  <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-gray-900 dark:text-white">Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No templates found</p>
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
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Template?"
        description="This action cannot be undone. Are you sure you want to delete this template?"
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
