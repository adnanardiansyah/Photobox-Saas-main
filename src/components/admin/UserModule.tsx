'use client'
import { WriteAccess } from './ui/WriteAccess'

import { useShallow } from 'zustand/react/shallow'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, User as UserIcon, Loader2 } from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { adminRequest } from '@/lib/admin-client'
import { useAdminForm } from './ui/useAdminForm'
import { Modal, ModalFooter } from './ui/Modal'
import { Field, Input, Select, Switch } from './ui/Field'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  outletId: string | null
  isActive: boolean
  createdAt: string
}

interface OutletOption {
  id: string
  name: string
}

interface UserFormProps {
  open: boolean
  user?: UserData | null
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

function UserForm({ open, user, onClose, onSubmit }: UserFormProps) {
  const [outlets, setOutlets] = useState<OutletOption[]>([])
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'MANAGER',
    outletId: user?.outletId || '',
    isActive: user?.isActive ?? true,
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
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'MANAGER',
      outletId: user?.outletId || '',
      isActive: user?.isActive ?? true,
    })
  }, [user, open])

  const { saving, error, submit } = useAdminForm(open, onClose)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submit(async () => {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      }
      if (formData.outletId) payload.outletId = formData.outletId
      if (formData.password) payload.password = formData.password
      if (formData.role === 'SUPER_ADMIN') delete payload.role
      await onSubmit(payload)
    })
  }

  return (
    <Modal
      busy={saving}
      open={open}
      onClose={onClose}
      title={user ? 'Ubah anggota' : 'Tambah anggota'}
      description={user ? 'Perbarui detail anggota tim Anda.' : 'Buat akun anggota tim baru.'}
      icon={UserIcon}
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
            <Field label="Nama lengkap" required>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Asep Suryana"
                required
              />
            </Field>

            <Field label="Email" required>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.com"
                required
              />
            </Field>

            <Field
              label={user ? 'Kata sandi baru (kosongkan jika tidak diubah)' : 'Kata sandi'}
              required={!user}
              hint={!user ? 'Minimal 8 karakter.' : undefined}
            >
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!user}
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </Field>

            <Field
              label="Hak akses"
              hint="Pemilik dapat mengubah data. Manager hanya melihat dan mengekspor laporan. Petugas tidak memiliki akses dashboard."
            >
              <Select
                disabled={user?.role === 'SUPER_ADMIN'}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {user?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super admin</option>}
                <option value="OWNER">Pemilik</option>
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Petugas (tanpa akses dashboard)</option>
              </Select>
            </Field>

            {formData.role !== 'SUPER_ADMIN' && (
              <Field label="Outlet penugasan">
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
            )}

            <Switch
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              label="Aktif"
              description="Akun aktif dapat login ke dashboard."
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
              {saving ? 'Menyimpan...' : user ? 'Simpan perubahan' : 'Simpan'}
            </button>
          </ModalFooter>
        </fieldset>
      </form>
    </Modal>
  )
}

export function UserModule() {
  const { searchQuery } = useDashboardStore(
    useShallow((state) => ({ searchQuery: state.searchQuery }))
  )
  const [users, setUsers] = useState<UserData[]>([])
  const [outlets, setOutlets] = useState<OutletOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState<string>('all')

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.success) setUsers(data.data)
      else toast.error('Daftar tim belum dapat dimuat. Coba muat ulang menu.')
    } catch {
      toast.error('Daftar tim belum dapat dimuat. Coba muat ulang menu.')
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
    fetchUsers()
    fetchOutlets()
  }, [])

  const handleCreate = async (formData: any) => {
    await adminRequest('/api/admin/users', { method: 'POST', body: JSON.stringify(formData) })
    toast.success('Data berhasil ditambahkan')
    void fetchUsers()
  }
  const handleUpdate = async (formData: any) => {
    if (!editingUser) throw new Error('Pilih data yang akan diubah')
    await adminRequest(`/api/admin/users?id=${encodeURIComponent(editingUser.id)}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    })
    toast.success('Perubahan berhasil disimpan')
    void fetchUsers()
  }

  const [deleting, setDeleting] = useState(false)
  const handleDelete = async (id: string) => {
    if (deleting) return
    setDeleting(true)
    try {
      await adminRequest(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      toast.success('Data berhasil dihapus')
      setDeleteConfirm(null)
      void fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      SUPER_ADMIN: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      OWNER: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      MANAGER: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      STAFF: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    }
    return styles[role] || styles.STAFF
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      OWNER: 'Pemilik',
      MANAGER: 'Manager',
      STAFF: 'Petugas',
    }
    return labels[role] || role
  }

  const getOutletName = (outletId?: string | null) => {
    if (!outletId) return '-'
    const outlet = outlets.find((o) => o.id === outletId)
    return outlet?.name || '-'
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anggota tim</h1>
          <p className="text-gray-500 dark:text-gray-400">Atur akun tim dan hak akses dashboard.</p>
        </div>
        <WriteAccess>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Tambah anggota
          </button>
        </WriteAccess>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => useDashboardStore.getState().setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Semua hak akses</option>
          <option value="SUPER_ADMIN">Super admin</option>
          <option value="OWNER">Pemilik</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Petugas (tanpa akses dashboard)</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hak akses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Outlet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {getOutletName(user.outletId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <WriteAccess>
                        <button
                          onClick={() => {
                            setEditingUser(user)
                            setShowForm(true)
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                      </WriteAccess>
                      <WriteAccess>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                      </WriteAccess>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Anggota tidak ditemukan</p>
        </div>
      )}

      <UserForm
        open={showForm}
        user={editingUser}
        onClose={() => {
          setShowForm(false)
          setEditingUser(null)
        }}
        onSubmit={editingUser ? handleUpdate : handleCreate}
      />

      {/* Delete confirmation */}
      <Modal
        busy={deleting}
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus anggota?"
        description="Akun anggota ini akan dihapus dan tidak bisa login lagi. Tindakan ini tidak dapat dibatalkan. Lanjutkan?"
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
