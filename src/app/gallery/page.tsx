'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Download, Printer, Share2, QrCode, ArrowLeft, Copy, Check, Loader2 } from 'lucide-react'

// ============================================
// Gallery Page - View Photos by Code
// ============================================

function GalleryContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  
  const [photos, setPhotos] = useState<string[]>([])
  const [galleryData, setGalleryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGallery = async () => {
      if (!code) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/gallery?code=${encodeURIComponent(code)}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load gallery')
          setLoading(false)
          return
        }

        const data = await response.json()
        if (data.success) {
          setPhotos(data.data.photos || [])
          setGalleryData(data.data)
        } else {
          setError(data.error || 'Failed to load gallery')
        }
      } catch (err) {
        console.error('Error fetching gallery:', err)
        setError('Failed to load gallery')
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [code])

  const handleDownloadAll = async () => {
    try {
      const response = await fetch(`/api/download?code=${code}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to download photos')
        return
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gallery-${code}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download photos')
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/gallery?code=${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!code) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <QrCode className="w-16 h-16 mx-auto text-purple-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">View Your Gallery</h1>
          <p className="text-gray-600 mb-6">
            Enter your gallery code to view your photos
          </p>
          <form className="space-y-4" onSubmit={event => {
            event.preventDefault()
            const value = String(new FormData(event.currentTarget).get('code') || '').trim().toUpperCase()
            if (value) window.location.href = `/gallery?code=${encodeURIComponent(value)}`
          }}>
            <input
              type="text"
              name="code" required maxLength={64} placeholder="Masukkan kode galeri"
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-xl font-mono uppercase"
            />
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700"
            >
              View Gallery
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto text-red-500 mb-4">
            <QrCode className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gallery Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="inline-block py-3 px-6 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700">
            Go Back
          </a>
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Photos Yet</h1>
          <p className="text-gray-600 mb-6">This gallery is currently empty. Photos will appear here once they are taken.</p>
          <a href="/" className="inline-block py-3 px-6 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700">
            Go Back
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </a>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Gallery Code:</span>
            <span className="font-mono font-bold text-purple-600">{code}</span>
          </div>
        </div>
      </header>

      {/* Photo Grid */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 gap-4"
        >
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-200 relative group"
            >
              <img 
                src={photo} 
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <button
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = photo
                    a.download = `photo-${index + 1}.jpg`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2"
                >
                  <Download className="w-5 h-5 text-gray-800" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleDownloadAll}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700"
          >
            <Download className="w-5 h-5" />
            Download All
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-purple-500 hover:text-purple-600">
            <Printer className="w-5 h-5" />
            Print
          </button>
        </div>

        {/* Share Section */}
        <div className="mt-8 p-6 bg-white rounded-xl border">
          <h3 className="font-semibold text-gray-900 mb-4">Share this gallery</h3>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/gallery?code=${code}`}
              className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">Or scan this QR code</p>
          <div className="inline-block p-4 bg-white rounded-xl border">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/gallery?code=${code}`)}`}
              alt="QR Code"
              className="w-32 h-32"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

// ============================================
// Wrap with Suspense for useSearchParams
// ============================================

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <GalleryContent />
    </Suspense>
  )
}