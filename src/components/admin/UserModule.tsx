'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User as UserIcon,
  Loader2
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
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
  onSubmit: (data: any) => void
}

function UserForm({ open, user, onClose, onSubmit }: UserFormProps) {
  const [outlets, setOutlets] = useState<OutletOption[]>([])
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'STAFF',
    outletId: user?.outletId || '',
    isActive: user?.isActive ?? true
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
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'STAFF',
      outletId: user?.outletId || '',
      isActive: user?.isActive ?? true
    })
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      isActive: formData.isActive
    }
    if (formData.outletId) payload.outletId = formData.outletId
    if (formData.password) payload.password = formData.password
    onSubmit(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Edit User' : 'Add New User'}
      description={user ? 'Perbarui detail anggota tim Anda.' : 'Buat akun anggota tim baru.'}
      icon={UserIcon}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Full Name" required>
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
            label={user ? 'New Password (leave blank to keep current)' : 'Password'}
            required={!user}
            hint={!user ? 'Minimal 6 karakter.' : undefined}
          >
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              minLength={6}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Role" hint="Super Admin tidak terikat outlet.">
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
            </Select>
          </Field>

          {formData.role !== 'SUPER_ADMIN' && (
            <Field label="Assigned Outlet">
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
          )}

          <Switch
            checked={formData.isActive}
            onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            label="Active"
            description="Akun aktif dapat login ke dashboard."
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
            {user ? 'Update' : 'Create'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export function UserModule() {
  const { searchQuery } = useDashboardStore()
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
      else toast.error('Failed to load users')
    } catch {
      toast.error('Failed to load users')
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
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (data.success) {
      toast.success('User created successfully!')
      fetchUsers()
    } else {
      toast.error(data.error || 'Failed to create user')
    }
  }

  const handleUpdate = async (formData: any) => {
    if (!editingUser) return
    const res = await fetch(`/api/admin/users?id=${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (data.success) {
      toast.success('User updated successfully!')
      fetchUsers()
    } else {
      toast.error(data.error || 'Failed to update user')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      toast.success('User deleted successfully!')
      setDeleteConfirm(null)
      fetchUsers()
    } else {
      toast.error(data.error || 'Failed to delete user')
    }
  }

  const filteredUsers = users.filter(user => {
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
      STAFF: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
    return styles[role] || styles.STAFF
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      OWNER: 'Owner',
      MANAGER: 'Manager',
      STAFF: 'Staff'
    }
    return labels[role] || role
  }

  const getOutletName = (outletId?: string | null) => {
    if (!outletId) return '-'
    const outlet = outlets.find(o => o.id === outletId)
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage user access and permissions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Search users..."
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
          <option value="all">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="OWNER">Owner</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outlet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
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
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user)
                          setShowForm(true)
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Edit className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
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
          <p className="text-gray-500 dark:text-gray-400">No users found</p>
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
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User?"
        description="This action cannot be undone. Are you sure you want to delete this user?"
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
