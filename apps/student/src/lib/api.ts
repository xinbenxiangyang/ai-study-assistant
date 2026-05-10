const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return localStorage.getItem('auth_token') || undefined
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${apiUrl}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function uploadPdf(file: File) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${apiUrl}/pdf/extract`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}
