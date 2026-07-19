import { useEffect, useState, type FormEvent } from 'react'
import {
  adminAdjustCredits,
  adminListPrintLogs,
  adminListPrintPdfs,
  adminListPrintPurchases,
  adminUpdatePrintPdf,
  adminUploadPrintPdf,
} from '../../data/printsStore'
import type { PrintLog, PrintPdf, PrintPurchase } from '../../types/prints'

type Notice = { type: 'ok' | 'err'; text: string }

export function AdminPrintsSection({
  onNotice,
}: {
  onNotice: (notice: Notice) => void
}) {
  const [pdfs, setPdfs] = useState<PrintPdf[]>([])
  const [purchases, setPurchases] = useState<PrintPurchase[]>([])
  const [logs, setLogs] = useState<PrintLog[]>([])
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('10')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [creditDelta, setCreditDelta] = useState<Record<string, string>>({})

  async function reload() {
    const [p, pu, l] = await Promise.all([
      adminListPrintPdfs(),
      adminListPrintPurchases(),
      adminListPrintLogs(),
    ])
    setPdfs(p)
    setPurchases(pu)
    setLogs(l)
  }

  useEffect(() => {
    void reload().catch((err) =>
      onNotice({ type: 'err', text: err instanceof Error ? err.message : 'Failed to load prints' }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUpload(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      onNotice({ type: 'err', text: 'Choose a PDF file.' })
      return
    }
    setBusy(true)
    try {
      await adminUploadPrintPdf({
        title: title.trim(),
        pricePerCredit: Number(price) || 0,
        file,
      })
      setTitle('')
      setPrice('10')
      setFile(null)
      await reload()
      onNotice({ type: 'ok', text: 'PDF uploaded.' })
    } catch (err) {
      onNotice({ type: 'err', text: err instanceof Error ? err.message : 'Upload failed' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-12 space-y-10 border-t border-line pt-10">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Secure PDF printing</h2>
        <p className="mt-1 text-xs text-stone">
          Upload PDFs, set price per credit, manage student credits, and view print logs.
        </p>
      </div>

      <form onSubmit={(e) => void handleUpload(e)} className="rounded-lg border border-line bg-white p-4">
        <h3 className="text-sm font-semibold text-ink">Upload PDF</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block text-sm">
            <span className="text-stone">Title</span>
            <input
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-stone">Price per credit (₹)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="mt-1 w-full rounded-md border border-line px-3 py-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-stone">PDF file</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="mt-1 w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary mt-4" disabled={busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">PDFs</h3>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-fog text-stone">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">₹ / credit</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pdfs.map((pdf) => (
              <tr key={pdf.id} className="border-t border-line/70">
                <td className="px-4 py-2">{pdf.title}</td>
                <td className="px-4 py-2">{pdf.pricePerCredit.toFixed(2)}</td>
                <td className="px-4 py-2">{pdf.enabled ? 'Enabled' : 'Disabled'}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded border border-line px-2 py-1 text-xs"
                      onClick={() => {
                        const next = window.prompt('New price per credit', String(pdf.pricePerCredit))
                        if (next == null) return
                        void adminUpdatePrintPdf(pdf.id, { pricePerCredit: Number(next) })
                          .then(() => reload())
                          .then(() => onNotice({ type: 'ok', text: 'Price updated.' }))
                          .catch((err) =>
                            onNotice({
                              type: 'err',
                              text: err instanceof Error ? err.message : 'Update failed',
                            }),
                          )
                      }}
                    >
                      Price
                    </button>
                    <button
                      type="button"
                      className="rounded border border-line px-2 py-1 text-xs"
                      onClick={() => {
                        void adminUpdatePrintPdf(pdf.id, { enabled: !pdf.enabled })
                          .then(() => reload())
                          .then(() =>
                            onNotice({
                              type: 'ok',
                              text: pdf.enabled ? 'PDF disabled.' : 'PDF enabled.',
                            }),
                          )
                          .catch((err) =>
                            onNotice({
                              type: 'err',
                              text: err instanceof Error ? err.message : 'Update failed',
                            }),
                          )
                      }}
                    >
                      {pdf.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pdfs.length === 0 ? <p className="px-4 py-6 text-sm text-stone">No PDFs uploaded.</p> : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
          Student purchases
        </h3>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-fog text-stone">
            <tr>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">PDF</th>
              <th className="px-4 py-2 font-medium">Total / Used / Left</th>
              <th className="px-4 py-2 font-medium">Adjust credits</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((row) => (
              <tr key={row.id} className="border-t border-line/70">
                <td className="px-4 py-2">
                  <div>{row.studentName}</div>
                  <div className="text-xs text-stone">{row.studentEmail}</div>
                </td>
                <td className="px-4 py-2">{row.pdfTitle}</td>
                <td className="px-4 py-2">
                  {row.creditsTotal} / {row.creditsUsed} / {row.remaining}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="w-20 rounded border border-line px-2 py-1"
                      placeholder="+1 / -1"
                      value={creditDelta[row.id] ?? ''}
                      onChange={(e) =>
                        setCreditDelta((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="rounded border border-line px-2 py-1 text-xs"
                      onClick={() => {
                        const delta = Number(creditDelta[row.id] ?? 0)
                        if (!delta) {
                          onNotice({ type: 'err', text: 'Enter a non-zero delta.' })
                          return
                        }
                        void adminAdjustCredits(row.id, delta)
                          .then(() => reload())
                          .then(() => onNotice({ type: 'ok', text: 'Credits updated.' }))
                          .catch((err) =>
                            onNotice({
                              type: 'err',
                              text: err instanceof Error ? err.message : 'Adjust failed',
                            }),
                          )
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 ? (
          <p className="px-4 py-6 text-sm text-stone">No purchases yet.</p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Print logs</h3>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-fog text-stone">
            <tr>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">PDF</th>
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Printer</th>
              <th className="px-4 py-2 font-medium">Left</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-line/70">
                <td className="px-4 py-2">{log.studentName}</td>
                <td className="px-4 py-2">{log.pdfName}</td>
                <td className="px-4 py-2">{log.printNumber}</td>
                <td className="px-4 py-2 text-stone">
                  {new Date(log.printedAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">{log.printerName}</td>
                <td className="px-4 py-2">{log.remainingCredits}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 ? <p className="px-4 py-6 text-sm text-stone">No print logs yet.</p> : null}
      </div>
    </section>
  )
}
