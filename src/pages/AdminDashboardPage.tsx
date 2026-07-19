import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CollegeListingForm } from '../components/colleges/CollegeListingForm'
import { CollegeTypeBadge } from '../components/colleges/CollegeTypeBadge'
import { AdminShell } from '../components/layout/AdminShell'
import {
  addCollege,
  addProgram,
  addStream,
  approveCollege,
  bulkAddColleges,
  refreshCatalogFromApi,
  rejectCollege,
  removeCollege,
  removeProgram,
  removeStream,
  resetCatalogToSeed,
  updateCollege,
} from '../data/catalogStore'
import type { BulkResult } from '../data/catalogStore'
import { approveContribution, rejectContribution, updateContribution } from '../data/contributionsStore'
import {
  deleteStudentForAdmin,
  listStudentsForAdmin,
  updateStudentForAdmin,
} from '../data/studentStore'
import { useApplications, useCatalog, useContributions, useSuperAdmin } from '../hooks/useCatalog'
import { isApiEnabled } from '../lib/api'
import { ADMISSION_STATUS_LABELS, COLLEGE_TYPE_LABELS, type College, type CollegeInput, type CollegeType, type Program } from '../types/catalog'
import type { CollegeContribution, CollegeEditFields } from '../types/contributions'
import type { Student } from '../types/student'
import { fileToImageDataUrl } from '../utils/fileData'
import { AdminPrintsSection } from '../components/prints/AdminPrintsSection'

type Panel = 'streams' | 'programs' | 'colleges' | 'bulk' | null

export function AdminDashboardPage() {
  const { isAdmin, logout } = useSuperAdmin()
  const catalog = useCatalog()
  const applications = useApplications()
  const contributions = useContributions()
  const [openPanel, setOpenPanel] = useState<Panel>(null)
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null)
  const [editingPendingCollegeId, setEditingPendingCollegeId] = useState<string | null>(null)

  async function reloadStudents() {
    const list = await listStudentsForAdmin()
    setStudents(list)
  }

  useEffect(() => {
    if (!isAdmin) return
    void reloadStudents()
  }, [isAdmin])

  async function runAction(id: string, label: string, fn: () => Promise<unknown>) {
    setBusyId(id)
    setNotice(null)
    try {
      await fn()
      setNotice({ type: 'ok', text: `${label} done.` })
    } catch (error) {
      setNotice({
        type: 'err',
        text: error instanceof Error ? error.message : `${label} failed. Try again.`,
      })
    } finally {
      setBusyId(null)
    }
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  const pending = catalog.colleges.filter((college) => college.approvalStatus === 'pending')
  const approved = catalog.colleges.filter((college) => college.approvalStatus === 'approved')
  const rejected = catalog.colleges.filter((college) => college.approvalStatus === 'rejected')
  const pendingContributions = contributions.filter((item) => item.status === 'pending')

  return (
    <AdminShell showLogout onLogout={logout}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 md:px-8 md:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-stone uppercase">Super Admin</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">Control panel</h1>
            <p className="mt-2 max-w-xl text-sm text-stone">
              Approve listings, manage catalog with +, and track admission applications. This panel
              is not shown in the public menu.
            </p>
          </div>
          {isApiEnabled() ? (
            <button
              type="button"
              onClick={() => void runAction('refresh', 'Refresh', () => refreshCatalogFromApi())}
              disabled={busyId === 'refresh'}
              className="w-full rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-mist disabled:opacity-60 sm:w-auto"
            >
              {busyId === 'refresh' ? 'Refreshing…' : 'Refresh from server'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset catalog to demo seed data?')) {
                  resetCatalogToSeed()
                }
              }}
              className="w-full rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-mist sm:w-auto"
            >
              Reset demo data
            </button>
          )}
        </div>

        {notice ? (
          <div
            className={`mt-6 rounded-md border px-4 py-3 text-sm ${
              notice.type === 'ok'
                ? 'border-sea/30 bg-sea/5 text-ink'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {notice.text}
          </div>
        ) : null}

        {isApiEnabled() ? <AdminPrintsSection onNotice={setNotice} /> : null}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Bulk add colleges</h2>
              <p className="text-xs text-stone">Paste many colleges at once (JSON format)</p>
            </div>
            <button
              type="button"
              onClick={() => setOpenPanel(openPanel === 'bulk' ? null : 'bulk')}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border text-2xl font-light leading-none transition-all duration-300 ${
                openPanel === 'bulk'
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-white text-ink hover:border-sea hover:text-sea'
              }`}
            >
              {openPanel === 'bulk' ? '×' : '+'}
            </button>
          </div>
          {openPanel === 'bulk' ? (
            <BulkImportForm
              onDone={() => setOpenPanel(null)}
              onNotice={(n) => setNotice(n)}
            />
          ) : null}
        </section>

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
              const submitter = college.submittedById
                ? students.find((s) => s.id === college.submittedById)
                : undefined

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
                      {submitter || college.submittedBy === 'student' ? (
                        <p className="mt-2 rounded-md bg-fog px-3 py-2 text-xs text-ink">
                          <span className="font-semibold">Requested by:</span>{' '}
                          {submitter?.name ?? 'Student'}
                          {submitter?.collegeName ? (
                            <>
                              {' '}
                              · College: <span className="font-semibold">{submitter.collegeName}</span>
                            </>
                          ) : null}
                          {submitter?.email ? (
                            <span className="mt-0.5 block text-stone">
                              {submitter.email} · {submitter.phone}
                            </span>
                          ) : null}
                        </p>
                      ) : null}
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
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                      <Link
                        to={`/colleges/${college.slug}`}
                        className="flex-1 rounded-md border border-line px-3 py-2 text-center text-sm font-medium text-ink hover:bg-mist sm:flex-none"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingContributionId(null)
                          setEditingPendingCollegeId(college.id)
                        }}
                        className="flex-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-mist sm:flex-none"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        disabled={busyId === college.id}
                        onClick={() => void runAction(college.id, 'Approve', () => approveCollege(college.id))}
                        className="flex-1 rounded-md bg-sea px-3 py-2 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60 sm:flex-none"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === college.id}
                        onClick={() => void runAction(college.id, 'Reject', () => rejectCollege(college.id))}
                        className="flex-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-stone hover:bg-mist hover:text-ink disabled:opacity-60 sm:flex-none"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busyId === college.id}
                        onClick={() => {
                          if (window.confirm(`Delete “${college.name}” permanently?`)) {
                            void runAction(college.id, 'Delete', () => removeCollege(college.id))
                          }
                        }}
                        className="flex-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 sm:flex-none"
                      >
                        Delete
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

          {editingPendingCollegeId ? (
            <div className="mt-4 rounded-lg border border-sea/30 bg-white p-4">
              <p className="mb-3 text-sm font-medium text-ink">
                Update pending college request before approve
              </p>
              <CollegeListingForm
                key={editingPendingCollegeId}
                programs={catalog.programs}
                streams={catalog.streams}
                submitLabel="Save request updates"
                defaultSubmittedBy="student"
                showAdmissionToggle
                initialCollege={
                  pending.find((college) => college.id === editingPendingCollegeId) ?? null
                }
                onCancel={() => setEditingPendingCollegeId(null)}
                onSubmit={async (input) => {
                  await updateCollege(editingPendingCollegeId, {
                    ...input,
                    approvalStatus: 'pending',
                    submittedBy: 'student',
                  })
                  setEditingPendingCollegeId(null)
                  setNotice({ type: 'ok', text: 'Pending college request updated.' })
                }}
              />
            </div>
          ) : null}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-ink">Student contributions</h2>
          <p className="mt-1 text-xs text-stone">
            Photos & edits sent by students. You can Update, then Approve. {pendingContributions.length}{' '}
            waiting.
          </p>

          {editingContributionId ? (
            <ContributionEditForm
              key={editingContributionId}
              contribution={
                pendingContributions.find((item) => item.id === editingContributionId) ?? null
              }
              onCancel={() => setEditingContributionId(null)}
              onSaved={async () => {
                setEditingContributionId(null)
                setNotice({ type: 'ok', text: 'Contribution request updated.' })
              }}
            />
          ) : null}

          <ul className="mt-4 space-y-3">
            {pendingContributions.map((item) => {
              const editEntries = Object.entries(item.edits ?? {})
              const contribStudent = item.studentId
                ? students.find((s) => s.id === item.studentId)
                : undefined
              const requesterCollege =
                contribStudent?.collegeName || item.collegeName || '—'

              return (
                <li
                  key={item.id}
                  className="rounded-lg border border-line bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/colleges/${item.collegeSlug}`}
                          className="font-semibold text-ink hover:text-sea-deep"
                        >
                          {item.collegeName}
                        </Link>
                        <span className="rounded-md bg-sea/10 px-2 py-0.5 text-[11px] font-semibold text-sea-deep uppercase">
                          {item.images.length} photo(s) · {editEntries.length} edit(s)
                        </span>
                      </div>
                      <p className="mt-2 rounded-md bg-fog px-3 py-2 text-xs text-ink">
                        <span className="font-semibold">Requested by:</span>{' '}
                        {item.studentName || contribStudent?.name || 'Unknown'}
                        {' · '}
                        College: <span className="font-semibold">{requesterCollege}</span>
                        {(item.studentEmail || contribStudent?.email) && (
                          <span className="mt-0.5 block text-stone">
                            {item.studentEmail || contribStudent?.email} ·{' '}
                            {item.studentPhone || contribStudent?.phone}
                          </span>
                        )}
                      </p>
                      {item.note ? (
                        <p className="mt-1 text-xs text-ink">
                          <span className="font-semibold">Note:</span> {item.note}
                        </p>
                      ) : null}
                      {editEntries.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-ink">
                          {editEntries.map(([key, value]) => (
                            <li key={key}>
                              <span className="font-semibold">{key}:</span>{' '}
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {item.images.length > 0 ? (
                        <div className="mt-3 flex gap-2 overflow-x-auto">
                          {item.images.slice(0, 8).map((src, index) => (
                            <img
                              key={`${item.id}-img-${index}`}
                              src={src}
                              alt=""
                              className="h-14 w-20 shrink-0 rounded object-cover ring-1 ring-line"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPendingCollegeId(null)
                          setEditingContributionId(item.id)
                        }}
                        className="flex-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-mist sm:flex-none"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() =>
                          void runAction(item.id, 'Approve', () => approveContribution(item.id))
                        }
                        className="flex-1 rounded-md bg-sea px-3 py-2 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60 sm:flex-none"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() =>
                          void runAction(item.id, 'Reject', () => rejectContribution(item.id))
                        }
                        className="flex-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-stone hover:bg-mist hover:text-ink disabled:opacity-60 sm:flex-none"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
            {pendingContributions.length === 0 ? (
              <li className="rounded-lg border border-line bg-white px-4 py-6 text-sm text-stone">
                No pending student contributions right now.
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
                  disabled={busyId === stream.id}
                  onClick={() => {
                    if (window.confirm(`Remove stream “${stream.name}” and its programs?`)) {
                      void runAction(stream.id, 'Remove stream', () => removeStream(stream.id))
                    }
                  }}
                  className="shrink-0 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
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
                    disabled={busyId === program.id}
                    onClick={() => {
                      if (window.confirm(`Remove program “${program.name}”?`)) {
                        void runAction(program.id, 'Remove program', () => removeProgram(program.id))
                      }
                    }}
                    className="shrink-0 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
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
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPanel(null)
                      setEditingCollegeId(college.id)
                    }}
                    className="flex-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-mist sm:flex-none"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busyId === college.id}
                    onClick={() => {
                      if (window.confirm(`Remove college “${college.name}”?`)) {
                        void runAction(college.id, 'Remove college', () => removeCollege(college.id))
                      }
                    }}
                    className="flex-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 sm:flex-none"
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
        </section>

        {rejected.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold text-ink">Rejected colleges</h2>
            <p className="mt-1 text-xs text-stone">
              {rejected.length} rejected. Restore to approve, or delete permanently.
            </p>
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
              {rejected.map((college) => (
                <li
                  key={college.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{college.name}</p>
                      <CollegeTypeBadge type={college.type} />
                    </div>
                    <p className="mt-0.5 text-xs text-stone">
                      {college.city} · Request · {college.submittedBy}
                    </p>
                  </div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <button
                      type="button"
                      disabled={busyId === college.id}
                      onClick={() => void runAction(college.id, 'Restore', () => approveCollege(college.id))}
                      className="flex-1 rounded-md bg-sea px-3 py-2 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60 sm:flex-none"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      disabled={busyId === college.id}
                      onClick={() => {
                        if (window.confirm(`Delete “${college.name}” permanently?`)) {
                          void runAction(college.id, 'Delete', () => removeCollege(college.id))
                        }
                      }}
                      className="flex-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 sm:flex-none"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-ink">Student profiles</h2>
          <p className="mt-1 text-xs text-stone">
            {students.length} registered. Open a profile to view, edit, or delete.
          </p>

          {editingStudentId ? (
            <StudentEditForm
              key={editingStudentId}
              student={students.find((s) => s.id === editingStudentId) ?? null}
              colleges={approved}
              onCancel={() => setEditingStudentId(null)}
              onSaved={async () => {
                await reloadStudents()
                setEditingStudentId(null)
                setNotice({ type: 'ok', text: 'Student profile updated.' })
              }}
            />
          ) : null}

          {viewingStudentId && !editingStudentId ? (
            <StudentProfileCard
              student={students.find((s) => s.id === viewingStudentId) ?? null}
              colleges={catalog.colleges}
              onClose={() => setViewingStudentId(null)}
              onEdit={() => {
                setEditingStudentId(viewingStudentId)
                setViewingStudentId(null)
              }}
              onDelete={() => {
                const s = students.find((item) => item.id === viewingStudentId)
                if (!s) return
                if (!window.confirm(`Delete student “${s.name}” permanently?`)) return
                void runAction(s.id, 'Delete student', async () => {
                  await deleteStudentForAdmin(s.id)
                  await reloadStudents()
                  setViewingStudentId(null)
                })
              }}
              busy={busyId === viewingStudentId}
            />
          ) : null}

          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {students.map((student) => (
              <li
                key={student.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sea/15 text-sm font-bold text-sea-deep uppercase">
                    {student.name.trim().charAt(0) || 'S'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {student.name}{' '}
                      <span className="font-normal text-stone">· {student.branch}</span>
                    </p>
                    <p className="text-xs text-stone">
                      {student.collegeName}
                      {student.collegeId ? ' · linked' : ' · Other'} · {student.email} ·{' '}
                      {student.phone}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudentId(null)
                      setViewingStudentId(student.id)
                    }}
                    className="flex-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-mist sm:flex-none"
                  >
                    View profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewingStudentId(null)
                      setEditingStudentId(student.id)
                    }}
                    className="flex-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-mist sm:flex-none"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busyId === student.id}
                    onClick={() => {
                      if (!window.confirm(`Delete student “${student.name}” permanently?`)) return
                      void runAction(student.id, 'Delete student', async () => {
                        await deleteStudentForAdmin(student.id)
                        await reloadStudents()
                        if (viewingStudentId === student.id) setViewingStudentId(null)
                        if (editingStudentId === student.id) setEditingStudentId(null)
                      })
                    }}
                    className="flex-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 sm:flex-none"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {students.length === 0 ? (
              <li className="px-4 py-6 text-sm text-stone">No students registered yet.</li>
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

function StudentProfileCard({
  student,
  colleges,
  onClose,
  onEdit,
  onDelete,
  busy,
}: {
  student: Student | null
  colleges: College[]
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  busy: boolean
}) {
  if (!student) return null
  const linked = student.collegeId
    ? colleges.find((c) => c.id === student.collegeId)
    : undefined

  return (
    <div className="mt-4 rounded-lg border border-sea/30 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sea/15 text-xl font-bold text-sea-deep uppercase">
            {student.name.trim().charAt(0) || 'S'}
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-stone uppercase">
              Student profile
            </p>
            <h3 className="font-display text-2xl font-bold text-ink">{student.name}</h3>
            <p className="mt-1 text-sm text-stone">{student.branch}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-mist"
        >
          Close
        </button>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-fog px-3 py-2">
          <dt className="text-[11px] font-semibold tracking-wide text-stone uppercase">Email</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">{student.email}</dd>
        </div>
        <div className="rounded-md bg-fog px-3 py-2">
          <dt className="text-[11px] font-semibold tracking-wide text-stone uppercase">Phone</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">{student.phone}</dd>
        </div>
        <div className="rounded-md bg-fog px-3 py-2">
          <dt className="text-[11px] font-semibold tracking-wide text-stone uppercase">College</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">
            {student.collegeName}
            {student.collegeId ? (
              <span className="ml-2 rounded bg-sea/10 px-1.5 py-0.5 text-[10px] font-semibold text-sea-deep uppercase">
                Linked
              </span>
            ) : (
              <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 uppercase">
                Other
              </span>
            )}
          </dd>
        </div>
        <div className="rounded-md bg-fog px-3 py-2">
          <dt className="text-[11px] font-semibold tracking-wide text-stone uppercase">Joined</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">
            {student.createdAt
              ? new Date(student.createdAt).toLocaleString()
              : '—'}
          </dd>
        </div>
      </dl>

      {linked ? (
        <p className="mt-3 text-xs text-stone">
          Campus page:{' '}
          <Link to={`/colleges/${linked.slug}`} className="font-semibold text-sea hover:text-sea-deep">
            {linked.name}
          </Link>
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md bg-sea px-4 py-2 text-sm font-semibold text-white hover:bg-sea-deep"
        >
          Edit profile
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          Delete student
        </button>
      </div>
    </div>
  )
}

const studentInputClass =
  'w-full rounded-md border border-line bg-white px-3 py-2.5 text-ink outline-none transition-colors focus:border-sea'

function StudentEditForm({
  student,
  colleges,
  onCancel,
  onSaved,
}: {
  student: Student | null
  colleges: College[]
  onCancel: () => void
  onSaved: () => void | Promise<void>
}) {
  const OTHER = '__other__'
  const [name, setName] = useState(student?.name ?? '')
  const [branch, setBranch] = useState(student?.branch ?? '')
  const [phone, setPhone] = useState(student?.phone ?? '')
  const [email, setEmail] = useState(student?.email ?? '')
  const [collegeSelect, setCollegeSelect] = useState(
    student?.collegeId ? student.collegeId : OTHER,
  )
  const [otherCollegeName, setOtherCollegeName] = useState(
    student?.collegeId ? '' : (student?.collegeName ?? ''),
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!student) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!student) return
    setError('')
    setBusy(true)
    try {
      const isOther = collegeSelect === OTHER
      let collegeId: string | null = null
      let collegeName = ''
      if (isOther) {
        collegeName = otherCollegeName.trim()
        if (collegeName.length < 2) {
          setError('Type the college name for Other.')
          return
        }
      } else {
        const selected = colleges.find((c) => c.id === collegeSelect)
        if (!selected) {
          setError('Select a valid college.')
          return
        }
        collegeId = selected.id
        collegeName = selected.name
      }

      await updateStudentForAdmin(student.id, {
        name,
        phone,
        email,
        collegeId,
        collegeName,
        branch,
      })
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save student.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 rounded-lg border border-sea/30 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-ink">Edit student profile</h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-mist"
        >
          Cancel
        </button>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Full name</span>
        <input
          className={studentInputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Branch</span>
          <input
            className={studentInputClass}
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Phone</span>
          <input
            className={studentInputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
        <input
          className={studentInputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">College</span>
        <select
          className={studentInputClass}
          value={collegeSelect}
          onChange={(e) => setCollegeSelect(e.target.value)}
        >
          {colleges.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name} ({college.city})
            </option>
          ))}
          <option value={OTHER}>Other — not in list</option>
        </select>
      </label>

      {collegeSelect === OTHER ? (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">College name</span>
          <input
            className={studentInputClass}
            value={otherCollegeName}
            onChange={(e) => setOtherCollegeName(e.target.value)}
            required
          />
        </label>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy} className="rounded-md bg-sea px-4 py-2.5 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60">
        {busy ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}

function ContributionEditForm({
  contribution,
  onCancel,
  onSaved,
}: {
  contribution: CollegeContribution | null
  onCancel: () => void
  onSaved: () => void | Promise<void>
}) {
  const [about, setAbout] = useState(contribution?.edits.about ?? '')
  const [location, setLocation] = useState(contribution?.edits.location ?? '')
  const [principalName, setPrincipalName] = useState(contribution?.edits.principalName ?? '')
  const [feesStructure, setFeesStructure] = useState(contribution?.edits.feesStructure ?? '')
  const [branchesText, setBranchesText] = useState(
    (contribution?.edits.branches ?? []).join(', '),
  )
  const [type, setType] = useState<CollegeType | ''>(contribution?.edits.type ?? '')
  const [admissionStatus, setAdmissionStatus] = useState(
    contribution?.edits.admissionStatus ?? '',
  )
  const [note, setNote] = useState(contribution?.note ?? '')
  const [images, setImages] = useState<string[]>(contribution?.images ?? [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!contribution) return null

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return
    setError('')
    setBusy(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        uploaded.push(await fileToImageDataUrl(file))
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!contribution) return
    setError('')
    setBusy(true)
    try {
      const edits: CollegeEditFields = {}
      if (about.trim()) edits.about = about.trim()
      if (location.trim()) edits.location = location.trim()
      if (principalName.trim()) edits.principalName = principalName.trim()
      if (feesStructure.trim()) edits.feesStructure = feesStructure.trim()
      if (type) edits.type = type
      if (admissionStatus === 'open' || admissionStatus === 'closed') {
        edits.admissionStatus = admissionStatus
      }
      const branches = branchesText
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean)
      if (branches.length) edits.branches = branches

      await updateContribution(contribution.id, {
        images,
        edits,
        note: note.trim(),
      })
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update request.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 rounded-lg border border-sea/30 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-ink">Update contribution request</h3>
          <p className="text-xs text-stone">
            {contribution.collegeName} · {contribution.studentName || 'Student'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-mist"
        >
          Cancel
        </button>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Photos</legend>
        <input
          type="file"
          accept="image/*"
          multiple
          className="block w-full text-sm text-stone file:mr-3 file:rounded-md file:border-0 file:bg-sea file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          onChange={(e) => {
            void handleImageUpload(e.target.files)
            e.target.value = ''
          }}
        />
        {images.length > 0 ? (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {images.map((src, index) => (
              <li key={`${index}-${src.slice(0, 20)}`} className="group relative">
                <img src={src} alt="" className="aspect-[4/3] w-full rounded object-cover ring-1 ring-line" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 rounded bg-ink/80 px-1.5 text-xs text-white opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-stone">No photos in this request.</p>
        )}
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">About</span>
        <textarea
          className={`${studentInputClass} min-h-20 resize-y`}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Location</span>
          <input
            className={studentInputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Principal</span>
          <input
            className={studentInputClass}
            value={principalName}
            onChange={(e) => setPrincipalName(e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Type</span>
          <select
            className={studentInputClass}
            value={type}
            onChange={(e) => setType(e.target.value as CollegeType | '')}
          >
            <option value="">(no change)</option>
            {(Object.keys(COLLEGE_TYPE_LABELS) as CollegeType[]).map((key) => (
              <option key={key} value={key}>
                {COLLEGE_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Admission</span>
          <select
            className={studentInputClass}
            value={admissionStatus}
            onChange={(e) => setAdmissionStatus(e.target.value)}
          >
            <option value="">(no change)</option>
            <option value="open">{ADMISSION_STATUS_LABELS.open}</option>
            <option value="closed">{ADMISSION_STATUS_LABELS.closed}</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Fees</span>
        <textarea
          className={`${studentInputClass} min-h-16 resize-y`}
          value={feesStructure}
          onChange={(e) => setFeesStructure(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Branches (comma separated)</span>
        <input
          className={studentInputClass}
          value={branchesText}
          onChange={(e) => setBranchesText(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Note</span>
        <input className={studentInputClass} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-sea px-4 py-2.5 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save updates'}
      </button>
    </form>
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

const BULK_TEMPLATE = `[
  {
    "name": "ABC Polytechnic",
    "city": "Ranchi",
    "type": "private",
    "location": "Near Bus Stand, Ranchi",
    "principalName": "Dr. A. Sharma",
    "about": "AICTE approved diploma & degree campus.",
    "branches": ["CSE", "Mechanical", "Civil"],
    "customPrograms": ["Diploma", "B.Tech"],
    "fees": [["Diploma", "45,000 / year"], ["B.Tech", "65,000 / year"]],
    "images": ["https://images.unsplash.com/photo-1562774053-701939374585"],
    "admissionStatus": "open"
  },
  {
    "name": "XYZ College of Engineering",
    "city": "Jamshedpur",
    "type": "government",
    "branches": ["Electrical", "Electronics"],
    "customPrograms": ["B.Tech"]
  }
]`

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return []
}

function parseFeeRows(value: unknown): { programLabel: string; amount: string }[] {
  if (!Array.isArray(value)) return []
  const rows: { programLabel: string; amount: string }[] = []
  for (const item of value) {
    if (Array.isArray(item) && item.length >= 2) {
      rows.push({ programLabel: String(item[0]).trim(), amount: String(item[1]).trim() })
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>
      const label = String(obj.programLabel ?? obj.label ?? '').trim()
      const amount = String(obj.amount ?? '').trim()
      if (label) rows.push({ programLabel: label, amount })
    } else if (typeof item === 'string' && item.includes(':')) {
      const idx = item.indexOf(':')
      rows.push({
        programLabel: item.slice(0, idx).trim(),
        amount: item.slice(idx + 1).trim(),
      })
    }
  }
  return rows.filter((r) => r.programLabel)
}

function mapBulkEntry(
  raw: Record<string, unknown>,
  programs: Program[],
): { input?: CollegeInput; error?: string } {
  const name = String(raw.name ?? '').trim()
  const city = String(raw.city ?? '').trim()
  if (name.length < 2) return { error: 'Missing "name".' }

  const branches = toStringArray(raw.branches)

  // Match program NAMES (e.g. "B.Tech", "Diploma") to catalog program IDs so the
  // college shows up under the right stream/program. Unmatched names stay custom.
  const byName = new Map(programs.map((p) => [p.name.trim().toLowerCase(), p.id]))
  const validIds = new Set(programs.map((p) => p.id))

  const programIdSet = new Set<string>()
  const customPrograms: string[] = []

  for (const id of toStringArray(raw.programIds)) {
    if (validIds.has(id)) programIdSet.add(id)
  }
  for (const nm of toStringArray(raw.customPrograms ?? raw.programs)) {
    const matchedId = byName.get(nm.trim().toLowerCase())
    if (matchedId) programIdSet.add(matchedId)
    else customPrograms.push(nm)
  }
  const programIds = [...programIdSet]

  const rawType = String(raw.type ?? 'private').trim()
  const type =
    rawType === 'government' || rawType === 'semi-government' || rawType === 'private'
      ? rawType
      : 'private'
  const admissionStatus = String(raw.admissionStatus ?? 'open').trim() === 'closed' ? 'closed' : 'open'
  const feeRows = parseFeeRows(raw.fees ?? raw.feeRows)

  return {
    input: {
      name,
      type,
      city,
      location: String(raw.location ?? city).trim(),
      principalName: String(raw.principalName ?? '').trim(),
      feesStructure: '',
      feeRows,
      courses: customPrograms,
      branches,
      images: toStringArray(raw.images),
      programIds,
      customPrograms,
      about: String(raw.about ?? '').trim(),
      admissionStatus,
      approvalStatus: 'approved',
      submittedBy: 'admin',
    },
  }
}

function BulkImportForm({
  onDone,
  onNotice,
}: {
  onDone: () => void
  onNotice: (n: { type: 'ok' | 'err'; text: string }) => void
}) {
  const catalog = useCatalog()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<BulkResult[] | null>(null)
  const [parseError, setParseError] = useState('')

  async function handleImport() {
    setParseError('')
    setResults(null)

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setParseError('Invalid JSON. Check commas, quotes and brackets.')
      return
    }
    if (!Array.isArray(parsed)) {
      setParseError('Top level must be an array: [ { ... }, { ... } ]')
      return
    }

    const inputs: CollegeInput[] = []
    const errors: string[] = []
    parsed.forEach((row, index) => {
      if (!row || typeof row !== 'object') {
        errors.push(`Row ${index + 1}: not an object.`)
        return
      }
      const { input, error } = mapBulkEntry(row as Record<string, unknown>, catalog.programs)
      if (error) errors.push(error)
      else if (input) inputs.push(input)
    })

    if (inputs.length === 0) {
      setParseError(errors[0] ?? 'No valid colleges found.')
      return
    }

    setBusy(true)
    try {
      const res = await bulkAddColleges(inputs)
      const withValidation: BulkResult[] = [
        ...res,
        ...errors.map((e) => ({ name: e, ok: false, error: 'Skipped' })),
      ]
      setResults(withValidation)
      const okCount = res.filter((r) => r.ok).length
      onNotice({
        type: okCount > 0 ? 'ok' : 'err',
        text: `${okCount} college(s) added${errors.length ? `, ${errors.length} skipped` : ''}.`,
      })
      if (okCount > 0 && errors.length === 0) {
        setText('')
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-line bg-white p-4">
      <div className="rounded-md bg-fog px-3 py-2 text-xs text-stone">
        <p className="font-semibold text-ink">Format: JSON array of colleges.</p>
        <p className="mt-1">
          Sirf <b>name</b> required hai. Baaki sab fields optional — jo doge wahi bharega, jo nahi
          doge wo khali rahega.
        </p>
        <p className="mt-1">
          <b>customPrograms</b> me program ka naam (jaise "B.Tech", "Diploma") catalog ke program se
          match hote hi college us stream/program ke andar dikhega. Naam catalog se milna chahiye.
        </p>
      </div>

      <textarea
        className={`${inputClass} min-h-64 font-mono text-xs leading-relaxed`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={BULK_TEMPLATE}
        spellCheck={false}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setText(BULK_TEMPLATE)}
          className="rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-mist"
        >
          Insert example
        </button>
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={() => void handleImport()}
          className="rounded-md bg-sea px-4 py-2.5 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60"
        >
          {busy ? 'Importing…' : 'Import colleges'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-line px-4 py-2.5 text-sm font-medium"
        >
          Close
        </button>
      </div>

      {parseError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {parseError}
        </p>
      ) : null}

      {results ? (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-line p-2 text-sm">
          {results.map((r, i) => (
            <li
              key={`${r.name}-${i}`}
              className={r.ok ? 'text-ink' : 'text-red-600'}
            >
              {r.ok ? '✓' : '✕'} {r.name}
              {r.error && !r.ok ? ` — ${r.error}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
