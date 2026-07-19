import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchMyPrintPurchases } from '../data/printsStore'
import { useStudentAuth } from '../hooks/useStudentAuth'
import type { PrintPurchase } from '../types/prints'

export function PrintsDashboardPage() {
  const { isLoggedIn } = useStudentAuth()
  const [rows, setRows] = useState<PrintPurchase[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn) return
    void fetchMyPrintPurchases()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return <Navigate to="/login?next=/prints/dashboard" replace />
  }

  return (
    <div className="page-enter min-h-screen bg-fog">
      <SiteHeader variant="solid" />
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">My print credits</h1>
            <p className="mt-2 text-sm text-stone">
              Print only when remaining credits are greater than zero.
            </p>
          </div>
          <Link to="/prints" className="btn btn-primary">
            Buy more credits
          </Link>
        </div>

        {error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-fog text-stone">
              <tr>
                <th className="px-4 py-3 font-medium">PDF</th>
                <th className="px-4 py-3 font-medium">Purchased</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line/70">
                  <td className="px-4 py-3 font-medium text-ink">{row.pdfTitle}</td>
                  <td className="px-4 py-3 text-stone">
                    {new Date(row.purchasedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{row.creditsTotal}</td>
                  <td className="px-4 py-3">{row.creditsUsed}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{row.remaining}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/prints/view/${row.id}`}
                      className={`btn btn-sm ${row.remaining > 0 ? 'btn-primary' : 'btn-outline pointer-events-none opacity-50'}`}
                      aria-disabled={row.remaining < 1}
                    >
                      Print
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-sm text-stone">No purchases yet.</p>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
