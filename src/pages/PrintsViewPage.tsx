import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { SecurePdfViewer } from '../components/prints/SecurePdfViewer'
import { fetchMyPrintPurchases } from '../data/printsStore'
import { useStudentAuth } from '../hooks/useStudentAuth'
import type { PrintPurchase } from '../types/prints'

export function PrintsViewPage() {
  const { purchaseId = '' } = useParams()
  const { student, isLoggedIn } = useStudentAuth()
  const [purchase, setPurchase] = useState<PrintPurchase | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn || !purchaseId) return
    void fetchMyPrintPurchases()
      .then((rows) => {
        const row = rows.find((r) => r.id === purchaseId) ?? null
        setPurchase(row)
        setRemaining(row?.remaining ?? 0)
        if (!row) setError('Purchase not found.')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [isLoggedIn, purchaseId])

  if (!isLoggedIn) {
    return <Navigate to={`/login?next=/prints/view/${purchaseId}`} replace />
  }

  return (
    <div className="page-enter min-h-screen bg-fog">
      <SiteHeader variant="solid" />
      <main className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-stone">Secure viewer</p>
            <h1 className="font-display text-2xl font-bold text-ink">
              {purchase?.pdfTitle ?? 'Document'}
            </h1>
          </div>
          <Link to="/prints/dashboard" className="btn btn-outline">
            Back to dashboard
          </Link>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {purchase && student ? (
          <SecurePdfViewer
            purchaseId={purchase.id}
            studentName={student.name}
            studentId={student.id}
            remaining={remaining}
            onRemainingChange={setRemaining}
          />
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
