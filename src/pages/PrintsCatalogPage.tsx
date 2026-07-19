import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'
import { SiteFooter } from '../components/layout/SiteFooter'
import { createPrintOrder, fetchPrintCatalog, openCashfreeCheckout } from '../data/printsStore'
import { useStudentAuth } from '../hooks/useStudentAuth'
import { isApiEnabled } from '../lib/api'
import type { PrintPdf } from '../types/prints'

export function PrintsCatalogPage() {
  const { student, isLoggedIn } = useStudentAuth()
  const [pdfs, setPdfs] = useState<PrintPdf[]>([])
  const [credits, setCredits] = useState<Record<string, number>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isLoggedIn || !isApiEnabled()) return
    void fetchPrintCatalog()
      .then(setPdfs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load catalog'))
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return <Navigate to="/login?next=/prints" replace />
  }

  async function buy(pdf: PrintPdf) {
    const count = credits[pdf.id] ?? 1
    setBusyId(pdf.id)
    setError('')
    setNotice('')
    try {
      const order = await createPrintOrder(pdf.id, count)
      if (order.mock || order.status === 'paid') {
        setNotice(`Mock payment success — ${count} credit(s) added for “${pdf.title}”.`)
        return
      }
      setNotice('Opening Cashfree checkout…')
      await openCashfreeCheckout(
        order.paymentSessionId,
        import.meta.env.VITE_CASHFREE_MODE === 'production' ? 'production' : 'sandbox',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-enter min-h-screen bg-fog">
      <SiteHeader variant="solid" />
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-wide text-sea uppercase">Secure printing</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink md:text-4xl">
              Buy print credits
            </h1>
            <p className="mt-2 max-w-xl text-sm text-stone">
              Each credit prints a PDF once. View only inside the app — download and share are
              disabled. Hi {student?.name}.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/prints/dashboard" className="btn btn-outline">
              My prints
            </Link>
            <Link to="/prints/history" className="btn btn-ink">
              History
            </Link>
          </div>
        </div>

        {!isApiEnabled() ? (
          <p className="mt-8 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Set VITE_API_URL to your Hostinger API to use printing.
          </p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {notice}{' '}
            <Link to="/prints/dashboard" className="font-semibold underline">
              Open dashboard
            </Link>
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {pdfs.map((pdf) => (
            <article key={pdf.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <h2 className="font-display text-xl font-bold text-ink">{pdf.title}</h2>
              <p className="mt-2 text-sm text-stone">
                ₹{pdf.pricePerCredit.toFixed(2)} per print credit
              </p>
              <label className="mt-4 block text-sm font-medium text-ink">
                Credits to buy
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="mt-1.5 w-full rounded-md border border-line px-3 py-2"
                  value={credits[pdf.id] ?? 1}
                  onChange={(e) =>
                    setCredits((prev) => ({
                      ...prev,
                      [pdf.id]: Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                    }))
                  }
                />
              </label>
              <p className="mt-2 text-sm text-stone">
                Total: ₹
                {((credits[pdf.id] ?? 1) * pdf.pricePerCredit).toFixed(2)}
              </p>
              <button
                type="button"
                className="btn btn-primary mt-4 w-full"
                disabled={busyId === pdf.id}
                onClick={() => void buy(pdf)}
              >
                {busyId === pdf.id ? 'Processing…' : 'Buy credits'}
              </button>
            </article>
          ))}
        </div>

        {isApiEnabled() && pdfs.length === 0 && !error ? (
          <p className="mt-10 text-sm text-stone">No PDFs available yet. Ask admin to upload.</p>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
