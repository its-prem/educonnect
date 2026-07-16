import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CollegeListingForm } from '../components/colleges/CollegeListingForm'
import { CollegeTypeBadge } from '../components/colleges/CollegeTypeBadge'
import { AdminShell } from '../components/layout/AdminShell'
import {
  addCollege,
  addProgram,
  addStream,
  approveCollege,
  refreshCatalogFromApi,
  rejectCollege,
  removeCollege,
  removeProgram,
  removeStream,
  resetCatalogToSeed,
  updateCollege,
} from '../data/catalogStore'
import { useApplications, useCatalog, useSuperAdmin } from '../hooks/useCatalog'
import { isApiEnabled } from '../lib/api'
import { ADMISSION_STATUS_LABELS } from '../types/catalog'

type Panel = 'streams' | 'programs' | 'colleges' | null

export function AdminDashboardPage() {
  const { isAdmin, logout } = useSuperAdmin()
  const catalog = useCatalog()
  const applications = useApplications()
  const [openPanel, setOpenPanel] = useState<Panel>(null)
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null)

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  const pending = catalog.colleges.filter((college) => college.approvalStatus === 'pending')
  const approved = catalog.colleges.filter((college) => college.approvalStatus === 'approved')
  const rejected = catalog.colleges.filter((college) => college.approvalStatus === 'rejected')

  return (
    <AdminShell showLogout onLogout={logout}>
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-wide text-stone uppercase">Super Admin</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink">Control panel</h1>
            <p className="mt-2 max-w-xl text-sm text-stone">
              Approve listings, manage catalog with +, and track admission applications. This panel
              is not shown in the public menu.
            </p>
          </div>
          {isApiEnabled() ? (
            <button
              type="button"
              onClick={() => void refreshCatalogFromApi()}
              className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-mist"
            >
              Refresh from server
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset catalog to demo seed data?')) {
                  resetCatalogToSeed()
                }
              }}
              className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-mist"
            >
              Reset demo data
            </button>
          )}
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-ink">Pending college requests</h2>
          <p className="mt-1 text-xs text-stone">
            Review each student submission. Only approved colleges show publicly. {pending.length}{' '}
            waiting.
          </p>
          <ul className="mt-4 space-y-3">
            {pending.map((college) => {
              const programNames = [
                ...catalog.programs
                  .filter((program) => college.programIds.includes(program.id))
                  .map((program) => program.name),
                ...(college.customPrograms ?? []),
              ]
              const feeLines =
                college.feeRows?.length > 0
                  ? college.feeRows.map((row) => `${row.programLabel}: ${row.amount}`)
                  : college.feesStructure
                    ? [college.feesStructure]
                    : []

              return (
                <li
                  key={college.id}
                  className="rounded-lg border border-line bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{college.name}</p>
                        <CollegeTypeBadge type={college.type} />
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 uppercase">
                          Request · {college.submittedBy}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone">
                        {college.city} · {college.principalName} ·{' '}
                        {ADMISSION_STATUS_LABELS[college.admissionStatus]}
                      </p>
                      <p className="mt-1 text-xs text-stone">{college.location}</p>
                      {programNames.length > 0 ? (
                        <p className="mt-2 text-xs text-ink">
                          <span className="font-semibold">Programs:</span>{' '}
                          {programNames.join(' · ')}
                        </p>
                      ) : null}
                      {feeLines.length > 0 ? (
                        <p className="mt-1 whitespace-pre-line text-xs text-ink">
                          <span className="font-semibold">Fees:</span>
                          {'\n'}
                          {feeLines.join('\n')}
                        </p>
                      ) : null}
                      {college.images.length > 0 ? (
                        <div className="mt-3 flex gap-2 overflow-x-auto">
                          {college.images.slice(0, 6).map((src, index) => (
                            <img
                              key={`${college.id}-img-${index}`}
                              src={src}
                              alt=""
                              className="h-14 w-20 shrink-0 rounded object-cover ring-1 ring-line"
                            />
                          ))}
                          {college.images.length > 6 ? (
                            <span className="flex h-14 items-center text-xs text-stone">
                              +{college.images.length - 6} more
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/colleges/${college.slug}`}
                        className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-mist"
                      >
                        View full
                      </Link>
                      <button
                        type="button"
                        onClick={() => void approveCollege(college.id)}
                        className="rounded-md bg-sea px-3 py-1.5 text-sm font-semibold text-white hover:bg-sea-deep"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void rejectCollege(college.id)}
                        className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-stone hover:bg-mist hover:text-ink"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
            {pending.length === 0 ? (
              <li className="rounded-lg border border-line bg-white px-4 py-6 text-sm text-stone">
                No pending listing requests right now.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="mt-12">
          <SectionHeader
            title="Streams"
            count={catalog.streams.length}
            onAdd={() => setOpenPanel(openPanel === 'streams' ? null : 'streams')}
            open={openPanel === 'streams'}
          />
          {openPanel === 'streams' ? (
            <AddStreamForm onDone={() => setOpenPanel(null)} onCancel={() => setOpenPanel(null)} />
          ) : null}
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {catalog.streams.map((stream) => (
              <li key={stream.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold text-ink">{stream.name}</p>
                  <p className="text-xs text-stone">{stream.hint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remove stream “${stream.name}” and its programs?`)) {
                      void removeStream(stream.id)
                    }
                  }}
                  className="rounded-md px-2 py-1 text-sm font-medium text-stone hover:bg-mist hover:text-ink"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <SectionHeader
            title="Programs"
            count={catalog.programs.length}
            onAdd={() => setOpenPanel(openPanel === 'programs' ? null : 'programs')}
            open={openPanel === 'programs'}
          />
          {openPanel === 'programs' ? (
            <AddProgramForm
              streams={catalog.streams}
              onDone={() => setOpenPanel(null)}
              onCancel={() => setOpenPanel(null)}
            />
          ) : null}
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {catalog.programs.map((program) => {
              const streamName =
                catalog.streams.find((stream) => stream.id === program.streamId)?.name ?? '—'
              return (
                <li key={program.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-semibold text-ink">{program.name}</p>
                    <p className="text-xs text-stone">{streamName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove program “${program.name}”?`)) {
                        void removeProgram(program.id)
                      }
                    }}
                    className="rounded-md px-2 py-1 text-sm font-medium text-stone hover:bg-mist hover:text-ink"
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mt-12">
          <SectionHeader
            title="Approved colleges"
            count={approved.length}
            onAdd={() => {
              setEditingCollegeId(null)
              setOpenPanel(openPanel === 'colleges' ? null : 'colleges')
            }}
            open={openPanel === 'colleges' && !editingCollegeId}
          />
          {openPanel === 'colleges' && !editingCollegeId ? (
            <div className="mt-4 rounded-lg border border-line bg-white p-4">
              <p className="mb-3 text-sm text-stone">
                Add college with programs (Diploma / B.Tech…) and branches. Goes live immediately.
              </p>
              <CollegeListingForm
                programs={catalog.programs}
                streams={catalog.streams}
                submitLabel="Add & publish college"
                defaultSubmittedBy="admin"
                showAdmissionToggle
                onCancel={() => setOpenPanel(null)}
                onSubmit={async (input) => {
                  await addCollege({ ...input, approvalStatus: 'approved', submittedBy: 'admin' })
                  setOpenPanel(null)
                }}
              />
            </div>
          ) : null}

          {editingCollegeId ? (
            <div className="mt-4 rounded-lg border border-sea/30 bg-white p-4">
              <p className="mb-3 text-sm font-medium text-ink">
                Update programs, branches, fees, and other details
              </p>
              <CollegeListingForm
                key={editingCollegeId}
                programs={catalog.programs}
                streams={catalog.streams}
                submitLabel="Save college updates"
                defaultSubmittedBy="admin"
                showAdmissionToggle
                initialCollege={approved.find((college) => college.id === editingCollegeId) ?? null}
                onCancel={() => setEditingCollegeId(null)}
                onSubmit={async (input) => {
                  await updateCollege(editingCollegeId, {
                    ...input,
                    approvalStatus: 'approved',
                    submittedBy: 'admin',
                  })
                  setEditingCollegeId(null)
                }}
              />
            </div>
          ) : null}

          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {approved.map((college) => (
              <li key={college.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/colleges/${college.slug}`}
                      className="font-semibold text-ink hover:text-sea-deep"
                    >
                      {college.name}
                    </Link>
                    <CollegeTypeBadge type={college.type} />
                  </div>
                  <p className="mt-0.5 text-xs text-stone">
                    {college.programIds.length} programs · {college.branches.length} branches ·{' '}
                    {ADMISSION_STATUS_LABELS[college.admissionStatus]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPanel(null)
                      setEditingCollegeId(college.id)
                    }}
                    className="rounded-md border border-line px-2 py-1 text-sm font-medium text-ink hover:bg-mist"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove college “${college.name}”?`)) {
                        void removeCollege(college.id)
                      }
                    }}
                    className="rounded-md px-2 py-1 text-sm font-medium text-stone hover:bg-mist hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
            {approved.length === 0 ? (
              <li className="px-4 py-6 text-sm text-stone">No approved colleges. Use + to add one.</li>
            ) : null}
          </ul>
          {rejected.length > 0 ? (
            <p className="mt-3 text-xs text-stone">{rejected.length} rejected listing(s) kept in storage.</p>
          ) : null}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-ink">Admission applications</h2>
          <p className="mt-1 text-xs text-stone">{applications.length} submitted via Take Admission</p>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {applications.slice(0, 20).map((app) => (
              <li key={app.id} className="px-4 py-3">
                <p className="font-semibold text-ink">
                  {app.studentName} → {app.collegeName}
                </p>
                <p className="text-xs text-stone">
                  {app.email} · {app.phone} · {app.branch} · {app.status}
                </p>
              </li>
            ))}
            {applications.length === 0 ? (
              <li className="px-4 py-6 text-sm text-stone">No applications yet.</li>
            ) : null}
          </ul>
        </section>
      </main>
    </AdminShell>
  )
}

function SectionHeader({
  title,
  count,
  onAdd,
  open,
}: {
  title: string
  count: number
  onAdd: () => void
  open: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
        <p className="text-xs text-stone">{count} saved</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-expanded={open}
        aria-label={open ? `Close add ${title}` : `Add ${title}`}
        className={`flex h-11 w-11 items-center justify-center rounded-lg border text-2xl font-light leading-none transition-all duration-300 ${
          open
            ? 'border-ink bg-ink text-white'
            : 'border-line bg-white text-ink hover:border-sea hover:text-sea'
        }`}
      >
        {open ? '×' : '+'}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-md border border-line bg-white px-3 py-2.5 text-ink outline-none transition-colors focus:border-sea'

function AddStreamForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [hint, setHint] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await addStream({ name, hint: hint || 'Programs coming soon' })
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-line bg-white p-4">
      <Field label="Stream name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Hint line">
        <input className={inputClass} value={hint} onChange={(e) => setHint(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="rounded-md bg-sea px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? 'Adding…' : 'Add stream'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-4 py-2.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function AddProgramForm({
  streams,
  onDone,
  onCancel,
}: {
  streams: ReturnType<typeof useCatalog>['streams']
  onDone: () => void
  onCancel: () => void
}) {
  const [streamId, setStreamId] = useState(streams[0]?.id ?? '')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!streamId || !name.trim()) return
    setBusy(true)
    try {
      await addProgram({ streamId, name })
      onDone()
    } finally {
      setBusy(false)
    }
  }

  if (streams.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-line bg-white px-4 py-3 text-sm text-stone">
        Add a stream first, then programs.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-line bg-white p-4">
      <Field label="Stream">
        <select className={inputClass} value={streamId} onChange={(e) => setStreamId(e.target.value)}>
          {streams.map((stream) => (
            <option key={stream.id} value={stream.id}>
              {stream.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Program name">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Diploma"
          required
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="rounded-md bg-sea px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? 'Adding…' : 'Add program'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-4 py-2.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
