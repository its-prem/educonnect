import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'
import { SiteFooter } from '../components/layout/SiteFooter'
import { createPrintOrder, fetchPrintCatalog, openCashfreeCheckout } from '../data/printsStore'
import { useStudentAuth } from '../hooks/useStudentAuth'
import { isApiEnabled } from '../lib/api'
import type { PrintPdf } from '../types/prints'

export function PrintsCatalogPage() {
  const navigate = useNavigate()
  const { student, isLoggedIn } = useStudentAuth()
  const [pdfs, setPdfs] = useState<PrintPdf[]>([])
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<Record<string, number>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isApiEnabled()) {
      setLoading(false)
      return
    }
    setLoading(true)
    void fetchPrintCatalog()
      .then(setPdfs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load catalog'))
      .finally(() => setLoading(false))
  }, [])

  async function buy(pdf: PrintPdf) {
    if (!isLoggedIn) {
      navigate('/login?next=/prints')
      return
    }

    const count = credits[pdf.id] ?? 1
    setBusyId(pdf.id)
    setError('')
    setNotice('')
    try {
      const order = await createPrintOrder(pdf.id, count)
      if (order.mock || order.status === 'paid') {
        setNotice(
          `Payment recorded — ${count} credit(s) added for “${pdf.title}”. Go to My prints to Print.`,
        )
        return
      }
      setNotice('Opening Cashfree payment…')
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
              PDF print credits
            </h1>
            <p className="mt-2 max-w-xl text-sm text-stone">
              Har PDF card pe credits choose karke Buy & Pay karo. 1 credit = 1 print.
              {isLoggedIn && student ? ` Logged in as ${student.name}.` : ' Login required to pay.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isLoggedIn ? (
              <Link to="/login?next=/prints" className="btn btn-primary">
                Student Login
              </Link>
            ) : (
              <>
                <Link to="/prints/dashboard" className="btn btn-outline">
                  My prints
                </Link>
                <Link to="/prints/history" className="btn btn-ink">
                  History
                </Link>
              </>
            )}
          </div>
        </div>

        {!isApiEnabled() ? (
          <p className="mt-8 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Set VITE_API_URL in .env to your Hostinger API, then restart dev server.
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

        {loading ? <p className="mt-10 text-sm text-stone">Loading PDFs…</p> : null}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pdfs.map((pdf) => {
            const qty = credits[pdf.id] ?? 1
            const total = qty * pdf.pricePerCredit
            return (
              <article
                key={pdf.id}
                className="flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-[0_18px_40px_-28px_rgba(11,31,51,0.45)]"
              >
                <div className="flex h-36 items-end bg-gradient-to-br from-ink via-ink to-sea px-5 py-4">
                  <div>
                    <p className="text-xs font-medium tracking-wide text-white/70 uppercase">
                      PDF document
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold leading-snug text-white">
                      {pdf.title}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm text-stone">Price per print</p>
                    <p className="font-display text-2xl font-bold text-ink">
                      ₹{pdf.pricePerCredit.toFixed(2)}
                    </p>
                  </div>

                  <label className="mt-4 block text-sm font-medium text-ink">
                    Credits to buy
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="mt-1.5 w-full rounded-md border border-line px-3 py-2.5 text-base outline-none focus:border-sea"
                      value={qty}
                      onChange={(e) =>
                        setCredits((prev) => ({
                          ...prev,
                          [pdf.id]: Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                        }))
                      }
                    />
                  </label>

                  <p className="mt-3 text-sm text-stone">
                    Pay total:{' '}
                    <span className="text-base font-semibold text-ink">₹{total.toFixed(2)}</span>
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary btn-lg mt-5 w-full"
                    disabled={busyId === pdf.id}
                    onClick={() => void buy(pdf)}
                  >
                    {busyId === pdf.id
                      ? 'Opening payment…'
                      : isLoggedIn
                        ? 'Buy & Pay'
                        : 'Login to buy'}
                  </button>
                  <p className="mt-2 text-center text-xs text-stone">
                    Secure checkout via Cashfree
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        {!loading && isApiEnabled() && pdfs.length === 0 && !error ? (
          <div className="mt-10 rounded-xl border border-dashed border-line bg-white px-6 py-10 text-center">
            <p className="font-display text-xl font-bold text-ink">Abhi koi PDF uploaded nahi hai</p>
            <p className="mt-2 text-sm text-stone">
              Super Admin → Control panel → <strong>Secure PDF printing</strong> → Upload PDF + price
              (min ₹1). Uske baad yahan card + Buy & Pay dikhega.
            </p>
            <Link to="/admin" className="btn btn-outline mt-5">
              Open admin
            </Link>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
