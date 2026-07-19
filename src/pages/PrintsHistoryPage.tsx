import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchMyPrintHistory } from '../data/printsStore'
import { useStudentAuth } from '../hooks/useStudentAuth'
import type { PrintLog } from '../types/prints'

export function PrintsHistoryPage() {
  const { isLoggedIn } = useStudentAuth()
  const [logs, setLogs] = useState<PrintLog[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn) return
    void fetchMyPrintHistory()
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return <Navigate to="/login?next=/prints/history" replace />
  }

  return (
    <div className="page-enter min-h-screen bg-fog">
      <SiteHeader variant="solid" />
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-3xl font-extrabold text-ink">Print history</h1>
          <Link to="/prints/dashboard" className="btn btn-outline">
            Dashboard
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
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">PDF</th>
                <th className="px-4 py-3 font-medium">Print #</th>
                <th className="px-4 py-3 font-medium">Date & time</th>
                <th className="px-4 py-3 font-medium">Printer</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-line/70">
                  <td className="px-4 py-3">{log.studentName}</td>
                  <td className="px-4 py-3">{log.pdfName}</td>
                  <td className="px-4 py-3">{log.printNumber}</td>
                  <td className="px-4 py-3 text-stone">
                    {new Date(log.printedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{log.printerName}</td>
                  <td className="px-4 py-3 font-semibold">{log.remainingCredits}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 ? (
            <p className="px-4 py-8 text-sm text-stone">No prints yet.</p>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
