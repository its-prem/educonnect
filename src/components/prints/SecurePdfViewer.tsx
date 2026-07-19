import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { fetchPurchasePdfBlob, recordPrint, refundLastPrint } from '../../data/printsStore'
import { ApiError } from '../../lib/api'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

type SecurePdfViewerProps = {
  purchaseId: string
  studentName: string
  studentId: string
  remaining: number
  onRemainingChange: (remaining: number) => void
}

export function SecurePdfViewer({
  purchaseId,
  studentName,
  studentId,
  remaining,
  onRemainingChange,
}: SecurePdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyPrint, setBusyPrint] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const blob = await fetchPurchasePdfBlob(purchaseId)
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        const doc = await pdfjs.getDocument({ url }).promise
        if (cancelled) {
          void doc.destroy()
          return
        }
        setPdfDoc(doc)
        setPageCount(doc.numPages)
        setPage(1)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to load PDF')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [purchaseId])

  useEffect(() => {
    return () => {
      void pdfDoc?.destroy()
    }
  }, [pdfDoc])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let cancelled = false

    async function render() {
      const doc = pdfDoc
      if (!doc) return
      const pdfPage = await doc.getPage(page)
      if (cancelled || !canvasRef.current) return
      const viewport = pdfPage.getViewport({ scale: 1.35 })
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      await pdfPage.render({ canvasContext: ctx, viewport }).promise
      if (cancelled) return

      ctx.save()
      ctx.globalAlpha = 0.18
      ctx.fillStyle = '#0b1f33'
      ctx.font = '16px sans-serif'
      ctx.translate(viewport.width / 2, viewport.height / 2)
      ctx.rotate(-Math.PI / 6)
      const stamp = `${studentName} · ${studentId} · ${new Date().toLocaleString()}`
      ctx.fillText(stamp, -180, 0)
      ctx.restore()
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [pdfDoc, page, studentName, studentId])

  useEffect(() => {
    const block = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && (key === 'p' || key === 's' || key === 'u')) {
        event.preventDefault()
        event.stopPropagation()
      }
      if (key === 'f12') {
        event.preventDefault()
      }
    }
    const blockContext = (event: Event) => event.preventDefault()
    window.addEventListener('keydown', block, true)
    document.addEventListener('contextmenu', blockContext)
    return () => {
      window.removeEventListener('keydown', block, true)
      document.removeEventListener('contextmenu', blockContext)
    }
  }, [])

  function openConfirm() {
    if (remaining < 1) {
      setError('You have no print credits left. Please purchase additional credits.')
      return
    }
    const canvas = canvasRef.current
    if (!canvas) {
      setError('Nothing to print.')
      return
    }
    setError('')
    setPreviewUrl(canvas.toDataURL('image/png'))
    setConfirmOpen(true)
  }

  function closeConfirm() {
    if (busyPrint) return
    setConfirmOpen(false)
    setPreviewUrl(null)
  }

  async function confirmPrint() {
    if (remaining < 1) {
      setError('You have no print credits left. Please purchase additional credits.')
      setConfirmOpen(false)
      return
    }

    setBusyPrint(true)
    setError('')
    let deducted = false

    try {
      const result = await recordPrint(purchaseId, 'Browser Print')
      deducted = true
      onRemainingChange(result.remaining)

      const dataUrl = previewUrl ?? canvasRef.current?.toDataURL('image/png')
      if (!dataUrl) throw new Error('Nothing to print.')

      const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
      if (!win) throw new Error('Popup blocked — allow popups to print. Your credit was restored.')

      win.document.write(`<!doctype html><html><head><title>Print</title>
        <style>
          @page { margin: 12mm; }
          body { margin: 0; font-family: sans-serif; }
          .wm { position: fixed; inset: 0; display: grid; place-items: center;
            opacity: 0.12; font-size: 18px; transform: rotate(-24deg); pointer-events: none; }
          img { max-width: 100%; }
        </style></head><body>
        <div class="wm">${studentName} · ${studentId} · ${new Date().toLocaleString()}</div>
        <img src="${dataUrl}" alt="page" />
        <script>window.onload=function(){window.print();}</script>
        </body></html>`)
      win.document.close()

      setConfirmOpen(false)
      setPreviewUrl(null)
    } catch (err) {
      if (deducted) {
        try {
          const refunded = await refundLastPrint(purchaseId)
          onRemainingChange(refunded.remaining)
        } catch {
          /* keep deducted state; show primary error */
        }
      }
      setError(err instanceof Error ? err.message : 'Print failed')
    } finally {
      setBusyPrint(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone">
          Remaining prints: <span className="font-semibold text-ink">{remaining}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="grid place-items-center px-2 text-sm text-stone">
            {pageCount ? `${page} / ${pageCount}` : '—'}
          </span>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!pageCount || page >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busyPrint || remaining < 1 || loading}
            onClick={openConfirm}
          >
            Print
          </button>
        </div>
      </div>

      {remaining < 1 ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          You have no print credits left. Please purchase additional credits.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-stone">Loading secure document…</p>
      ) : (
        <div className="overflow-auto rounded-lg border border-line bg-mist p-2">
          <canvas ref={canvasRef} className="mx-auto max-w-full shadow-sm" />
        </div>
      )}

      <p className="mt-3 text-xs text-stone">
        Download, share, right-click, and browser Ctrl+P are blocked. Use the Print button only.
        Credit is used only after you confirm.
      </p>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-confirm-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-line bg-white p-5 shadow-xl">
            <h2 id="print-confirm-title" className="font-display text-xl font-bold text-ink">
              Confirm print
            </h2>
            <p className="mt-2 text-sm text-stone">
              This will use <span className="font-semibold text-ink">1 print credit</span>. Remaining
              after confirm: {Math.max(0, remaining - 1)}.
            </p>

            {previewUrl ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-line bg-mist p-2">
                <img src={previewUrl} alt="Print preview" className="mx-auto max-h-64 object-contain" />
              </div>
            ) : null}

            <p className="mt-3 text-xs text-stone">
              After you confirm, the browser print dialog opens. Cancelling that dialog still uses the
              credit (browser limitation).
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn btn-outline"
                disabled={busyPrint}
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busyPrint}
                onClick={() => void confirmPrint()}
              >
                {busyPrint ? 'Printing…' : 'Confirm print (1 credit)'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
