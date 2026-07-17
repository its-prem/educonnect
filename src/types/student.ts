export type Student = {
  id: string
  name: string
  phone: string
  email: string
  /** Linked approved college id — null/empty means registered via "Other" */
  collegeId: string | null
  collegeName: string
  branch: string
  createdAt: string
}

export const STUDENTS_STORAGE_KEY = 'educonnect.students.v3'
export const STUDENT_SESSION_KEY = 'educonnect.studentSession'

function normName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Student may edit a campus when:
 * - they selected it from the dropdown (collegeId match), OR
 * - they registered as Other but typed the same college name
 */
export function studentCanContributeTo(
  student: Student,
  college: { id: string; name: string },
) {
  if (student.collegeId && student.collegeId === college.id) return true
  if (!student.collegeId && normName(student.collegeName) === normName(college.name)) {
    return true
  }
  return false
}

/** Student chose "Other" and name is not an existing campus — may submit a new listing. */
export function studentCanListNewCollege(student: Student) {
  return !student.collegeId
}
