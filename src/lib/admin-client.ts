export async function adminRequest<T = any>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      signal: init?.signal || AbortSignal.timeout(30000),
      headers: {
        ...(typeof init?.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new Error(
      'Koneksi bermasalah. Server belum mengonfirmasi penyimpanan; isian tetap ada di formulir.'
    )
  }
  let result: any
  try {
    result = await response.json()
  } catch {
    throw new Error(
      `Server belum dapat memproses permintaan (${response.status}). Silakan coba lagi.`
    )
  }
  if (!response.ok || result.success === false)
    throw new Error(result.error || 'Permintaan gagal. Silakan coba lagi.')
  return result as T
}
