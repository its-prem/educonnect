export type AdmissionApplication = {
  id: string
  collegeId: string
  collegeSlug: string
  collegeName: string
  studentName: string
  email: string
  phone: string
  branch: string
  message: string
  createdAt: string
  status: 'submitted' | 'under-review' | 'shortlisted' | 'rejected'
}

export const APPLICATIONS_STORAGE_KEY = 'educonnect.applications.v1'
