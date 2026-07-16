import { Link, Navigate, useParams } from 'react-router-dom'
import { type ReactNode } from 'react'
import { CollegeImageSlider } from '../components/colleges/CollegeImageSlider'
import { CollegeTypeBadge } from '../components/colleges/CollegeTypeBadge'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Reveal } from '../components/motion/Reveal'
import { useCatalog, useSuperAdmin } from '../hooks/useCatalog'
import { ADMISSION_STATUS_LABELS } from '../types/catalog'

export function CollegeDetailPage() {
  const { collegeSlug = '' } = useParams()
  const catalog = useCatalog()
  const { isAdmin } = useSuperAdmin()

  const college = catalog.colleges.find((item) => item.slug === collegeSlug)

  if (!college) {
    return <Navigate to="/colleges" replace />
  }

  if (college.approvalStatus !== 'approved' && !isAdmin) {
    return (
      <div className="min-h-screen bg-fog">
        <SiteHeader variant="solid" />
        <main className="mx-auto max-w-lg px-5 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">College under review</h1>
          <p className="mt-3 text-stone">
            This listing is waiting for Super Admin approval and is not public yet.
          </p>
          <Link
            to="/colleges"
            className="mt-8 inline-flex rounded-md bg-sea px-5 py-2.5 text-sm font-semibold text-white hover:bg-sea-deep"
          >
            Browse colleges
          </Link>
        </main>
      </div>
    )
  }

  const linkedLevels = catalog.programs.filter((program) => college.programIds.includes(program.id))
  const allPrograms = [
    ...linkedLevels.map((level) => level.name),
    ...(college.customPrograms ?? []),
  ]
  const feeRows =
    college.feeRows?.length > 0
      ? college.feeRows
      : college.feesStructure
        ? [{ programLabel: 'Fees', amount: college.feesStructure }]
        : []
  const admissionOpen = college.admissionStatus === 'open'
  const isPendingPreview = college.approvalStatus !== 'approved' && isAdmin

  return (
    <div className="page-enter min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        {isPendingPreview ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Admin preview — this college is still <strong>pending</strong>. Approve it from the
            control panel to make it public.
          </div>
        ) : null}

        <Reveal>
          <Link to="/colleges" className="text-sm font-medium text-sea hover:text-sea-deep">
            ← All colleges
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              {college.name}
            </h1>
            <CollegeTypeBadge type={college.type} />
          </div>
          <p className="mt-2 text-stone">{college.city}</p>
        </Reveal>

        <Reveal>
          <div className="mt-8">
            <CollegeImageSlider images={college.images} collegeName={college.name} />
          </div>
        </Reveal>

        {college.about ? (
          <Reveal>
            <p className="mt-8 max-w-3xl leading-relaxed text-ink-soft">{college.about}</p>
          </Reveal>
        ) : null}

        <Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard title="Admission status">
              <p
                className={`font-display text-xl font-bold ${
                  admissionOpen ? 'text-sea-deep' : 'text-stone'
                }`}
              >
                {ADMISSION_STATUS_LABELS[college.admissionStatus]}
              </p>
            </InfoCard>

            <InfoCard title="Location">
              <p className="text-sm leading-relaxed text-ink-soft">{college.location}</p>
            </InfoCard>

            <InfoCard title="Principal">
              <p className="font-display text-lg font-bold text-ink">{college.principalName}</p>
            </InfoCard>

            <InfoCard title="Fees structure">
              {feeRows.length > 0 ? (
                <ul className="space-y-2">
                  {feeRows.map((row) => (
                    <li
                      key={`${row.programLabel}-${row.amount}`}
                      className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-sm font-semibold text-ink">{row.programLabel}</span>
                      <span className="text-right text-sm text-ink-soft">{row.amount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-stone">Fees details coming soon.</p>
              )}
            </InfoCard>

            <InfoCard title="Programs">
              <div className="flex flex-col gap-2">
                {allPrograms.length > 0 ? (
                  allPrograms.map((label) => (
                    <span
                      key={label}
                      className="rounded-md border border-line bg-fog px-3 py-1.5 text-sm font-semibold text-ink"
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-stone">No programs linked yet (e.g. Diploma, B.Tech).</p>
                )}
              </div>
            </InfoCard>

            <InfoCard title="Branches">
              <div className="flex flex-wrap gap-2">
                {college.branches.length > 0 ? (
                  college.branches.map((branch) => (
                    <span
                      key={branch}
                      className="rounded-md border border-line bg-fog px-2.5 py-1 text-xs font-medium text-ink"
                    >
                      {branch}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-stone">Branches will be listed soon.</p>
                )}
              </div>
            </InfoCard>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-12 flex flex-col gap-4 border-t border-line pt-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                {admissionOpen ? 'Ready to join?' : 'Admissions closed'}
              </h2>
              <p className="mt-1.5 max-w-md text-sm text-stone">
                {admissionOpen
                  ? 'Submit once — the campus team follows up.'
                  : 'Browse details now and check back when seats open.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {admissionOpen ? (
                <Link to={`/colleges/${college.slug}/apply`} className="btn btn-primary">
                  Take Admission
                </Link>
              ) : (
                <span className="text-sm font-semibold text-stone">Closed for now</span>
              )}
              <Link
                to="/#how-it-works"
                className="text-sm font-semibold text-sea underline-offset-4 transition-colors hover:text-sea-deep hover:underline"
              >
                Need help?
              </Link>
            </div>
          </div>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-stone uppercase">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}
