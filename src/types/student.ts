export type Student = {
  id: string
  name: string
  phone: string
  email: string
  collegeName: string
  branch: string
  createdAt: string
}

export const STUDENTS_STORAGE_KEY = 'educonnect.students.v2'
export const STUDENT_SESSION_KEY = 'educonnect.studentSession'
