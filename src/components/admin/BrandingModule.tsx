'use client'
import { useEffect, useState } from 'react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { adminRequest } from '@/lib/admin-client'
import { useAdminForm } from './ui/useAdminForm'
import { ImageUpload } from './ui/ImageUpload'
import { Field, Input } from './ui/Field'
import { useCanManage, WriteAccess } from './ui/WriteAccess'
import { toast } from 'sonner'
export function BrandingModule() {
  const branding = useDashboardStore((s) => s.branding)
  const canManage = useCanManage()
  const [formData, setFormData] = useState(branding)
  const [uploading, setUploading] = useState(false)
  const { saving, error, submit } = useAdminForm(true, () => {})
  useEffect(() => {
    setFormData(branding)
  }, [branding])
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        void submit(async () => {
          if (!canManage) throw new Error('Akun ini hanya memiliki akses baca')
          if (uploading) throw new Error('Tunggu unggahan gambar selesai')
          await adminRequest('/api/admin/branding', {
            method: 'PUT',
            body: JSON.stringify(formData),
          })
          toast.success('Identitas usaha berhasil disimpan')
          void useDashboardStore
            .getState()
            .refreshDashboard()
            .catch(() => toast.info('Data tersimpan. Muat ulang menu untuk memperbarui tampilan.'))
        })
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Identitas usaha</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Nama, warna utama, dan gambar yang ditampilkan untuk usaha Anda.
          </p>
        </div>
        <WriteAccess>
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : uploading ? 'Mengunggah...' : 'Simpan perubahan'}
          </button>
        </WriteAccess>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <fieldset disabled={!canManage || saving || uploading} className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <Field label="Nama usaha" required>
            <Input
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
              maxLength={100}
            />
          </Field>
          <Field label="Warna utama">
            <div className="flex items-center gap-3">
              <input
                aria-label="Pilih warna utama"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="h-10 w-12 rounded-lg"
              />
              <Input
                aria-label="Kode warna utama"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                pattern="#[0-9a-fA-F]{6}"
              />
            </div>
          </Field>
          <p className="text-xs text-gray-500">
            Warna sekunder dan tagline menggunakan nilai bawaan aplikasi.
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-semibold">Logo usaha</h2>
          <ImageUpload
            folder="brand-logo"
            value={formData.logoUrl ? [formData.logoUrl] : []}
            onChange={(urls) => setFormData((s) => ({ ...s, logoUrl: urls[0] || '' }))}
            disabled={!canManage || saving}
            onBusyChange={setUploading}
          />
          <p className="text-xs text-gray-500">
            Tanpa logo unggahan, aplikasi memakai logo SnapNext bawaan.
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 lg:col-span-2 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-semibold">Gambar utama halaman publik</h2>
          <ImageUpload
            folder="brand-banner"
            value={formData.heroBannerUrl ? [formData.heroBannerUrl] : []}
            onChange={(urls) => setFormData((s) => ({ ...s, heroBannerUrl: urls[0] || '' }))}
            disabled={!canManage || saving}
            onBusyChange={setUploading}
          />
        </div>
      </fieldset>
      <section className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <h2
          className="px-5 py-3 text-sm font-medium text-white"
          style={{ backgroundColor: formData.primaryColor }}
        >
          Pratinjau - {formData.companyName}
        </h2>
        <div className="bg-white p-6 text-center dark:bg-gray-900">
          <div className="mb-4 flex justify-center">
            <BrandLogo
              logoUrl={formData.logoUrl}
              companyName={formData.companyName}
              className="h-16 w-auto max-w-full"
            />
          </div>
          <p className="text-xl font-semibold">{formData.companyName}</p>
          <p className="mt-1 text-sm text-gray-500">{formData.tagline}</p>
          {formData.heroBannerUrl && (
            <img
              src={formData.heroBannerUrl}
              alt="Pratinjau gambar utama"
              className="mx-auto mt-4 max-h-56 w-full rounded-xl object-cover"
            />
          )}
        </div>
      </section>
    </form>
  )
}
