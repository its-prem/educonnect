import { useCallback, useEffect, useState } from 'react'
import {
  getCurrentStudent,
  loginStudent,
  logoutStudent,
  registerStudent,
} from '../data/studentStore'
import type { Student } from '../types/student'

export function useStudentAuth() {
  const [student, setStudent] = useState<Student | null>(() => getCurrentStudent())

  const refresh = useCallback(() => setStudent(getCurrentStudent()), [])

  useEffect(() => {
    const onAuth = () => refresh()
    window.addEventListener('educonnect:student-auth', onAuth)
    window.addEventListener('storage', onAuth)
    return () => {
      window.removeEventListener('educonnect:student-auth', onAuth)
      window.removeEventListener('storage', onAuth)
    }
  }, [refresh])

  return {
    student,
    isLoggedIn: Boolean(student),
    register: registerStudent,
    login: loginStudent,
    logout: logoutStudent,
  }
}
