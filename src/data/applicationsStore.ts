import { ApiError, apiFetch, isApiEnabled } from '../lib/api'
import { APPLICATIONS_STORAGE_KEY, type AdmissionApplication } from '../types/applications'
import { getAdminToken } from './adminSession'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createId() {
  return `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function emitUpdated() {
  window.dispatchEvent(new CustomEvent('educonnect:applications-updated'))
}

export function loadApplications(): AdmissionApplication[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(APPLICATIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AdmissionApplication[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveApplications(apps: AdmissionApplication[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps))
  emitUpdated()
}

export async function refreshApplicationsFromApi(email?: string) {
  if (!isApiEnabled()) return loadApplications()

  try {
    const query = email?.trim()
      ? `?email=${encodeURIComponent(email.trim().toLowerCase())}`
      : ''
    const token = query ? null : getAdminToken()
    const data = await apiFetch<{ applications: AdmissionApplication[] }>(
      `/applications${query}`,
      { token },
    )
    saveApplications(data.applications ?? [])
    return data.applications ?? []
  } catch {
    return loadApplications()
  }
}

export async function submitAdmissionApplication(input: {
  collegeId: string
  collegeSlug: string
  collegeName: string
  studentName: string
  email: string
  phone: string
  branch: string
  message: string
}): Promise<AdmissionApplication> {
  if (isApiEnabled()) {
    try {
      const data = await apiFetch<{ application: AdmissionApplication }>('/applications', {
        body: input,
      })
      const apps = loadApplications()
      apps.unshift(data.application)
      saveApplications(apps)
      return data.application
    } catch (error) {
      throw new Error(
        error instanceof ApiError ? error.message : 'Could not submit application.',
      )
    }
  }

  const apps = loadApplications()
  const application: AdmissionApplication = {
    id: createId(),
    collegeId: input.collegeId,
    collegeSlug: input.collegeSlug,
    collegeName: input.collegeName,
    studentName: input.studentName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    branch: input.branch.trim(),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
    status: 'submitted',
  }
  apps.unshift(application)
  saveApplications(apps)
  return application
}

export function getApplicationsByEmail(email: string) {
  const needle = email.trim().toLowerCase()
  return loadApplications().filter((app) => app.email.toLowerCase() === needle)
}
