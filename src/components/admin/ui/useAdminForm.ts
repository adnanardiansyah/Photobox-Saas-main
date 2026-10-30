'use client'
import { useEffect, useRef, useState } from 'react'
export function useAdminForm(open: boolean, onSuccess: () => void) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const locked = useRef(false)
  useEffect(() => {
    if (open) setError('')
  }, [open])
  const submit = async (action: () => Promise<unknown>) => {
    if (locked.current) return
    locked.current = true
    setSaving(true)
    setError('')
    try {
      await action()
      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Data belum berhasil disimpan. Silakan coba lagi.'
      )
    } finally {
      locked.current = false
      setSaving(false)
    }
  }
  return { saving, error, submit }
}
