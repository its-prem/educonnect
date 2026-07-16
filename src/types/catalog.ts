export type CollegeType = 'government' | 'semi-government' | 'private'
export type AdmissionStatus = 'open' | 'closed'
export type ApprovalStatus = 'approved' | 'pending' | 'rejected'
export type ListingSource = 'admin' | 'student' | 'college'

export type Stream = {
  id: string
  name: string
  slug: string
  hint: string
}

export type Program = {
  id: string
  streamId: string
  name: string
  slug: string
}

/** One fees line per program / custom program */
export type FeeRow = {
  programLabel: string
  amount: string
}

export type College = {
  id: string
  slug: string
  name: string
  type: CollegeType
  programIds: string[]
  /** Extra program names not in catalog (e.g. MBA, Nursing) */
  customPrograms: string[]
  city: string
  location: string
  principalName: string
  /** Legacy plain-text fees (kept for older listings) */
  feesStructure: string
  feeRows: FeeRow[]
  /** Base64 data URL — students can view, download is discouraged in UI */
  feesPdf?: string
  /** All courses taught at this campus (shown on detail Programs card) */
  courses: string[]
  branches: string[]
  images: string[]
  admissionStatus: AdmissionStatus
  approvalStatus: ApprovalStatus
  submittedBy: ListingSource
  about: string
  shareUrl: string
}

export type CollegeInput = {
  name: string
  type: CollegeType
  city: string
  location: string
  principalName: string
  feesStructure: string
  feeRows?: FeeRow[]
  feesPdf?: string
  courses: string[]
  branches: string[]
  images: string[]
  programIds: string[]
  customPrograms?: string[]
  admissionStatus?: AdmissionStatus
  about?: string
  shareUrl?: string
  submittedBy?: ListingSource
  approvalStatus?: ApprovalStatus
}

export type CatalogData = {
  streams: Stream[]
  programs: Program[]
  colleges: College[]
}

export const COLLEGE_TYPE_LABELS: Record<CollegeType, string> = {
  government: 'Government',
  'semi-government': 'Semi Government',
  private: 'Private',
}

export const ADMISSION_STATUS_LABELS: Record<AdmissionStatus, string> = {
  open: 'Admission Open',
  closed: 'Admission Closed',
}

export function formatFeeRows(rows: FeeRow[]): string {
  const lines = rows
    .map((row) => `${row.programLabel.trim()}: ${row.amount.trim()}`)
    .filter((line) => !line.endsWith(':'))
  return lines.length > 0 ? lines.join('\n') : 'Fees details coming soon'
}
