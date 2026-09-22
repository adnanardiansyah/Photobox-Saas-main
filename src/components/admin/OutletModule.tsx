'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Cpu,
  Globe,
  Loader2,
  Store
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Modal, ModalFooter } from './ui/Modal'
import { Field, Input, Switch } from './ui/Field'

interface OutletData {
  id: string
  name: string
  address: string
  phone: string
  latitude: number
  longitude: number
  isActive: boolean
  machineId: string
  createdAt: string
}

interface OutletFormProps {
  open: boolean
  outlet?: OutletData | null
  onClose: () => void
  onSubmit: (data: {
    name: string
    address: string
    phone: string
    latitude: number
    longitude: number
    isActive: boolean
    machineId: string
  }) => void
}

function OutletForm({ open, outlet, onClose, onSubmit }: OutletFormProps) {
  const [formData, setFormData] = useState({
    name: outlet?.name || '',
    address: outlet?.address || '',
    phone: outlet?.phone || '',
    latitude: outlet?.latitude ?? 0,
    longitude: outlet?.longitude ?? 0,
    isActive: outlet?.isActive ?? true,
    machineId: outlet?.machineId || ''
  })

  useEffect(() => {
    setFormData({
      name: outlet?.name || '',
      address: outlet?.address || '',
      phone: outlet?.phone || '',
      latitude: outlet?.latitude ?? 0,
      longitude: outlet?.longitude ?? 0,
      isActive: outlet?.isActive ?? true,
      machineId: outlet?.machineId || ''
    })
  }, [outlet])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude)
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={outlet ? 'Edit Outlet' : 'Add New Outlet'}
      description={outlet ? 'Perbarui detail outlet photo booth Anda.' : 'Buat outlet photo booth baru untuk tim Anda.'}
      icon={Store}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Outlet Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Trans Studio Mall"
              required
            />
          </Field>

          <Field label="Address" required>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Jl. Jend. Sudirman No. 12"
              required
            />
          </Field>

          <Field label="Phone">
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+62 812 3456 7890"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" required>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value as unknown as number })}
                placeholder="-6.2088"
                required
              />
            </Field>
            <Field label="Longitude" required>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value as unknown as number })}
                placeholder="106.8456"
                required
              />
            </Field>
          </div>

          <Field label="Machine ID" hint="ID mesin photo booth agar sesi foto terhubung otomatis.">
            <Input
              value={formData.machineId}
              onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
              placeholder="e.g. PB-0001"
            />
          </Field>

          <Switch
            checked={formData.isActive}
            onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            label="Active"
            description="Outlet aktif akan terlihat dan terpakai di aplikasi."
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
            {outlet ? 'Update' : 'Create'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export function OutletModule() {
  const { searchQuery } = useDashboardStore()
  const [outlets, setOutlets] = useState<OutletData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<OutletData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const parseRes = async (res: Response) => {
    try {
      return await res.json()
    } catch {
      return { success: false, error: `Server error (${res.status}) - respons bukan JSON` }
    }
  }

  const fetchOutlets = async () => {
    try {
      const res = await fetch('/api/admin/outlets')
      const data = await parseRes(res)
      if (data.success) setOutlets(data.data)
      else toast.error('Failed to load outlets')
    } catch {
      toast.error('Failed to load outlets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOutlets() }, [])

  const handleCreate = async (formData: any) => {
    const res = await fetch('/api/admin/outlets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await parseRes(res)
    if (data.success) {
      toast.success('Outlet created successfully!')
      fetchOutlets()
    } else {
      toast.error(data.error || 'Failed to create outlet')
    }
  }

  const handleUpdate = async (formData: any) => {
    if (!editingOutlet) return
    const res = await fetch(`/api/admin/outlets?id=${editingOutlet.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await parseRes(res)
    if (data.success) {
      toast.success('Outlet updated successfully!')
      fetchOutlets()
    } else {
      toast.error(data.error || 'Failed to update outlet')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/outlets?id=${id}`, { method: 'DELETE' })
    const data = await parseRes(res)
    if (data.success) {
      toast.success('Outlet deleted successfully!')
      setDeleteConfirm(null)
      fetchOutlets()
    } else {
      toast.error(data.error || 'Failed to delete outlet')
    }
  }

  const filteredOutlets = outlets.filter(outlet =>
    outlet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    outlet.address.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outlet Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your photo booth outlets</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add Outlet
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search outlets..."
          value={searchQuery}
          onChange={(e) => useDashboardStore.getState().setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

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
                <div className={`w-2.5 h-2.5 rounded-full ${outlet.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <h3 className="font-semibold text-gray-900 dark:text-white">{outlet.name}</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                outlet.isActive
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {outlet.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{outlet.address}</span>
              </div>
              {outlet.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{outlet.phone}</span>
                </div>
              )}
              {outlet.machineId && (
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs">{outlet.machineId}</span>
                </div>
              )}
              {(outlet.latitude || outlet.longitude) && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{outlet.latitude}, {outlet.longitude}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
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
              <button
                onClick={() => setDeleteConfirm(outlet.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm"
              >
                <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-white">Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredOutlets.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No outlets found</p>
        </div>
      )}

      <OutletForm
        open={showForm}
        outlet={editingOutlet}
        onClose={() => {
          setShowForm(false)
          setEditingOutlet(null)
        }}
        onSubmit={editingOutlet ? handleUpdate : handleCreate}
      />

      {/* Delete confirmation */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Outlet?"
        description="This action cannot be undone. Are you sure you want to delete this outlet?"
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
