import { useCallback, useEffect, useState } from 'react'
import {
  getCurrentCollegeAccount,
  loginCollegeAccount,
  logoutCollegeAccount,
  registerCollegeAccount,
} from '../data/collegeAuthStore'
import type { CollegeAccount } from '../data/collegeAuthStore'

export function useCollegeAuth() {
  const [account, setAccount] = useState<CollegeAccount | null>(() => getCurrentCollegeAccount())

  const refresh = useCallback(() => setAccount(getCurrentCollegeAccount()), [])

  useEffect(() => {
    const onAuth = () => refresh()
    window.addEventListener('educonnect:college-auth', onAuth)
    window.addEventListener('storage', onAuth)
    return () => {
      window.removeEventListener('educonnect:college-auth', onAuth)
      window.removeEventListener('storage', onAuth)
    }
  }, [refresh])

  return {
    account,
    isLoggedIn: Boolean(account),
    register: registerCollegeAccount,
    login: loginCollegeAccount,
    logout: logoutCollegeAccount,
  }
}
