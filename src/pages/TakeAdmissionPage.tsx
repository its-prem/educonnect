import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { submitAdmissionApplication } from '../data/applicationsStore'
import { useApprovedColleges } from '../hooks/useCatalog'
import { useStudentAuth } from '../hooks/useStudentAuth'

const inputClass =
  'w-full rounded-md border border-line bg-white px-3 py-2.5 text-ink outline-none transition-colors focus:border-sea'

export function TakeAdmissionPage() {
  const { collegeSlug = '' } = useParams()
  const navigate = useNavigate()
  const colleges = useApprovedColleges()
  const { student, isLoggedIn } = useStudentAuth()
  const college = colleges.find((item) => item.slug === collegeSlug)

  const [studentName, setStudentName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [branch, setBranch] = useState('')
  const [message, setMessage] = useState('')
  const [doneId, setDoneId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!student) return
    setStudentName(student.name)
    setEmail(student.email)
    setPhone(student.phone)
  }, [student])

  if (!college) {
    return <Navigate to="/colleges" replace />
  }

  if (college.admissionStatus !== 'open') {
    return <Navigate to={`/colleges/${college.slug}`} replace />
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `/colleges/${college.slug}/apply` }}
      />
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!college) return
    setBusy(true)
    setError('')
    try {
      const application = await submitAdmissionApplication({
        collegeId: college.id,
        collegeSlug: college.slug,
        collegeName: college.name,
        studentName,
        email,
        phone,
        branch: branch || college.branches[0] || 'General',
        message,
      })
      setDoneId(application.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-xl px-5 py-12 md:px-8 md:py-16">
        <Link
          to={`/colleges/${college.slug}`}
          className="text-sm font-medium text-sea hover:text-sea-deep"
        >
          ← Back to {college.name}
        </Link>

        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Take Admission</h1>
        <p className="mt-2 text-stone">
          Apply to <span className="font-semibold text-ink">{college.name}</span>. Your student
          profile details are filled in.
        </p>

        {doneId ? (
          <div className="mt-8 rounded-lg border border-sea/30 bg-sea/5 p-6">
            <p className="font-display text-xl font-bold text-ink">Application submitted</p>
            <p className="mt-2 text-sm text-stone">
              Reference: <span className="font-mono text-ink">{doneId}</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/applications"
              className="btn btn-ink"
            >
              View My Applications
            </Link>
            <button
              type="button"
              onClick={() => navigate(`/colleges/${college.slug}`)}
              className="btn btn-outline"
            >
                Back to college
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="Full name">
              <input
                className={inputClass}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </Field>
            <Field label="Gmail / Email">
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </Field>
            <Field label="Preferred branch">
              {college.branches.length > 0 ? (
                <select
                  className={inputClass}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                >
                  <option value="">Select branch</option>
                  {college.branches.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. CSE"
                  required
                />
              )}
            </Field>
            <Field label="Message (optional)">
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any question for the admission office…"
              />
            </Field>
            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
        )}
      </main>

      <SiteFooter />
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
