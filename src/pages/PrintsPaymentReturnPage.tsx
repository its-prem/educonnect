import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'
import { verifyPrintOrder } from '../data/printsStore'
import { useStudentAuth } from '../hooks/useStudentAuth'

export function PrintsPaymentReturnPage() {
  const { isLoggedIn } = useStudentAuth()
  const [params] = useSearchParams()
  const orderId = params.get('order_id') ?? ''
  const [status, setStatus] = useState('Checking payment…')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!isLoggedIn || !orderId) return
    void verifyPrintOrder(orderId)
      .then((order) => {
        if (order.status === 'paid') {
          setOk(true)
          setStatus('Payment successful. Credits added.')
        } else {
          setStatus(`Payment status: ${order.status}`)
        }
      })
      .catch((err) => setStatus(err instanceof Error ? err.message : 'Verification failed'))
  }, [isLoggedIn, orderId])

  if (!isLoggedIn) {
    return <Navigate to={`/login?next=/prints/payment/return?order_id=${encodeURIComponent(orderId)}`} replace />
  }

  return (
    <div className="page-enter min-h-screen bg-fog">
      <SiteHeader variant="solid" />
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-display text-3xl font-bold text-ink">Payment return</h1>
        <p className="mt-4 text-stone">{status}</p>
        <div className="mt-8 flex gap-3">
          <Link to="/prints/dashboard" className="btn btn-primary">
            My prints
          </Link>
          {!ok ? (
            <Link to="/prints" className="btn btn-outline">
              Catalog
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  )
}
