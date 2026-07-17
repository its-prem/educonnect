import { ApiError, apiFetch, isApiEnabled } from '../lib/api'
import { getAdminToken } from './adminSession'
import { STUDENTS_STORAGE_KEY, STUDENT_SESSION_KEY, type Student } from '../types/student'

const STUDENT_PROFILE_KEY = 'educonnect.studentProfile'

export type AuthResult = { ok: true; student: Student } | { ok: false; error: string }

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function createId() {
  return `stu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeStudent(raw: Partial<Student> & Pick<Student, 'id' | 'name' | 'phone' | 'email'>): Student {
  const collegeId = raw.collegeId?.trim() || null
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    email: raw.email,
    collegeId,
    collegeName: raw.collegeName?.trim() ?? '',
    branch: raw.branch?.trim() ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

function emitAuthChange() {
  window.dispatchEvent(new CustomEvent('educonnect:student-auth'))
}

function setSessionStudent(student: Student) {
  if (!canUseStorage()) return
  window.sessionStorage.setItem(STUDENT_SESSION_KEY, student.id)
  window.sessionStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(student))
  emitAuthChange()
}

export function loadStudents(): Student[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(STUDENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<Student>[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is Partial<Student> & Pick<Student, 'id' | 'name' | 'phone' | 'email'> =>
        Boolean(item?.id && item?.name && item?.phone && item?.email),
      )
      .map(normalizeStudent)
  } catch {
    return []
  }
}

function saveStudents(students: Student[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students))
}

export function getCurrentStudent(): Student | null {
  if (!canUseStorage()) return null

  const profileRaw = window.sessionStorage.getItem(STUDENT_PROFILE_KEY)
  if (profileRaw) {
    try {
      return normalizeStudent(JSON.parse(profileRaw) as Student)
    } catch {
      /* fall through */
    }
  }

  const id = window.sessionStorage.getItem(STUDENT_SESSION_KEY)
  if (!id) return null
  return loadStudents().find((student) => student.id === id) ?? null
}

export async function registerStudent(input: {
  name: string
  phone: string
  email: string
  collegeId: string | null
  collegeName: string
  branch: string
}): Promise<AuthResult> {
  const name = input.name.trim()
  const phone = normalizePhone(input.phone)
  const email = normalizeEmail(input.email)
  const collegeId = input.collegeId?.trim() || null
  const collegeName = input.collegeName.trim()
  const branch = input.branch.trim()

  if (name.length < 2) return { ok: false, error: 'Please enter your full name.' }
  if (collegeName.length < 2) return { ok: false, error: 'Please select or enter your college name.' }
  if (branch.length < 2) return { ok: false, error: 'Please enter your branch.' }
  if (phone.length < 10) return { ok: false, error: 'Enter a valid 10-digit phone number.' }
  if (!email.includes('@') || !email.includes('.')) {
    return { ok: false, error: 'Enter a valid Gmail / email address.' }
  }

  if (isApiEnabled()) {
    try {
      const data = await apiFetch<{ student: Student }>('/students/register', {
        body: { name, phone, email, collegeId, collegeName, branch },
      })
      const student = normalizeStudent(data.student)
      setSessionStudent(student)
      return { ok: true, student }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof ApiError ? error.message : 'Registration failed. Try again.',
      }
    }
  }

  const students = loadStudents()
  if (students.some((student) => student.email === email)) {
    return { ok: false, error: 'This email is already registered. Please log in.' }
  }
  if (students.some((student) => student.phone === phone)) {
    return { ok: false, error: 'This phone number is already registered. Please log in.' }
  }

  const student: Student = {
    id: createId(),
    name,
    phone,
    email,
    collegeId,
    collegeName,
    branch,
    createdAt: new Date().toISOString(),
  }

  students.push(student)
  saveStudents(students)
  setSessionStudent(student)
  return { ok: true, student }
}

export async function loginStudent(input: {
  email: string
  phone: string
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email)
  const phone = normalizePhone(input.phone)

  if (!email || phone.length < 10) {
    return { ok: false, error: 'Enter your Gmail and phone number to log in.' }
  }

  if (isApiEnabled()) {
    try {
      const data = await apiFetch<{ student: Student }>('/students/login', {
        body: { email, phone },
      })
      const student = normalizeStudent(data.student)
      setSessionStudent(student)
      return { ok: true, student }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof ApiError ? error.message : 'Login failed. Try again.',
      }
    }
  }

  const student = loadStudents().find(
    (item) => item.email === email && item.phone === phone,
  )

  if (!student) {
    return {
      ok: false,
      error: 'No account found for this Gmail + phone. Register first.',
    }
  }

  setSessionStudent(student)
  return { ok: true, student }
}

/** Admin-only: all registered students (server list in API mode, local otherwise). */
export async function listStudentsForAdmin(): Promise<Student[]> {
  if (isApiEnabled()) {
    try {
      const data = await apiFetch<{ students: Student[] }>('/admin/students', {
        token: getAdminToken(),
      })
      return (data.students ?? []).map(normalizeStudent)
    } catch {
      return []
    }
  }
  return loadStudents()
}

export type StudentAdminInput = {
  name: string
  phone: string
  email: string
  collegeId: string | null
  collegeName: string
  branch: string
}

/** Admin-only: update a student profile. */
export async function updateStudentForAdmin(
  studentId: string,
  input: StudentAdminInput,
): Promise<Student> {
  const name = input.name.trim()
  const phone = normalizePhone(input.phone)
  const email = normalizeEmail(input.email)
  const collegeId = input.collegeId?.trim() || null
  const collegeName = input.collegeName.trim()
  const branch = input.branch.trim()

  if (name.length < 2) throw new Error('Please enter the student full name.')
  if (collegeName.length < 2) throw new Error('Please enter the college name.')
  if (branch.length < 2) throw new Error('Please enter the branch.')
  if (phone.length < 10) throw new Error('Enter a valid 10-digit phone number.')
  if (!email.includes('@') || !email.includes('.')) throw new Error('Enter a valid email.')

  if (isApiEnabled()) {
    const data = await apiFetch<{ student: Student }>(
      `/admin/students/${encodeURIComponent(studentId)}/update`,
      {
        body: { name, phone, email, collegeId, collegeName, branch },
        token: getAdminToken(),
      },
    )
    return normalizeStudent(data.student)
  }

  const students = loadStudents()
  const index = students.findIndex((s) => s.id === studentId)
  if (index < 0) throw new Error('Student not found.')

  if (students.some((s) => s.id !== studentId && s.email === email)) {
    throw new Error('Another student already uses this email.')
  }
  if (students.some((s) => s.id !== studentId && s.phone === phone)) {
    throw new Error('Another student already uses this phone.')
  }

  const updated: Student = {
    ...students[index],
    name,
    phone,
    email,
    collegeId,
    collegeName,
    branch,
  }
  students[index] = updated
  saveStudents(students)

  // Keep live session in sync if this student is currently logged in
  if (canUseStorage() && window.sessionStorage.getItem(STUDENT_SESSION_KEY) === studentId) {
    setSessionStudent(updated)
  }

  return updated
}

/** Admin-only: permanently delete a student profile. */
export async function deleteStudentForAdmin(studentId: string): Promise<void> {
  if (isApiEnabled()) {
    await apiFetch(`/admin/students/${encodeURIComponent(studentId)}/delete`, {
      method: 'POST',
      token: getAdminToken(),
    })
    return
  }

  const students = loadStudents().filter((s) => s.id !== studentId)
  saveStudents(students)

  if (canUseStorage() && window.sessionStorage.getItem(STUDENT_SESSION_KEY) === studentId) {
    window.sessionStorage.removeItem(STUDENT_SESSION_KEY)
    window.sessionStorage.removeItem(STUDENT_PROFILE_KEY)
    emitAuthChange()
  }
}

export function logoutStudent() {
  if (!canUseStorage()) return
  window.sessionStorage.removeItem(STUDENT_SESSION_KEY)
  window.sessionStorage.removeItem(STUDENT_PROFILE_KEY)
  emitAuthChange()
}
