import { Link, Navigate, useParams } from 'react-router-dom'
import { type ReactNode } from 'react'
import { CollegeContributeForm } from '../components/colleges/CollegeContributeForm'
import { CollegeImageSlider } from '../components/colleges/CollegeImageSlider'
import { CollegeTypeBadge } from '../components/colleges/CollegeTypeBadge'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Reveal } from '../components/motion/Reveal'
import { useStudentAuth } from '../hooks/useStudentAuth'
import { useCatalog, useSuperAdmin } from '../hooks/useCatalog'
import { ADMISSION_STATUS_LABELS } from '../types/catalog'
import { studentCanContributeTo, studentCanListNewCollege } from '../types/student'

export function CollegeDetailPage() {
  const { collegeSlug = '' } = useParams()
  const catalog = useCatalog()
  const { isAdmin } = useSuperAdmin()
  const { student, isLoggedIn } = useStudentAuth()

  const college = catalog.colleges.find((item) => item.slug === collegeSlug)

  if (!college) {
    return <Navigate to="/colleges" replace />
  }

  const pageCollege = college

  if (pageCollege.approvalStatus !== 'approved' && !isAdmin) {
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

  const linkedLevels = catalog.programs.filter((program) =>
    pageCollege.programIds.includes(program.id),
  )
  const allPrograms = [
    ...linkedLevels.map((level) => level.name),
    ...(pageCollege.customPrograms ?? []),
  ]
  const feeRows =
    pageCollege.feeRows?.length > 0
      ? pageCollege.feeRows
      : pageCollege.feesStructure
        ? [{ programLabel: 'Fees', amount: pageCollege.feesStructure }]
        : []
  const admissionOpen = pageCollege.admissionStatus === 'open'
  const isPendingPreview = pageCollege.approvalStatus !== 'approved' && isAdmin
  const canEditHere = Boolean(
    isLoggedIn && student && studentCanContributeTo(student, pageCollege),
  )
  const myCollege = student?.collegeId
    ? catalog.colleges.find((item) => item.id === student.collegeId)
    : undefined

  function renderEditBlock() {
    if (isPendingPreview) return null

    // Same white card — Edit button opens the form inside this card
    if (canEditHere && student) {
      return <CollegeContributeForm college={pageCollege} student={student} defaultOpen />
    }

    if (isLoggedIn && student && student.collegeId) {
      return (
        <div className="rounded-lg border border-line bg-white p-5">
          <h3 className="font-display text-lg font-bold text-ink">Edit yahan nahi milega</h3>
          <p className="mt-1 max-w-xl text-sm text-stone">
            Aap <span className="font-semibold text-ink">{student.collegeName}</span> se linked ho.
            Edit sirf apne college page pe milta hai.
          </p>
          {myCollege ? (
            <Link
              to={`/colleges/${myCollege.slug}#edit-college`}
              className="mt-4 inline-flex rounded-md bg-sea px-5 py-2.5 text-sm font-semibold text-white hover:bg-sea-deep"
            >
              Edit my college
            </Link>
          ) : null}
        </div>
      )
    }

    if (isLoggedIn && student && studentCanListNewCollege(student)) {
      return (
        <div className="rounded-lg border border-line bg-white p-5">
          <h3 className="font-display text-lg font-bold text-ink">List your college instead</h3>
          <p className="mt-1 max-w-xl text-sm text-stone">
            Aapne <span className="font-semibold text-ink">{student.collegeName}</span> (Other) se
            register kiya — ye campus list mein match nahi karta. Naya listing bhejo.
          </p>
          <Link
            to="/college/register"
            className="mt-4 inline-flex rounded-md bg-sea px-5 py-2.5 text-sm font-semibold text-white hover:bg-sea-deep"
          >
            List my college
          </Link>
        </div>
      )
    }

    return (
      <div className="rounded-lg border border-dashed border-sea/40 bg-sea/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Photo / details edit?</h3>
            <p className="mt-1 max-w-xl text-sm text-stone">
              Is college se register + login karo — phir isi card mein Edit button dikhega.
            </p>
          </div>
          <Link
            to={`/register?next=/colleges/${pageCollege.slug}#edit-college`}
            className="shrink-0 rounded-md bg-sea px-5 py-2.5 text-sm font-semibold text-white hover:bg-sea-deep"
          >
            Login to Edit
          </Link>
        </div>
      </div>
    )
  }

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
              {pageCollege.name}
            </h1>
            <CollegeTypeBadge type={pageCollege.type} />
          </div>
          <p className="mt-2 text-stone">{pageCollege.city}</p>
        </Reveal>

        {/* Edit card — button lives inside this card */}
        <Reveal>
          <div className="mt-6">{renderEditBlock()}</div>
        </Reveal>

        <Reveal>
          <div className="mt-8">
            <CollegeImageSlider images={pageCollege.images} collegeName={pageCollege.name} />
          </div>
        </Reveal>

        {pageCollege.about ? (
          <Reveal>
            <p className="mt-8 max-w-3xl leading-relaxed text-ink-soft">{pageCollege.about}</p>
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
                {ADMISSION_STATUS_LABELS[pageCollege.admissionStatus]}
              </p>
            </InfoCard>

            <InfoCard title="Location">
              <p className="text-sm leading-relaxed text-ink-soft">{pageCollege.location}</p>
            </InfoCard>

            <InfoCard title="Principal">
              <p className="font-display text-lg font-bold text-ink">{pageCollege.principalName}</p>
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
                {pageCollege.branches.length > 0 ? (
                  pageCollege.branches.map((branch) => (
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
                <Link to={`/colleges/${pageCollege.slug}/apply`} className="btn btn-primary">
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
