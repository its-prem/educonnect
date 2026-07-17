import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  loadApplications,
  refreshApplicationsFromApi,
} from '../data/applicationsStore'
import {
  isSuperAdmin,
  loginSuperAdmin,
  logoutSuperAdmin,
} from '../data/adminSession'
import { loadCatalog, refreshCatalogFromApi } from '../data/catalogStore'
import {
  loadContributions,
  refreshContributionsFromApi,
} from '../data/contributionsStore'
import { getCurrentStudent } from '../data/studentStore'
import { isApiEnabled } from '../lib/api'
import type { CatalogData } from '../types/catalog'
import type { CollegeContribution } from '../types/contributions'
import type { AdmissionApplication } from '../types/applications'

function subscribeCatalog(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener('educonnect:catalog-updated', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('educonnect:catalog-updated', handler)
    window.removeEventListener('storage', handler)
  }
}

function getCatalogSnapshot() {
  return JSON.stringify(loadCatalog())
}

export function useCatalog(): CatalogData {
  const raw = useSyncExternalStore(subscribeCatalog, getCatalogSnapshot, getCatalogSnapshot)

  useEffect(() => {
    if (!isApiEnabled()) return
    void refreshCatalogFromApi()
  }, [])

  return JSON.parse(raw) as CatalogData
}

export function useApprovedColleges() {
  const catalog = useCatalog()
  return catalog.colleges.filter((college) => college.approvalStatus === 'approved')
}

function subscribeApplications(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener('educonnect:applications-updated', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('educonnect:applications-updated', handler)
    window.removeEventListener('storage', handler)
  }
}

function getApplicationsSnapshot() {
  return JSON.stringify(loadApplications())
}

export function useApplications(): AdmissionApplication[] {
  const raw = useSyncExternalStore(
    subscribeApplications,
    getApplicationsSnapshot,
    getApplicationsSnapshot,
  )

  useEffect(() => {
    if (!isApiEnabled()) return
    if (isSuperAdmin()) {
      void refreshApplicationsFromApi()
      return
    }
    const student = getCurrentStudent()
    void refreshApplicationsFromApi(student?.email)
  }, [])

  return JSON.parse(raw) as AdmissionApplication[]
}

function subscribeContributions(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener('educonnect:contributions-updated', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('educonnect:contributions-updated', handler)
    window.removeEventListener('storage', handler)
  }
}

function getContributionsSnapshot() {
  return JSON.stringify(loadContributions())
}

/** Admin-only: pending & reviewed student contributions. */
export function useContributions(): CollegeContribution[] {
  const raw = useSyncExternalStore(
    subscribeContributions,
    getContributionsSnapshot,
    getContributionsSnapshot,
  )

  useEffect(() => {
    if (!isApiEnabled()) return
    if (isSuperAdmin()) {
      void refreshContributionsFromApi()
    }
  }, [])

  return JSON.parse(raw) as CollegeContribution[]
}

export { isSuperAdmin, loginSuperAdmin, logoutSuperAdmin }

export function useSuperAdmin() {
  const [isAdmin, setIsAdmin] = useState(() => isSuperAdmin())

  const refresh = useCallback(() => setIsAdmin(isSuperAdmin()), [])

  useEffect(() => {
    const onAuth = () => refresh()
    window.addEventListener('educonnect:admin-auth', onAuth)
    window.addEventListener('storage', onAuth)
    return () => {
      window.removeEventListener('educonnect:admin-auth', onAuth)
      window.removeEventListener('storage', onAuth)
    }
  }, [refresh])

  return {
    isAdmin,
    login: loginSuperAdmin,
    logout: logoutSuperAdmin,
  }
}
