'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useBoothStore, usePaymentStore, type Photo, type Template } from '@/lib/stores/booth-store'
import {
  PaymentSelector,
  QrisDisplay,
  PhotoPreview,
  OfflineBanner,
  SessionTimer,
  TemplateSelector,
  BoothGuide,
  BoothLayout,
  PrintUpsellModal,
  CompletedScreen,
  ProcessingScreen,
} from '@/components/booth/BoothComponents'
import { toast, Toaster } from 'sonner'
import { compositeToFrame } from '@/lib/photo-compositor'
import { useRouter } from 'next/navigation'

export default function BoothPage() {
  const router = useRouter()
  const {
    session,
    config,
    setConfig,
    startSession,
    setProcessing,
    setPreview,
    setPayment,
    setPaymentStatus,
    setCompleted,
    resetSession,
    setOffline,
    setCustomerPhone,
    startSessionTimer,
    stopSessionTimer,
    decrementSessionTimer,
    setTemplate,
    setTemplateSelection,
    setPrinting,
    setPrintCopies,
    setTransactionRef,
    setSelectedFilter,
  } = useBoothStore()

  const { qrisString, setQrisString, clearQris, setQrisPolling, clearVoucher } = usePaymentStore()

  const [showQrisModal, setShowQrisModal] = useState(false)
  const [showPrintUpsell, setShowPrintUpsell] = useState(false)
  const [showAdditionalPayment, setShowAdditionalPayment] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureCountdown, setCaptureCountdown] = useState(8)
  const [capturedPhotos, setCapturedPhotos] = useState<Photo[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const captureTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [templates, setTemplates] = useState<Template[]>([])
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [qrAmount, setQrAmount] = useState(0)
  const serverSessionRef = useRef<string | null>(null)
  const paymentPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollDeadlineRef = useRef(0)
  const actionRef = useRef(false)
  const uploadRef = useRef<Promise<string | null> | null>(null)
  const clearPolling = () => {
    if (paymentPollRef.current) clearInterval(paymentPollRef.current)
    paymentPollRef.current = null
  }
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const response = await fetch('/api/booth/session')
        const data = await response.json()
        if (!response.ok) { router.replace('/booth/login'); return }
        if (cancelled) return
        setConfig(data.config)
        setTemplates(data.templates)
        const previous = useBoothStore.getState().session
        setCapturedPhotos(previous.photos || [])
        if (previous.serverSessionId && previous.outletId === data.config.outletId) {
          const saved = await fetch(`/api/sessions/${encodeURIComponent(previous.serverSessionId)}/photos`)
          const savedData = await saved.json()
          if (saved.ok) {
            serverSessionRef.current = previous.serverSessionId
            if (savedData.paymentStatus === 'PAID' && previous.status === 'payment') {
              useBoothStore.setState(state => ({ session: { ...state.session, paymentStatus: 'paid', status: 'template-selection' } }))
            } else if (savedData.paymentStatus !== 'PAID') {
              useBoothStore.setState(state => ({ session: { ...state.session, paymentStatus: 'pending', status: 'payment' } }))
            }
          } else startSession(data.config.outletId)
        } else startSession(data.config.outletId)
        if (!cancelled) setReady(true)
      } catch { setLoadError('Konfigurasi booth gagal dimuat. Muat ulang halaman untuk mencoba lagi.') }
    }
    init()
    return () => { cancelled = true; clearPolling() }
  }, [router, setConfig, startSession])

  const ensureSession = async () => {
    if (serverSessionRef.current) return serverSessionRef.current
    const response = await fetch('/api/sessions/start', { method: 'POST' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Gagal membuat sesi')
    serverSessionRef.current = data.data.sessionId
    useBoothStore.setState(state => ({ session: { ...state.session, serverSessionId: data.data.sessionId, galleryCode: data.data.galleryCode, code: data.data.sessionCode } }))
    return data.data.sessionId as string
  }

  // Handle network status
  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setOffline(!navigator.onLine)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOffline])

  // Global Session Timer
  useEffect(() => {
    if (!ready) return
    if (session.sessionTimerActive && session.sessionTimer > 0) {
      timerRef.current = setInterval(() => {
        decrementSessionTimer()
      }, 1000)
    } else if (session.sessionTimerActive && session.sessionTimer <= 0) {
      handleSessionTimeout()
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [ready, session.sessionTimerActive, session.sessionTimer, decrementSessionTimer])

  // Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    serverSessionRef.current = null
    uploadRef.current = null
    clearPolling()
    clearQris()
    clearVoucher()
    stopSessionTimer()
    setCapturedPhotos([])
    setIsCapturing(false)
    setCaptureCountdown(8)
    useBoothStore.setState((state) => ({
      session: {
        ...state.session,
        status: 'payment',
        serverSessionId: undefined,
        galleryCode: undefined,
        sessionTimerActive: false,
        sessionTimer: 540,
        photos: [],
        currentPhotoIndex: 0,
        paymentStatus: 'pending',
      },
    }))
  }, [stopSessionTimer])

  // Burst Capture countdown ticker
  useEffect(() => {
    if (isCapturing && session.status === 'capturing') {
      if (captureCountdown > 0) {
        captureTimerRef.current = setTimeout(() => {
          setCaptureCountdown(captureCountdown - 1)
        }, 1000)
      } else {
        console.log('Photo capture triggered at countdown 0')
      }
    }
    return () => {
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current)
    }
  }, [isCapturing, captureCountdown, session.status])

  // ============================================
  // handlePhotoCapture — single state update + store sync
  // ============================================
  const handlePhotoCapture = useCallback((photo: Photo) => {
    console.log(`[handlePhotoCapture] Photo captured: ${photo.id.substring(0, 8)}`)

    setCapturedPhotos(prev => {
      const newPhotos = [...prev]
      const nullIndex = newPhotos.findIndex(p => p === null)

      if (nullIndex !== -1) {
        newPhotos[nullIndex] = photo
      } else {
        newPhotos.push(photo)
      }

      const validPhotos = newPhotos.filter(Boolean)
      console.log(`[handlePhotoCapture] Valid: ${validPhotos.length}/3`)

      // Sync ke Zustand store langsung
      useBoothStore.setState(state => ({
        session: {
          ...state.session,
          photos: validPhotos,
          currentPhotoIndex: validPhotos.length,
        }
      }))

      return newPhotos
    })

    // Baca latest capturedPhotos untuk cek count (pakai setTimeout biar state update selesai)
    setTimeout(() => {
      setCapturedPhotos(prev => {
        const count = prev.filter(Boolean).length
        if (count >= 3) {
          console.log('[handlePhotoCapture] All 3 photos done, stopping capture')
          setIsCapturing(false)
        } else {
          setCaptureCountdown(config!.countdownDuration)
        }
        return prev
      })
    }, 0)
  }, [])

  const confirmPayment = () => {
    clearPolling()
    setPaymentStatus('paid')
    setQrisPolling(false)
    setShowQrisModal(false)
    clearQris()
    startSessionTimer()
    setTemplateSelection()
  }
  const checkPayment = async (ref: string) => {
    const response = await fetch(`/api/payment/status?ref=${encodeURIComponent(ref)}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Status pembayaran belum dapat diperiksa')
    if (usePaymentStore.getState().transactionRef !== ref) return 'pending'
    if (data.status === 'success') confirmPayment()
    else if (data.status === 'failed') {
      clearPolling(); setQrisPolling(false); setPaymentStatus('failed')
      toast.error('Pembayaran gagal atau kedaluwarsa')
    }
    return data.status
  }
  const startPaymentPolling = (ref: string) => {
    clearPolling()
    pollDeadlineRef.current = Date.now() + 15 * 60 * 1000
    paymentPollRef.current = setInterval(async () => {
      if (Date.now() >= pollDeadlineRef.current) { clearPolling(); setQrisPolling(false); return }
      try { await checkPayment(ref) } catch { /* Keep payment pending during provider/network errors. */ }
    }, 3000)
  }
  const handlePaymentSelect = async (method: 'qris' | 'voucher' | 'event') => {
    if (actionRef.current) return
    actionRef.current = true; setBusy(true)
    try {
      setPayment(method)
      const sessionId = await ensureSession()
      if (method !== 'qris') {
        const response = await fetch('/api/payment/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, method, code: usePaymentStore.getState().voucherCode }) })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Pembayaran gagal')
        if (data.paid) { confirmPayment(); return }
      }
      const response = await fetch('/api/payment/qris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal membuat QRIS')
      setQrAmount(data.amount)
      setQrisString(data.qrString, new Date(data.expiresAt), data.transactionRef)
      setTransactionRef(data.transactionRef)
      setShowQrisModal(true); setQrisPolling(true)
      startPaymentPolling(data.transactionRef)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Pembayaran gagal') }
    finally { actionRef.current = false; setBusy(false) }
  }
  const handleQrisConfirm = async () => {
    const ref = usePaymentStore.getState().transactionRef
    if (!ref) return
    try { if (await checkPayment(ref) === 'pending') toast.info('Pembayaran belum dikonfirmasi oleh gateway') }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal memeriksa pembayaran') }
  }
  const handleQrisCancel = () => {
    clearPolling(); setShowQrisModal(false); setQrisPolling(false); clearQris()
  }

  const handleTemplateSelect = (template: Template) => {
    setTemplate(template)
    startSessionTimer()
    useBoothStore.getState().setGuide()
  }

  const handleGuideStart = () => {
    useBoothStore.getState().setCapturing()
  }

  const handleStartCapture = () => {
    setIsCapturing(true)
    setCaptureCountdown(8)
  }

  const handleRetake = () => {
    setCapturedPhotos([])
    setIsCapturing(false)
    setCaptureCountdown(8)
    useBoothStore.setState((state) => ({
      session: {
        ...state.session,
        photos: [],
        currentPhotoIndex: 0,
        status: 'capturing',
      },
    }))
  }

  const handleRetakePhoto = (index: number) => {
    setCapturedPhotos(prev => {
      const newPhotos = [...prev]
      newPhotos[index] = null as unknown as Photo

      const validPhotos = newPhotos.filter(Boolean)
      useBoothStore.setState(state => ({
        session: {
          ...state.session,
          photos: validPhotos,
          currentPhotoIndex: validPhotos.length,
        }
      }))

      return newPhotos
    })
  }

  // ============================================
  // handleFinishCapture — baca dari store, fallback ke local state
  // ============================================
  const handleFinishCapture = () => {
    console.log('[handleFinishCapture] Called')

    // Baca dari Zustand store (di-sync oleh handlePhotoCapture)
    let photosForProcessing = useBoothStore.getState().session.photos.filter(p => p)

    if (photosForProcessing.length === 0) {
      console.warn('[handleFinishCapture] Store empty, trying local capturedPhotos')
      photosForProcessing = capturedPhotos.filter(p => p)
    }

    if (photosForProcessing.length === 0) {
      console.error('[handleFinishCapture] No photos available anywhere!')
      return
    }

    console.log(`[handleFinishCapture] ${photosForProcessing.length} photos ready`)

    // Sync final state ke store
    useBoothStore.setState(state => ({
      session: {
        ...state.session,
        photos: photosForProcessing,
        currentPhotoIndex: photosForProcessing.length,
      }
    }))

    setProcessing()
    setTimeout(() => setPreview(), 2000)
  }

  // ============================================
  // Upload & Complete Session
  // ============================================
  const uploadPhotosAndComplete = async () => {
    try {
      const sessionId = await ensureSession()
      const existingResponse = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/photos`)
      const existing = await existingResponse.json()
      if (!existingResponse.ok) throw new Error(existing.error || 'Sesi tidak tersedia')
      if (existing.status === 'COMPLETED') return existing.galleryCode as string
      const validPhotos = session.photos.filter(p => p && (p.url || p.base64))

      if (validPhotos.length === 0) {
        console.error('[upload] No valid photos to upload — store session.photos:', session.photos.length)
        session.photos.forEach((p, i) => console.error(`[upload] photo[${i}]:`, { id: p.id, hasUrl: !!p.url, hasBase64: !!p.base64, urlPrefix: p.url?.substring(0, 30) }))
        return null
      }

      console.log(`[upload] ${validPhotos.length} valid photos, template:`, session.template?.name)

      const photoUrls = validPhotos.map(p => p.url || p.base64 || '').filter(Boolean)
      console.log(`[upload] photoUrls[0] prefix: ${photoUrls[0]?.substring(0, 40)} (len=${photoUrls[0]?.length})`)

      let compositeBase64: string | null = null

      if (session.template?.imageUrl) {
        try {
          console.log(`[upload] Composite start: frame=${session.template.imageUrl}`)
          compositeBase64 = await compositeToFrame(
            session.template.imageUrl,
            photoUrls,
            undefined,
            undefined,
            session.selectedFilter && session.selectedFilter !== 'none'
              ? session.selectedFilter
              : undefined
          )
          console.log('[upload] Composite generated OK, length:', compositeBase64.length)
        } catch (error) {
          console.error('[upload] Composite failed:', error)
        }
      } else {
        console.error('[upload] No template.imageUrl!')
      }

      const uploadedUrls: string[] = []
      let compositeUploaded = false

      if (compositeBase64) {
        try {
          const base64Data = compositeBase64.split(',')[1]
          const byteCharacters = atob(base64Data)
          const byteArray = new Uint8Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i)
          }
          const blob = new Blob([byteArray], { type: 'image/jpeg' })
          const formData = new FormData()
          formData.append('photo', blob, `composite-${Date.now()}.jpg`)
          formData.append('sessionId', sessionId)

          const uploadResponse = await fetch('/api/photos/upload', { method: 'POST', body: formData })
          const uploadResult = await uploadResponse.json()

          if (uploadResult.success) {
            uploadedUrls.push(uploadResult.url)
            compositeUploaded = true
            console.log('Composite uploaded:', uploadResult.url)
          } else {
            console.error('Composite upload failed:', uploadResult.error)
          }
        } catch (error) {
          console.error('Error uploading composite:', error)
        }
      }

      // Fallback: upload raw photos
      if (uploadedUrls.length === 0) {
        for (const photo of validPhotos) {
          try {
            let blob: Blob
            if (photo.base64 && photo.base64.startsWith('data:')) {
              const base64Data = photo.base64.split(',')[1]
              const byteArray = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0)))
              blob = new Blob([byteArray], { type: 'image/jpeg' })
            } else if (photo.url) {
              const response = await fetch(photo.url)
              blob = await response.blob()
            } else {
              continue
            }

            const formData = new FormData()
            formData.append('photo', blob, `photo-${Date.now()}.jpg`)
            formData.append('sessionId', sessionId)

            const uploadResponse = await fetch('/api/photos/upload', { method: 'POST', body: formData })
            const uploadResult = await uploadResponse.json()

            if (uploadResult.success) {
              uploadedUrls.push(uploadResult.url)
            } else {
              console.error('Upload failed:', uploadResult.error)
            }
          } catch (error) {
            console.error('Error uploading photo:', error)
          }
        }
      }

      if (uploadedUrls.length === 0 || !compositeUploaded && uploadedUrls.length !== validPhotos.length) {
        console.error('Not all required photos were successfully uploaded')
        return null
      }

      const galleryCode = useBoothStore.getState().session.galleryCode!
      const updateResponse = await fetch(`/api/sessions/${sessionId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: uploadedUrls,
          status: 'COMPLETED',
          frameId: session.template?.id,
        }),
      })
      const updateResult = await updateResponse.json()

      if (updateResult.success) {
        console.log('Session completed with gallery code:', galleryCode)
        return galleryCode
      } else {
        console.error('Failed to update session:', updateResult.error)
        return null
      }
    } catch (error) {
      console.error('Error in uploadPhotosAndComplete:', error)
      return null
    }
  }

  const completeSession = async () => {
    if (actionRef.current) return
    actionRef.current = true; setBusy(true); stopSessionTimer()
    try {
      uploadRef.current ??= uploadPhotosAndComplete()
      const code = await uploadRef.current
      if (!code) throw new Error('Foto belum berhasil disimpan. Silakan coba lagi.')
      setCompleted(code)
      if (session.customerPhone) {
        try {
        const response = await fetch('/api/send-wa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneNumber: session.customerPhone, galleryCode: code }) })
        if (!response.ok) toast.info('Foto tersimpan, tetapi notifikasi WhatsApp belum terkirim')
        } catch { toast.info('Foto tersimpan, tetapi notifikasi WhatsApp belum terkirim') }
      }
    } catch (error) {
      uploadRef.current = null
      setPreview()
      toast.error(error instanceof Error ? error.message : 'Penyimpanan foto gagal')
    } finally { actionRef.current = false; setBusy(false) }
  }
  const handlePrint = async () => {
    if (actionRef.current || !session.template) return
    actionRef.current = true; setBusy(true); stopSessionTimer(); setShowPrintUpsell(false)
    try {
      const sessionId = await ensureSession()
      const imageBase64 = await compositeToFrame(session.template.imageUrl, session.photos.map(p => p.url || p.base64 || ''), undefined, undefined, session.selectedFilter !== 'none' ? session.selectedFilter : undefined)
      setPrinting()
      const response = await fetch('/api/print', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, imageBase64, copies: 1 }) })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Cetak gagal')
      toast.success('Pekerjaan cetak diterima printer')
    } catch (error) {
      setPreview()
      toast.error(error instanceof Error ? error.message : 'Cetak gagal')
      return
    } finally { actionRef.current = false; setBusy(false) }
    await completeSession()
  }
  const handleUpdateCopies = (_copies: number) => {
    setPrintCopies(1)
    toast.info('Saat ini tersedia satu cetakan per sesi')
  }
  const handlePrintConfirm = () => { handlePrint() }
  const handleAdditionalPaymentComplete = () => { toast.info('Pembayaran cetak tambahan belum tersedia') }
  const handlePrintCancel = async () => {
    setShowPrintUpsell(false); setShowAdditionalPayment(false)
    await completeSession()
  }
  const handleDone = () => {
    clearPolling(); clearQris(); clearVoucher()
    serverSessionRef.current = null; uploadRef.current = null
    resetSession(); stopSessionTimer(); setCapturedPhotos([])
    startSession(config!.outletId)
  }
  if (!ready || !config) return <main className="min-h-screen bg-black text-white flex flex-col gap-4 items-center justify-center"><p>{loadError || 'Memuat konfigurasi booth...'}</p>{loadError && <button onClick={() => window.location.reload()} className="rounded-xl bg-purple-600 p-3">Coba lagi</button>}</main>

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <Toaster richColors />
      <OfflineBanner />
      {busy && <div className="fixed inset-0 bg-black/70 text-white flex items-center justify-center z-[100]" role="status">Memproses...</div>}

      <SessionTimer
        seconds={session.sessionTimer}
        active={session.sessionTimerActive}
      />

      {session.status === 'payment' && (
        <PaymentSelector
          totalPrice={config!.defaultPrice}
          onSelect={handlePaymentSelect}
          config={config!.paymentMethods}
          customerPhone={session.customerPhone || ''}
          onPhoneChange={setCustomerPhone}
        />
      )}

      {session.status === 'payment' && <button onClick={handleDone} className="fixed bottom-4 right-4 z-[60] rounded-xl bg-white/90 p-3 text-purple-900">Mulai sesi baru</button>}

      {showQrisModal && qrisString && (
        <QrisDisplay
          qrString={qrisString}
          amount={qrAmount}
          onComplete={handleQrisConfirm}
          onCancel={handleQrisCancel}
        />
      )}

      {session.status === 'template-selection' && (
        <TemplateSelector
          templates={templates}
          onSelect={handleTemplateSelect}
          sessionTimerActive={session.sessionTimerActive}
          sessionTimerSeconds={session.sessionTimer}
        />
      )}

      {session.status === 'guide' && (
        <BoothGuide
          template={session.template}
          onStart={handleGuideStart}
        />
      )}

      {(session.status === 'capturing' || session.status === 'countdown') && (
        <BoothLayout
          onCapture={handlePhotoCapture}
          onRetakePhoto={handleRetakePhoto}
          template={session.template}
          photos={capturedPhotos}
          currentPhotoIndex={capturedPhotos.filter(p => p).length}
          totalPhotos={3}
          countdownValue={captureCountdown}
          isCountdown={isCapturing && captureCountdown > 0}
          onStartCapture={handleStartCapture}
          onFinishCapture={handleFinishCapture}
        />
      )}

      {session.status === 'processing' && <ProcessingScreen />}

      {session.status === 'preview' && session.photos.length > 0 && (
        <PhotoPreview
          photos={session.photos}
          template={session.template}
          onRetake={handleRetake}
          onPrint={config.printEnabled ? () => setShowPrintUpsell(true) : handlePrintCancel}
          onContinue={handlePrintCancel}
        />
      )}

      {showPrintUpsell && (
        <PrintUpsellModal
          currentCopies={session.printCopies}
          pricePerCopy={10000}
          onUpdateCopies={handleUpdateCopies}
          onConfirm={handlePrintConfirm}
          onCancel={handlePrintCancel}
          showPayment={showAdditionalPayment}
          onPaymentComplete={handleAdditionalPaymentComplete}
        />
      )}

      {session.status === 'printing' && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl">Mencetak foto...</p>
            <p className="text-gray-400 text-sm mt-2">{session.printCopies} copy</p>
          </div>
        </div>
      )}

      {session.status === 'completed' && (
        <CompletedScreen
          galleryCode={session.galleryCode || ''}
          customerPhone={session.customerPhone}
          onDone={handleDone}
        />
      )}
    </div>
  )
}