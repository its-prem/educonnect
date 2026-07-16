import { ApiError, apiFetch, isApiEnabled } from '../lib/api'
import { getAdminToken } from './adminSession'
import { CATALOG_STORAGE_KEY, seedCatalog } from './seedCatalog'
import type {
  CatalogData,
  College,
  CollegeInput,
  FeeRow,
  Program,
  Stream,
} from '../types/catalog'
import { formatFeeRows } from '../types/catalog'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function cloneSeed(): CatalogData {
  return structuredClone(seedCatalog)
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeCollege(raw: Partial<College> & Pick<College, 'id' | 'name'>): College {
  const slug = raw.slug || slugify(raw.name) || raw.id
  const branches = raw.branches ?? []
  const courses =
    raw.courses && raw.courses.length > 0
      ? raw.courses
      : branches.map((branch) => branch)
  const customPrograms = raw.customPrograms ?? []
  const feeRows =
    raw.feeRows && raw.feeRows.length > 0
      ? raw.feeRows
      : parseLegacyFees(raw.feesStructure ?? '')
  const feesStructure =
    raw.feesStructure?.trim() ||
    (feeRows.length > 0
      ? feeRows.map((row) => `${row.programLabel}: ${row.amount}`).join('\n')
      : 'Fees details coming soon')

  return {
    id: raw.id,
    slug,
    name: raw.name,
    type: raw.type ?? 'private',
    programIds: raw.programIds ?? [],
    customPrograms,
    city: raw.city ?? '',
    location: raw.location ?? raw.city ?? '',
    principalName: raw.principalName ?? 'To be updated',
    feesStructure,
    feeRows,
    feesPdf: raw.feesPdf,
    courses,
    branches,
    images: raw.images?.length
      ? raw.images
      : [
          'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=80',
        ],
    admissionStatus: raw.admissionStatus ?? 'open',
    approvalStatus: raw.approvalStatus ?? 'approved',
    submittedBy: raw.submittedBy ?? 'admin',
    about: raw.about ?? '',
    shareUrl: raw.shareUrl || `https://educonnect.demo/colleges/${slug}`,
  }
}

function parseLegacyFees(text: string): FeeRow[] {
  if (!text.trim() || text === 'Fees details coming soon') return []
  return text
    .split(/\n|·|;/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const splitAt = part.indexOf(':')
      if (splitAt > 0) {
        return {
          programLabel: part.slice(0, splitAt).trim(),
          amount: part.slice(splitAt + 1).trim(),
        }
      }
      return { programLabel: 'Fees', amount: part }
    })
}

function normalizeCatalog(data: CatalogData): CatalogData {
  return {
    streams: data.streams ?? [],
    programs: data.programs ?? [],
    colleges: (data.colleges ?? []).map((college) => normalizeCollege(college)),
  }
}

export function loadCatalog(): CatalogData {
  if (!canUseStorage()) return cloneSeed()

  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY)
    if (!raw) {
      const seed = cloneSeed()
      window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw) as CatalogData
    if (!parsed.streams || !parsed.programs || !parsed.colleges) {
      const seed = cloneSeed()
      window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return normalizeCatalog(parsed)
  } catch {
    return cloneSeed()
  }
}

export function saveCatalog(data: CatalogData) {
  if (!canUseStorage()) return
  window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('educonnect:catalog-updated'))
}

export async function refreshCatalogFromApi(): Promise<CatalogData> {
  if (!isApiEnabled()) return loadCatalog()

  try {
    const [streamsRes, programsRes, collegesRes] = await Promise.all([
      apiFetch<{ streams: Stream[] }>('/streams'),
      apiFetch<{ programs: Program[] }>('/programs'),
      apiFetch<{ colleges: College[] }>('/colleges?status=all'),
    ])

    const data = normalizeCatalog({
      streams: streamsRes.streams ?? [],
      programs: programsRes.programs ?? [],
      colleges: collegesRes.colleges ?? [],
    })
    saveCatalog(data)
    return data
  } catch {
    return loadCatalog()
  }
}

function collegePayload(input: CollegeInput) {
  const feeRows = (input.feeRows ?? [])
    .map((row) => ({
      programLabel: row.programLabel.trim(),
      amount: row.amount.trim(),
    }))
    .filter((row) => row.programLabel && row.amount)

  return {
    name: input.name.trim(),
    type: input.type,
    city: input.city.trim(),
    location: input.location.trim(),
    principalName: input.principalName.trim(),
    feesStructure: input.feesStructure.trim() || formatFeeRows(feeRows),
    feeRows,
    about: input.about?.trim() ?? '',
    programIds: input.programIds,
    customPrograms: (input.customPrograms ?? []).map((item) => item.trim()).filter(Boolean),
    branches: input.branches.map((branch) => branch.trim()).filter(Boolean),
    images: input.images.map((image) => image.trim()).filter(Boolean),
    submittedBy: input.submittedBy ?? 'student',
    shareUrl: input.shareUrl?.trim() || '',
  }
}

export function getApprovedColleges() {
  return loadCatalog().colleges.filter((college) => college.approvalStatus === 'approved')
}

export function getPendingColleges() {
  return loadCatalog().colleges.filter((college) => college.approvalStatus === 'pending')
}

export function getCollegeBySlug(slug: string) {
  return loadCatalog().colleges.find((college) => college.slug === slug)
}

export function getApprovedCollegeBySlug(slug: string) {
  return getApprovedColleges().find((college) => college.slug === slug)
}

export function addStream(input: { name: string; hint: string }) {
  const catalog = loadCatalog()
  const stream: Stream = {
    id: createId('stream'),
    name: input.name.trim(),
    slug: slugify(input.name),
    hint: input.hint.trim(),
  }
  catalog.streams.push(stream)
  saveCatalog(catalog)
  return stream
}

export function removeStream(streamId: string) {
  const catalog = loadCatalog()
  const programIds = new Set(
    catalog.programs.filter((program) => program.streamId === streamId).map((p) => p.id),
  )
  catalog.streams = catalog.streams.filter((stream) => stream.id !== streamId)
  catalog.programs = catalog.programs.filter((program) => program.streamId !== streamId)
  catalog.colleges = catalog.colleges
    .map((college) => ({
      ...college,
      programIds: college.programIds.filter((id) => !programIds.has(id)),
    }))
    .filter((college) => college.programIds.length > 0)
  saveCatalog(catalog)
}

export function addProgram(input: { streamId: string; name: string }) {
  const catalog = loadCatalog()
  const program: Program = {
    id: createId('prog'),
    streamId: input.streamId,
    name: input.name.trim(),
    slug: slugify(input.name),
  }
  catalog.programs.push(program)
  saveCatalog(catalog)
  return program
}

export function removeProgram(programId: string) {
  const catalog = loadCatalog()
  catalog.programs = catalog.programs.filter((program) => program.id !== programId)
  catalog.colleges = catalog.colleges
    .map((college) => ({
      ...college,
      programIds: college.programIds.filter((id) => id !== programId),
    }))
    .filter((college) => college.programIds.length > 0)
  saveCatalog(catalog)
}

function buildCollege(input: CollegeInput, existingId?: string, existingSlug?: string): College {
  const id = existingId ?? createId('col')
  const slug = existingSlug ?? (slugify(input.name) || id)
  const feeRows = (input.feeRows ?? [])
    .map((row) => ({
      programLabel: row.programLabel.trim(),
      amount: row.amount.trim(),
    }))
    .filter((row) => row.programLabel && row.amount)
  const feesStructure = input.feesStructure.trim() || formatFeeRows(feeRows)
  const customPrograms = (input.customPrograms ?? [])
    .map((item) => item.trim())
    .filter(Boolean)

  return normalizeCollege({
    id,
    slug,
    name: input.name.trim(),
    type: input.type,
    city: input.city.trim(),
    location: input.location.trim(),
    principalName: input.principalName.trim(),
    feesStructure,
    feeRows,
    feesPdf: input.feesPdf,
    courses: input.courses.map((course) => course.trim()).filter(Boolean),
    branches: input.branches.map((branch) => branch.trim()).filter(Boolean),
    images: input.images.map((image) => image.trim()).filter(Boolean),
    programIds: input.programIds,
    customPrograms,
    admissionStatus: input.admissionStatus ?? 'open',
    approvalStatus: input.approvalStatus ?? 'pending',
    submittedBy: input.submittedBy ?? 'student',
    about: input.about?.trim() ?? '',
    shareUrl: input.shareUrl?.trim() || `https://educonnect.demo/colleges/${slug}`,
  })
}

export async function addCollege(input: CollegeInput) {
  if (isApiEnabled()) {
    const token = getAdminToken()
    const created = await apiFetch<{ college: College }>('/colleges', {
      body: { ...collegePayload(input), submittedBy: 'admin' },
    })
    if (input.approvalStatus !== 'pending') {
      await apiFetch(`/admin/colleges/${encodeURIComponent(created.college.id)}/approve`, {
        method: 'POST',
        token,
      })
    }
    await refreshCatalogFromApi()
    return (
      loadCatalog().colleges.find((college) => college.id === created.college.id) ??
      normalizeCollege(created.college)
    )
  }

  const catalog = loadCatalog()
  const college = buildCollege({
    ...input,
    submittedBy: input.submittedBy ?? 'admin',
    approvalStatus: input.approvalStatus ?? 'approved',
  })
  catalog.colleges.push(college)
  saveCatalog(catalog)
  return college
}

export function updateCollege(collegeId: string, input: CollegeInput) {
  const catalog = loadCatalog()
  const existing = catalog.colleges.find((college) => college.id === collegeId)
  if (!existing) return null

  const updated = buildCollege(
    {
      ...input,
      submittedBy: input.submittedBy ?? existing.submittedBy,
      approvalStatus: input.approvalStatus ?? existing.approvalStatus,
      admissionStatus: input.admissionStatus ?? existing.admissionStatus,
    },
    existing.id,
    existing.slug,
  )

  catalog.colleges = catalog.colleges.map((college) =>
    college.id === collegeId ? updated : college,
  )
  saveCatalog(catalog)
  return updated
}

export async function submitCollegeListing(input: CollegeInput) {
  if (isApiEnabled()) {
    try {
      const data = await apiFetch<{ college: College }>('/colleges', {
        body: {
          ...collegePayload(input),
          submittedBy: input.submittedBy ?? 'student',
        },
      })
      await refreshCatalogFromApi()
      return normalizeCollege(data.college)
    } catch (error) {
      throw new Error(
        error instanceof ApiError ? error.message : 'Could not submit college listing.',
      )
    }
  }

  const catalog = loadCatalog()
  const college = buildCollege({
    ...input,
    submittedBy: input.submittedBy ?? 'student',
    approvalStatus: 'pending',
    admissionStatus: input.admissionStatus ?? 'open',
  })
  catalog.colleges.push(college)
  saveCatalog(catalog)
  return college
}

export async function approveCollege(collegeId: string) {
  if (isApiEnabled()) {
    await apiFetch(`/admin/colleges/${encodeURIComponent(collegeId)}/approve`, {
      method: 'POST',
      token: getAdminToken(),
    })
    await refreshCatalogFromApi()
    return
  }

  const catalog = loadCatalog()
  catalog.colleges = catalog.colleges.map((college) =>
    college.id === collegeId ? { ...college, approvalStatus: 'approved' as const } : college,
  )
  saveCatalog(catalog)
}

export async function rejectCollege(collegeId: string) {
  if (isApiEnabled()) {
    await apiFetch(`/admin/colleges/${encodeURIComponent(collegeId)}/reject`, {
      method: 'POST',
      token: getAdminToken(),
    })
    await refreshCatalogFromApi()
    return
  }

  const catalog = loadCatalog()
  catalog.colleges = catalog.colleges.map((college) =>
    college.id === collegeId ? { ...college, approvalStatus: 'rejected' as const } : college,
  )
  saveCatalog(catalog)
}

export function removeCollege(collegeId: string) {
  const catalog = loadCatalog()
  catalog.colleges = catalog.colleges.filter((college) => college.id !== collegeId)
  saveCatalog(catalog)
}

export function resetCatalogToSeed() {
  const seed = cloneSeed()
  saveCatalog(seed)
  return seed
}
