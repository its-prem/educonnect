import { ApiError, API_BASE, apiFetch, isApiEnabled } from '../lib/api'
import { getStudentToken } from './studentStore'
import { getAdminToken } from './adminSession'
import type { PrintLog, PrintOrder, PrintPdf, PrintPurchase } from '../types/prints'

function studentToken() {
  const token = getStudentToken()
  if (!token) throw new Error('Please log in as a student to continue.')
  return token
}

export async function fetchPrintCatalog(): Promise<PrintPdf[]> {
  const data = await apiFetch<{ pdfs: PrintPdf[] }>('/prints/catalog', {
    token: studentToken(),
  })
  return data.pdfs ?? []
}

export async function createPrintOrder(pdfId: string, credits: number): Promise<PrintOrder> {
  const data = await apiFetch<{ order: PrintOrder }>('/prints/orders', {
    body: { pdfId, credits },
    token: studentToken(),
  })
  return data.order
}

export async function verifyPrintOrder(orderId: string): Promise<{ status: string }> {
  const data = await apiFetch<{ order: { status: string } }>('/prints/orders/verify', {
    body: { orderId },
    token: studentToken(),
  })
  return data.order
}

export async function fetchMyPrintPurchases(): Promise<PrintPurchase[]> {
  const data = await apiFetch<{ purchases: PrintPurchase[] }>('/prints/purchases', {
    token: studentToken(),
  })
  return data.purchases ?? []
}

export async function fetchMyPrintHistory(): Promise<PrintLog[]> {
  const data = await apiFetch<{ logs: PrintLog[] }>('/prints/history', {
    token: studentToken(),
  })
  return data.logs ?? []
}

export async function recordPrint(
  purchaseId: string,
  printerName = 'Browser Print',
): Promise<{ remaining: number; printNumber: number }> {
  const data = await apiFetch<{ print: { remaining: number; printNumber: number } }>(
    `/prints/purchases/${encodeURIComponent(purchaseId)}/print`,
    {
      body: { printerName },
      token: studentToken(),
    },
  )
  return data.print
}

/** Fetch PDF bytes via authenticated API (never expose a public file URL). */
export async function fetchPurchasePdfBlob(purchaseId: string): Promise<Blob> {
  if (!isApiEnabled()) {
    throw new ApiError('API URL not configured.')
  }
  const token = studentToken()
  const response = await fetch(
    `${API_BASE}/prints/purchases/${encodeURIComponent(purchaseId)}/view`,
    {
      headers: {
        Accept: 'application/pdf',
        Authorization: `Bearer ${token}`,
      },
    },
  )
  if (!response.ok) {
    let message = `Could not load PDF (${response.status})`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      /* ignore */
    }
    throw new ApiError(message, response.status)
  }
  return response.blob()
}

export async function adminListPrintPdfs(): Promise<PrintPdf[]> {
  const data = await apiFetch<{ pdfs: PrintPdf[] }>('/admin/prints', {
    token: getAdminToken(),
  })
  return data.pdfs ?? []
}

export async function adminUploadPrintPdf(input: {
  title: string
  pricePerCredit: number
  file: File
}): Promise<PrintPdf> {
  if (!isApiEnabled()) throw new ApiError('API URL not configured.')
  const form = new FormData()
  form.append('title', input.title)
  form.append('pricePerCredit', String(input.pricePerCredit))
  form.append('file', input.file)

  const response = await fetch(`${API_BASE}/admin/prints`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAdminToken() ?? ''}`,
    },
    body: form,
  })
  const data = (await response.json()) as { ok?: boolean; error?: string; pdf?: PrintPdf }
  if (!response.ok || data.ok === false || !data.pdf) {
    throw new ApiError(data.error || 'Upload failed', response.status)
  }
  return data.pdf
}

export async function adminUpdatePrintPdf(
  id: string,
  patch: { title?: string; pricePerCredit?: number; enabled?: boolean },
): Promise<PrintPdf> {
  const data = await apiFetch<{ pdf: PrintPdf }>(
    `/admin/prints/${encodeURIComponent(id)}/update`,
    { body: patch, token: getAdminToken() },
  )
  return data.pdf
}

export async function adminListPrintPurchases(): Promise<PrintPurchase[]> {
  const data = await apiFetch<{ purchases: PrintPurchase[] }>('/admin/prints/purchases', {
    token: getAdminToken(),
  })
  return data.purchases ?? []
}

export async function adminAdjustCredits(purchaseId: string, delta: number): Promise<PrintPurchase> {
  const data = await apiFetch<{ purchase: PrintPurchase }>(
    `/admin/prints/purchases/${encodeURIComponent(purchaseId)}/credits`,
    { body: { delta }, token: getAdminToken() },
  )
  return data.purchase
}

export async function adminListPrintLogs(): Promise<PrintLog[]> {
  const data = await apiFetch<{ logs: PrintLog[] }>('/admin/prints/logs', {
    token: getAdminToken(),
  })
  return data.logs ?? []
}

declare global {
  interface Window {
    Cashfree?: new (options: { mode: 'sandbox' | 'production' }) => {
      checkout: (opts: {
        paymentSessionId: string
        redirectTarget?: string
      }) => Promise<unknown>
    }
  }
}

export async function openCashfreeCheckout(paymentSessionId: string, mode: 'sandbox' | 'production') {
  await loadCashfreeSdk()
  if (!window.Cashfree) throw new Error('Cashfree SDK failed to load.')
  const cashfree = new window.Cashfree({ mode })
  await cashfree.checkout({ paymentSessionId, redirectTarget: '_self' })
}

function loadCashfreeSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Cashfree) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-cashfree-sdk]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Cashfree SDK load error')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true
    script.dataset.cashfreeSdk = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Cashfree SDK load error'))
    document.head.appendChild(script)
  })
}
