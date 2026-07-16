/** Hostinger PHP API base URL — set in `.env` as VITE_API_URL */
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export function isApiEnabled() {
  return API_BASE.length > 0
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiOptions = {
  method?: string
  body?: unknown
  token?: string | null
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!isApiEnabled()) {
    throw new ApiError('API URL not configured. Set VITE_API_URL in .env')
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const response = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  const payload = data as { ok?: boolean; error?: string } | null
  if (!response.ok || payload?.ok === false) {
    throw new ApiError(
      payload?.error || `Request failed (${response.status})`,
      response.status,
    )
  }

  return data as T
}
