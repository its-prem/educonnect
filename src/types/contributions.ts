import type { AdmissionStatus, CollegeType } from './catalog'

export type ContributionStatus = 'pending' | 'approved' | 'rejected'

/**
 * Fields a student can propose to change on an existing college.
 * All optional — only the keys the student actually edits are sent.
 */
export type CollegeEditFields = {
  about?: string
  location?: string
  principalName?: string
  type?: CollegeType
  admissionStatus?: AdmissionStatus
  feesStructure?: string
  branches?: string[]
}

/**
 * A student contribution / change request against a college.
 * Photos and edits stay pending until the Super Admin approves them.
 */
export type CollegeContribution = {
  id: string
  collegeId: string
  collegeSlug: string
  collegeName: string
  studentId: string
  studentName: string
  studentEmail: string
  studentPhone: string
  /** New campus photos proposed by the student (data URLs) */
  images: string[]
  /** Proposed edits to existing fields */
  edits: CollegeEditFields
  /** Optional note from the student to the admin */
  note: string
  status: ContributionStatus
  createdAt: string
}

export type ContributionInput = {
  collegeId: string
  collegeSlug: string
  collegeName: string
  studentId: string
  studentName: string
  studentEmail: string
  studentPhone: string
  images: string[]
  edits: CollegeEditFields
  note: string
}

export const CONTRIBUTIONS_STORAGE_KEY = 'educonnect.contributions.v1'
