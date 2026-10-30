'use client'
import { WriteAccess } from './ui/WriteAccess'

import { useShallow } from 'zustand/react/shallow'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Gift,
  Percent,
  DollarSign,
  Calendar,
  Check,
  Copy,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { adminRequest } from '@/lib/admin-client'
import { useAdminForm } from './ui/useAdminForm'

import { Modal, ModalFooter } from './ui/Modal'
import { Field, Input, Select, Switch } from './ui/Field'

const ease = [0.22, 1, 0.36, 1] as const

interface VoucherData {
  id: string
  code: string
  type: string
  value: number
  minOrder: number
  maxUses: number
  usedCount: number
  usageType: string
  validFrom: string
  validUntil: string
  isActive: boolean
  createdAt: string
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Kode voucher disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title="Copy kode"
    >
      {copied ? (
        <span key="check">
          <Check className="w-4 h-4 text-green-500" />
        </span>
      ) : (
        <span key="copy">
          <Copy className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </span>
      )}
    </button>
  )
}

interface VoucherFormProps {
  open: boolean
  voucher?: VoucherData | null
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

function VoucherForm({ open, voucher, onClose, onSubmit }: VoucherFormProps) {
  const [formData, setFormData] = useState({
    code: voucher?.code || '',
    type: voucher?.type || 'PERCENTAGE',
    value: voucher?.value ?? 0,
    minOrder: voucher?.minOrder ?? 0,
    maxUses: voucher?.maxUses ?? 100,
    usageType: voucher?.usageType || 'MULTI_USE',
    validFrom: voucher?.validFrom
      ? new Date(voucher.validFrom).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      : new Date().toISOString().split('T')[0],
    validUntil: voucher?.validUntil
      ? new Date(voucher.validUntil).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: voucher?.isActive ?? true,
  })

  useEffect(() => {
    setFormData({
      code: voucher?.code || '',
      type: voucher?.type || 'PERCENTAGE',
      value: voucher?.value ?? 0,
      minOrder: voucher?.minOrder ?? 0,
      maxUses: voucher?.maxUses ?? 100,
      usageType: voucher?.usageType || 'MULTI_USE',
      validFrom: voucher?.validFrom
        ? new Date(voucher.validFrom).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
        : new Date().toISOString().split('T')[0],
      validUntil: voucher?.validUntil
        ? new Date(voucher.validUntil).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: voucher?.isActive ?? true,
    })
  }, [voucher, open])

  const { saving, error, submit } = useAdminForm(open, onClose)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submit(async () => {
      if (formData.validUntil < formData.validFrom)
        throw new Error('Tanggal berakhir harus setelah tanggal mulai')
      await onSubmit({
        ...formData,
        value: Number(formData.value),
        minOrder: Number(formData.minOrder),
        maxUses: Number(formData.maxUses) || null,
        validFrom: new Date(`${formData.validFrom}T00:00:00+07:00`).toISOString(),
        validUntil: new Date(`${formData.validUntil}T23:59:59.999+07:00`).toISOString(),
      })
    })
  }

  return (
    <Modal
      busy={saving}
      open={open}
      onClose={onClose}
      title={voucher ? 'Ubah voucher' : 'Buat voucher'}
      description={
        voucher
          ? 'Perbarui detail voucher promo Anda.'
          : 'Buat voucher diskon baru untuk pelanggan.'
      }
      icon={Gift}
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
            <Field label="Kode Voucher" required hint="Kode dipakai pelanggan saat checkout.">
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                placeholder="e.g. PROMO50"
              />
            </Field>

            <Field label="Tipe Diskon" required>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED">Nominal Tetap (Rp)</option>
              </Select>
            </Field>

            <Field
              label={`Nilai ${formData.type === 'PERCENTAGE' ? '(%)' : '(Rp)'}`}
              required
              hint={formData.type === 'PERCENTAGE' ? 'Maksimal 100%.' : undefined}
            >
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                required
                min="0"
                max={formData.type === 'PERCENTAGE' ? 100 : undefined}
              />
            </Field>

            <Field label="Minimum Pembelian (Rp)" required>
              <Input
                type="number"
                value={formData.minOrder}
                onChange={(e) =>
                  setFormData({ ...formData, minOrder: parseInt(e.target.value) || 0 })
                }
                required
                min="0"
              />
            </Field>

            <Field label="Tipe Pemakaian" required>
              <Select
                value={formData.usageType}
                onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
              >
                <option value="MULTI_USE">Berkali-kali</option>
                <option value="SINGLE_USE">Sekali pakai</option>
              </Select>
            </Field>

            {formData.usageType === 'MULTI_USE' && (
              <div>
                <Field label="Batas Pemakaian" required>
                  <Input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })
                    }
                    required
                    min="1"
                  />
                </Field>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {(['validFrom', 'validUntil'] as const).map((field) => (
                <Field
                  key={field}
                  label={field === 'validFrom' ? 'Berlaku Dari' : 'Berlaku Sampai'}
                  required
                >
                  <Input
                    type="date"
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    required
                  />
                </Field>
              ))}
            </div>

            <Switch
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              label="Aktifkan Voucher"
              description="Voucher aktif dapat dipakai pelanggan."
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow"
            >
              {saving ? 'Menyimpan...' : voucher ? 'Simpan perubahan' : 'Simpan voucher'}
            </button>
          </ModalFooter>
        </fieldset>
      </form>
    </Modal>
  )
}

function VoucherCard({
  voucher,
  index,
  onEdit,
  onDelete,
  formatPrice,
  formatDate,
}: {
  voucher: VoucherData
  index: number
  onEdit: () => void
  onDelete: () => void
  formatPrice: (n: number) => string
  formatDate: (s: string) => string
}) {
  const usagePct =
    voucher.maxUses > 0 ? Math.min((voucher.usedCount / voucher.maxUses) * 100, 100) : 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden group">
      <div
        className="h-1 w-full transition-colors duration-150"
        style={{
          background: voucher.isActive ? 'linear-gradient(90deg, #ec4899, #7c3aed)' : '#e5e7eb',
        }}
      />

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div>
              <Gift className="w-5 h-5 text-purple-500" />
            </div>
            <span className="font-mono font-bold text-base tracking-widest text-gray-900 dark:text-white">
              {voucher.code}
            </span>
          </div>
          <CopyButton code={voucher.code} />
        </div>

        <div className="flex items-baseline gap-1.5 mb-4">
          {voucher.type === 'PERCENTAGE' ? (
            <Percent className="w-5 h-5 text-emerald-500 self-center" />
          ) : (
            <DollarSign className="w-5 h-5 text-emerald-500 self-center" />
          )}
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {voucher.type === 'PERCENTAGE' ? `${voucher.value}%` : formatPrice(voucher.value)}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 self-end pb-0.5">diskon</span>
        </div>

        <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex justify-between">
            <span>Min. pembelian</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {formatPrice(voucher.minOrder)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tipe</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {voucher.usageType === 'SINGLE_USE' ? 'Sekali pakai' : 'Berkali-kali'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {formatDate(voucher.validFrom)} – {formatDate(voucher.validUntil)}
            </span>
          </div>
        </div>

        {voucher.usageType === 'MULTI_USE' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500 dark:text-gray-400">Pemakaian</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {voucher.usedCount} / {voucher.maxUses}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${usagePct}%`,
                  background:
                    usagePct > 80 ? '#ef4444' : 'linear-gradient(90deg, #ec4899, #7c3aed)',
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
              voucher.isActive
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${voucher.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}
            />
            {voucher.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>

        <div className="flex gap-2">
          <WriteAccess>
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Ubah
            </button>
          </WriteAccess>
          <WriteAccess>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-transparent hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus
            </button>
          </WriteAccess>
        </div>
      </div>
    </div>
  )
}

export function VoucherModule() {
  const { searchQuery } = useDashboardStore(
    useShallow((state) => ({ searchQuery: state.searchQuery }))
  )
  const [vouchers, setVouchers] = useState<VoucherData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<VoucherData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/admin/vouchers')
      const data = await res.json()
      if (data.success) setVouchers(data.data)
      else toast.error('Daftar voucher belum dapat dimuat. Coba muat ulang menu.')
    } catch {
      toast.error('Daftar voucher belum dapat dimuat. Coba muat ulang menu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  const handleCreate = async (formData: any) => {
    await adminRequest('/api/admin/vouchers', { method: 'POST', body: JSON.stringify(formData) })
    toast.success('Data berhasil ditambahkan')
    void fetchVouchers()
  }
  const handleUpdate = async (formData: any) => {
    if (!editingVoucher) throw new Error('Pilih data yang akan diubah')
    await adminRequest(`/api/admin/vouchers?id=${encodeURIComponent(editingVoucher.id)}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    })
    toast.success('Perubahan berhasil disimpan')
    void fetchVouchers()
  }

  const [deleting, setDeleting] = useState(false)
  const handleDelete = async (id: string) => {
    if (deleting) return
    setDeleting(true)
    try {
      await adminRequest(`/api/admin/vouchers?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      toast.success('Data berhasil dihapus')
      setDeleteConfirm(null)
      void fetchVouchers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch = voucher.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && voucher.isActive) ||
      (filterStatus === 'inactive' && !voucher.isActive)
    return matchesSearch && matchesStatus
  })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Voucher & Diskon</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Kelola voucher promosi dan diskon
          </p>
        </div>
        <WriteAccess>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600
                     text-white text-sm font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow"
          >
            <Plus className="w-4 h-4" />
            Buat voucher
          </button>
        </WriteAccess>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kode voucher..."
            value={searchQuery}
            onChange={(e) => useDashboardStore.getState().setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {filteredVouchers.length > 0 ? (
        <div key="grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVouchers.map((voucher, i) => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              index={i}
              formatPrice={formatPrice}
              formatDate={formatDate}
              onEdit={() => {
                setEditingVoucher(voucher)
                setShowForm(true)
              }}
              onDelete={() => setDeleteConfirm(voucher.id)}
            />
          ))}
        </div>
      ) : (
        <div key="empty" className="text-center py-20">
          <div>
            <Gift className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Tidak ada voucher ditemukan</p>
        </div>
      )}

      <VoucherForm
        open={showForm}
        voucher={editingVoucher}
        onClose={() => {
          setShowForm(false)
          setEditingVoucher(null)
        }}
        onSubmit={editingVoucher ? handleUpdate : handleCreate}
      />

      {/* Delete confirmation */}
      <Modal
        busy={deleting}
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Voucher?"
        description="Tindakan ini tidak dapat dibatalkan."
        icon={AlertTriangle}
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
