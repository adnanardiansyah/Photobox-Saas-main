'use client'

import { useEffect, useState } from 'react'
import { 
  Palette, 
  Image as ImageIcon, 
  Type, 
  Save,
  Upload,
  Loader2
} from 'lucide-react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ============================================
// Branding Module Component
// Upload logo & hero banner ke Supabase Storage
// ============================================

export function BrandingModule() {
  const { branding, updateBranding } = useDashboardStore()
  const [formData, setFormData] = useState({
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    heroBannerUrl: branding.heroBannerUrl,
    companyName: branding.companyName,
    tagline: branding.tagline
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  // Upload file ke Supabase Storage via API
  const uploadToStorage = async (file: File, folder: string): Promise<string | null> => {
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('photo', file, file.name)
      formDataUpload.append('assetFolder', folder)

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()
      if (result.success) {
        return result.url
      } else {
        console.error('Upload failed:', result.error)
        return null
      }
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview lokal dulu
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logoUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)

    // Upload ke Supabase Storage
    setUploadingLogo(true)
    const url = await uploadToStorage(file, 'brand-logo')
    setUploadingLogo(false)

    if (url) {
      setFormData(prev => ({ ...prev, logoUrl: url }))
      toast.success('Logo uploaded!')
    } else {
      toast.error('Upload logo gagal, menggunakan preview lokal')
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview lokal dulu
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, heroBannerUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)

    // Upload ke Supabase Storage
    setUploadingBanner(true)
    const url = await uploadToStorage(file, 'brand-banner')
    setUploadingBanner(false)

    if (url) {
      setFormData(prev => ({ ...prev, heroBannerUrl: url }))
      toast.success('Banner uploaded!')
    } else {
      toast.error('Upload banner gagal, menggunakan preview lokal')
    }
  }

  useEffect(() => { setFormData(branding) }, [branding])
  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/branding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan branding')
      await useDashboardStore.getState().refreshDashboard()
      toast.success('Branding tersimpan')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal menyimpan branding') }
  }

  const handleColorChange = (field: 'primaryColor' | 'secondaryColor', value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branding & CMS</h1>
          <p className="text-gray-500 dark:text-gray-400">Customize your brand appearance and content</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Type className="w-5 h-5 text-purple-500" />
            Company Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Tagline (default)</label>
              <input
                type="text"
                disabled value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Colors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Palette className="w-5 h-5 text-purple-500" />
            Brand Colors
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="w-12 h-10 rounded-lg border dark:border-gray-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Secondary Color (default)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  disabled value={formData.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="w-12 h-10 rounded-lg border dark:border-gray-700 cursor-pointer"
                />
                <input
                  type="text"
                  disabled value={formData.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="pt-4">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Preview</label>
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded-lg shadow-sm" style={{ backgroundColor: formData.primaryColor }} />
                <div className="w-16 h-16 rounded-lg shadow-sm" style={{ backgroundColor: formData.secondaryColor }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <ImageIcon className="w-5 h-5 text-purple-500" />
            Logo
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Upload Logo</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
                {uploadingLogo && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  </div>
                )}
              </div>
              {uploadingLogo && (
                <p className="mt-1 text-sm text-purple-500">Uploading...</p>
              )}
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Preview</label>
              <div className="w-32 h-32 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {formData.logoUrl ? (
                  <img 
                    src={formData.logoUrl} 
                    alt="Logo Preview"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-300" />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Upload className="w-5 h-5 text-purple-500" />
            Hero Banner
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Upload Banner</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
                {uploadingBanner && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  </div>
                )}
              </div>
              {uploadingBanner && (
                <p className="mt-1 text-sm text-purple-500">Uploading...</p>
              )}
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Preview</label>
              <div className="w-full h-32 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {formData.heroBannerUrl ? (
                  <img 
                    src={formData.heroBannerUrl} 
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div className="text-center text-gray-400 dark:text-gray-600">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Upload banner untuk preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Live Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border dark:border-gray-800"
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Live Preview</h2>
        
        <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
          <div 
            className="h-16 flex items-center px-6"
            style={{ backgroundColor: formData.primaryColor }}
          >
            <div className="flex items-center gap-3">
              {formData.logoUrl && (
                <img 
                  src={formData.logoUrl} 
                  alt="Logo"
                  className="h-8 w-auto"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
              <span className="text-white font-bold">{formData.companyName}</span>
            </div>
          </div>
          
          <div 
            className="h-48 flex items-center justify-center relative"
            style={{ 
              background: formData.heroBannerUrl 
                ? `url(${formData.heroBannerUrl}) center/cover`
                : `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
            }}
          >
            <div className="text-center text-white z-10 relative">
              <h3 className="text-2xl font-bold mb-2">{formData.companyName}</h3>
              <p className="text-lg opacity-90">{formData.tagline}</p>
            </div>
            <div className="absolute inset-0 bg-black/30" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}