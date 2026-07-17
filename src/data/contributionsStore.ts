import { ApiError, apiFetch, isApiEnabled } from '../lib/api'
import { getAdminToken } from './adminSession'
import { loadCatalog, refreshCatalogFromApi, saveCatalog } from './catalogStore'
import {
  CONTRIBUTIONS_STORAGE_KEY,
  type CollegeContribution,
  type CollegeEditFields,
  type ContributionInput,
} from '../types/contributions'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createId() {
  return `contrib-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function loadContributions(): CollegeContribution[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(CONTRIBUTIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CollegeContribution[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveContributions(items: CollegeContribution[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(CONTRIBUTIONS_STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('educonnect:contributions-updated'))
}

let inflight: Promise<CollegeContribution[]> | null = null

export async function refreshContributionsFromApi(): Promise<CollegeContribution[]> {
  if (!isApiEnabled()) return loadContributions()
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const data = await apiFetch<{ contributions: CollegeContribution[] }>(
        '/admin/contributions?status=all',
        { token: getAdminToken() },
      )
      const items = data.contributions ?? []
      saveContributions(items)
      return items
    } catch {
      return loadContributions()
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export async function submitContribution(input: ContributionInput): Promise<void> {
  if (isApiEnabled()) {
    try {
      await apiFetch(`/colleges/${encodeURIComponent(input.collegeId)}/contributions`, {
        body: {
          images: input.images,
          edits: input.edits,
          note: input.note,
          studentId: input.studentId,
          studentName: input.studentName,
          studentEmail: input.studentEmail,
          studentPhone: input.studentPhone,
        },
      })
      return
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.status === 404
            ? 'Server pe contributions API abhi upload nahi hui. Hostinger pe naya api/index.php aur contributions_*.php upload karo.'
            : error.message
          : 'Could not send your request. Try again.'
      throw new Error(msg)
    }
  }

  const contribution: CollegeContribution = {
    id: createId(),
    collegeId: input.collegeId,
    collegeSlug: input.collegeSlug,
    collegeName: input.collegeName,
    studentId: input.studentId,
    studentName: input.studentName,
    studentEmail: input.studentEmail,
    studentPhone: input.studentPhone,
    images: input.images,
    edits: input.edits,
    note: input.note,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  const items = loadContributions()
  items.unshift(contribution)
  saveContributions(items)
}

function mergeContributionIntoCatalog(contribution: CollegeContribution) {
  const catalog = loadCatalog()
  const { edits, images } = contribution
  catalog.colleges = catalog.colleges.map((college) => {
    if (college.id !== contribution.collegeId && college.slug !== contribution.collegeSlug) {
      return college
    }
    const merged = { ...college }
    if (edits.about) merged.about = edits.about
    if (edits.location) merged.location = edits.location
    if (edits.principalName) merged.principalName = edits.principalName
    if (edits.type) merged.type = edits.type
    if (edits.admissionStatus) merged.admissionStatus = edits.admissionStatus
    if (edits.feesStructure) {
      merged.feesStructure = edits.feesStructure
      merged.feeRows = []
    }
    if (edits.branches?.length) {
      const seen = new Set(merged.branches.map((b) => b.toLowerCase()))
      const extra = edits.branches.filter((b) => !seen.has(b.toLowerCase()))
      merged.branches = [...merged.branches, ...extra]
    }
    if (images.length) {
      merged.images = [...merged.images, ...images]
    }
    return merged
  })
  saveCatalog(catalog)
}

export async function approveContribution(id: string): Promise<void> {
  if (isApiEnabled()) {
    await apiFetch(`/admin/contributions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      token: getAdminToken(),
    })
    await Promise.all([refreshContributionsFromApi(), refreshCatalogFromApi(true)])
    return
  }

  const items = loadContributions()
  const contribution = items.find((item) => item.id === id)
  if (!contribution) return
  mergeContributionIntoCatalog(contribution)
  saveContributions(
    items.map((item) => (item.id === id ? { ...item, status: 'approved' as const } : item)),
  )
}

export async function rejectContribution(id: string): Promise<void> {
  if (isApiEnabled()) {
    await apiFetch(`/admin/contributions/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      token: getAdminToken(),
    })
    await refreshContributionsFromApi()
    return
  }

  const items = loadContributions()
  saveContributions(
    items.map((item) => (item.id === id ? { ...item, status: 'rejected' as const } : item)),
  )
}

export type ContributionUpdateInput = {
  images: string[]
  edits: CollegeEditFields
  note: string
}

/** Admin-only: edit a pending student contribution before approve/reject. */
export async function updateContribution(
  id: string,
  input: ContributionUpdateInput,
): Promise<CollegeContribution> {
  if (isApiEnabled()) {
    const data = await apiFetch<{ contribution: CollegeContribution }>(
      `/admin/contributions/${encodeURIComponent(id)}/update`,
      {
        body: {
          images: input.images,
          edits: input.edits,
          note: input.note,
        },
        token: getAdminToken(),
      },
    )
    await refreshContributionsFromApi()
    return data.contribution
  }

  const items = loadContributions()
  const existing = items.find((item) => item.id === id)
  if (!existing) throw new Error('Contribution not found.')
  if (existing.status !== 'pending') throw new Error('Only pending requests can be updated.')

  const updated: CollegeContribution = {
    ...existing,
    images: input.images,
    edits: input.edits,
    note: input.note.trim(),
  }
  saveContributions(items.map((item) => (item.id === id ? updated : item)))
  return updated
}
