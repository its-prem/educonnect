import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CollegeListingForm } from '../components/colleges/CollegeListingForm'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { submitCollegeListing } from '../data/catalogStore'
import { useCatalog } from '../hooks/useCatalog'
import { useStudentAuth } from '../hooks/useStudentAuth'
import { studentCanListNewCollege } from '../types/student'

export function ListCollegePage() {
  const catalog = useCatalog()
  const { student, isLoggedIn } = useStudentAuth()
  const [submittedName, setSubmittedName] = useState<string | null>(null)

  if (!isLoggedIn || !student) {
    return <Navigate to="/login?next=/college/register" replace />
  }

  // Students linked to an existing college cannot list a new one
  if (!studentCanListNewCollege(student)) {
    const linked = catalog.colleges.find((college) => college.id === student.collegeId)
    return (
      <div className="min-h-screen bg-fog">
        <SiteHeader variant="solid" />
        <main className="mx-auto max-w-lg px-5 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Your college is already listed</h1>
          <p className="mt-3 text-stone">
            You registered under{' '}
            <span className="font-semibold text-ink">{student.collegeName}</span>. You can upload
            photos and suggest edits on that campus page only — not list a new college.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {linked ? (
              <Link
                to={`/colleges/${linked.slug}`}
                className="inline-flex rounded-md bg-sea px-5 py-2.5 text-sm font-semibold text-white hover:bg-sea-deep"
              >
                Go to my college
              </Link>
            ) : null}
            <Link
              to="/colleges"
              className="inline-flex rounded-md border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-mist"
            >
              Browse colleges
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-2xl px-5 py-12 md:px-8 md:py-16">
        <h1 className="font-display text-3xl font-bold text-ink">List your college</h1>
        <p className="mt-3 text-stone">
          Signed in as <span className="font-semibold text-ink">{student.name}</span>
          {student.collegeName ? (
            <>
              {' '}
              · listing <span className="font-semibold text-ink">{student.collegeName}</span>
            </>
          ) : null}
          . Your listing goes to Super Admin as a request — after review &amp; approval it becomes
          visible to everyone.
        </p>

        {submittedName ? (
          <div className="mt-8 rounded-lg border border-sea/30 bg-sea/5 p-6">
            <p className="font-display text-xl font-bold text-ink">Request sent to Super Admin</p>
            <p className="mt-2 text-sm text-stone">
              <span className="font-semibold text-ink">{submittedName}</span> is pending review. It
              will not appear in public college lists until Super Admin approves it.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/colleges"
                className="rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
              >
                Browse approved colleges
              </Link>
              <button
                type="button"
                onClick={() => setSubmittedName(null)}
                className="rounded-md border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-mist"
              >
                Submit another
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-line bg-white p-5 md:p-6">
            <CollegeListingForm
              programs={catalog.programs}
              streams={catalog.streams}
              submitLabel="Send request to Super Admin"
              defaultSubmittedBy="student"
              onSubmit={async (input) => {
                const college = await submitCollegeListing({
                  ...input,
                  name: input.name.trim() || student.collegeName,
                  submittedBy: 'student',
                  submittedById: student.id,
                  approvalStatus: 'pending',
                })
                setSubmittedName(college.name)
              }}
            />
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
