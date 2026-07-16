import { ApiError, apiFetch, isApiEnabled } from '../lib/api'

const ADMIN_SESSION_KEY = 'educonnect.superAdmin'
const ADMIN_TOKEN_KEY = 'educonnect.adminToken'

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function isSuperAdmin(): boolean {
  if (typeof window === 'undefined') return false
  if (isApiEnabled()) {
    return Boolean(getAdminToken())
  }
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'
}

export async function loginSuperAdmin(password: string): Promise<boolean> {
  if (isApiEnabled()) {
    try {
      const data = await apiFetch<{ token: string }>('/admin/login', {
        body: { username: 'admin', password: password.trim() },
      })
      window.sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token)
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
      window.dispatchEvent(new CustomEvent('educonnect:admin-auth'))
      return true
    } catch (error) {
      if (error instanceof ApiError) return false
      return false
    }
  }

  if (password.trim() === 'admin123') {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
    window.dispatchEvent(new CustomEvent('educonnect:admin-auth'))
    return true
  }
  return false
}

export function logoutSuperAdmin() {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  window.dispatchEvent(new CustomEvent('educonnect:admin-auth'))
}
