'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function BoothLoginPage() {
  const router = useRouter()
  const [machineId, setMachineId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  return <main className="min-h-screen bg-purple-950 flex items-center justify-center p-6"><form className="w-full max-w-md rounded-3xl bg-white p-8 space-y-5" onSubmit={async e => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const response = await fetch('/api/booth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ machineId, apiKey }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Login gagal')
      router.replace('/booth')
    } catch (err) { setError(err instanceof Error ? err.message : 'Login gagal') } finally { setLoading(false) }
  }}><h1 className="text-2xl font-bold">Login Booth</h1><label className="block">Machine ID<input className="block w-full border rounded-xl p-3 mt-2" required autoComplete="off" value={machineId} onChange={e => setMachineId(e.target.value)} /></label><label className="block">API key perangkat<input className="block w-full border rounded-xl p-3 mt-2" type="password" required autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} /></label>{error && <p role="alert" className="text-red-600">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-purple-600 text-white p-3 disabled:opacity-50">{loading ? 'Memeriksa...' : 'Masuk'}</button></form></main>
}
