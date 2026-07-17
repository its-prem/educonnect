import { COLLEGE_LOGIN_ENABLED } from '../config/features'
import { ApiError, apiFetch, isApiEnabled } from '../lib/api'
import { STUDENT_SESSION_KEY } from '../types/student'

const DISABLED_MSG = 'College login is temporarily disabled. Please use Student Login.'

export type CollegeAccount = {
  id: string
  collegeName: string
  contactName: string
  phone: string
  email: string
  branch: string
  createdAt: string
}

export type CollegeAuthResult =
  | { ok: true; account: CollegeAccount }
  | { ok: false; error: string }

export const COLLEGE_ACCOUNTS_KEY = 'educonnect.collegeAccounts.v2'
export const COLLEGE_SESSION_KEY = 'educonnect.collegeSession'
const COLLEGE_PROFILE_KEY = 'educonnect.collegeProfile'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createId() {
  return `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeAccount(raw: CollegeAccount): CollegeAccount {
  return {
    id: raw.id,
    collegeName: raw.collegeName,
    contactName: raw.contactName,
    phone: raw.phone,
    email: raw.email,
    branch: raw.branch?.trim() ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

function emitAuthChange() {
  window.dispatchEvent(new CustomEvent('educonnect:college-auth'))
}

function setSessionAccount(account: CollegeAccount) {
  if (!canUseStorage()) return
  window.sessionStorage.setItem(COLLEGE_SESSION_KEY, account.id)
  window.sessionStorage.setItem(COLLEGE_PROFILE_KEY, JSON.stringify(account))
  window.sessionStorage.removeItem(STUDENT_SESSION_KEY)
  window.sessionStorage.removeItem('educonnect.studentProfile')
  emitAuthChange()
}

export function loadCollegeAccounts(): CollegeAccount[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(COLLEGE_ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<CollegeAccount>[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is Partial<CollegeAccount> & Pick<CollegeAccount, 'id' | 'collegeName' | 'contactName' | 'phone' | 'email'> =>
        Boolean(item?.id && item?.collegeName && item?.contactName && item?.phone && item?.email),
      )
      .map((item) =>
        normalizeAccount({
          id: item.id,
          collegeName: item.collegeName,
          contactName: item.contactName,
          phone: item.phone,
          email: item.email,
          branch: item.branch?.trim() ?? '',
          createdAt: item.createdAt ?? new Date().toISOString(),
        }),
      )
  } catch {
    return []
  }
}

function saveCollegeAccounts(accounts: CollegeAccount[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(COLLEGE_ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function getCurrentCollegeAccount(): CollegeAccount | null {
  if (!canUseStorage()) return null

  const profileRaw = window.sessionStorage.getItem(COLLEGE_PROFILE_KEY)
  if (profileRaw) {
    try {
      return normalizeAccount(JSON.parse(profileRaw) as CollegeAccount)
    } catch {
      /* fall through */
    }
  }

  const id = window.sessionStorage.getItem(COLLEGE_SESSION_KEY)
  if (!id) return null
  return loadCollegeAccounts().find((account) => account.id === id) ?? null
}

export async function registerCollegeAccount(input: {
  collegeName: string
  contactName: string
  phone: string
  email: string
  branch: string
}): Promise<CollegeAuthResult> {
  if (!COLLEGE_LOGIN_ENABLED) {
    return { ok: false, error: DISABLED_MSG }
  }

  const collegeName = input.collegeName.trim()
  const contactName = input.contactName.trim()
  const phone = normalizePhone(input.phone)
  const email = normalizeEmail(input.email)
  const branch = input.branch.trim()

  if (collegeName.length < 2) return { ok: false, error: 'Enter the college name.' }
  if (contactName.length < 2) return { ok: false, error: 'Enter a contact person name.' }
  if (branch.length < 2) return { ok: false, error: 'Enter at least one branch (e.g. CSE).' }
  if (phone.length < 10) return { ok: false, error: 'Enter a valid 10-digit phone number.' }
  if (!email.includes('@') || !email.includes('.')) {
    return { ok: false, error: 'Enter a valid Gmail / email address.' }
  }

  if (isApiEnabled()) {
    try {
      const data = await apiFetch<{ account: CollegeAccount }>('/college-accounts/register', {
        body: { collegeName, contactName, phone, email, branch },
      })
      const account = normalizeAccount(data.account)
      setSessionAccount(account)
      return { ok: true, account }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof ApiError ? error.message : 'Registration failed. Try again.',
      }
    }
  }

  const accounts = loadCollegeAccounts()
  if (accounts.some((account) => account.email === email)) {
    return { ok: false, error: 'This email is already registered. Please log in.' }
  }

  const account: CollegeAccount = {
    id: createId(),
    collegeName,
    contactName,
    phone,
    email,
    branch,
    createdAt: new Date().toISOString(),
  }

  accounts.push(account)
  saveCollegeAccounts(accounts)
  setSessionAccount(account)
  return { ok: true, account }
}

export async function loginCollegeAccount(input: {
  email: string
  phone: string
}): Promise<CollegeAuthResult> {
  if (!COLLEGE_LOGIN_ENABLED) {
    return { ok: false, error: DISABLED_MSG }
  }

  const email = normalizeEmail(input.email)
  const phone = normalizePhone(input.phone)

  if (!email || phone.length < 10) {
    return { ok: false, error: 'Enter college Gmail and phone number to log in.' }
  }

  if (isApiEnabled()) {
    try {
      const data = await apiFetch<{ account: CollegeAccount }>('/college-accounts/login', {
        body: { email, phone },
      })
      const account = normalizeAccount(data.account)
      setSessionAccount(account)
      return { ok: true, account }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof ApiError ? error.message : 'Login failed. Try again.',
      }
    }
  }

  const account = loadCollegeAccounts().find(
    (item) => item.email === email && item.phone === phone,
  )

  if (!account) {
    return {
      ok: false,
      error: 'No campus account found for this Gmail + phone. Register first.',
    }
  }

  setSessionAccount(account)
  return { ok: true, account }
}

export function logoutCollegeAccount() {
  if (!canUseStorage()) return
  window.sessionStorage.removeItem(COLLEGE_SESSION_KEY)
  window.sessionStorage.removeItem(COLLEGE_PROFILE_KEY)
  emitAuthChange()
}
