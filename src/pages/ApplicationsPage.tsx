import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useApplications } from '../hooks/useCatalog'
import { useStudentAuth } from '../hooks/useStudentAuth'

export function ApplicationsPage() {
  const applications = useApplications()
  const { student, isLoggedIn } = useStudentAuth()
  const [emailFilter, setEmailFilter] = useState('')

  const visible = useMemo(() => {
    let list = applications
    if (isLoggedIn && student) {
      list = list.filter((app) => app.email.toLowerCase() === student.email.toLowerCase())
    }
    const needle = emailFilter.trim().toLowerCase()
    if (!needle) return list
    return list.filter((app) => app.email.toLowerCase().includes(needle))
  }, [applications, emailFilter, isLoggedIn, student])

  return (
    <div className="min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
        <h1 className="font-display text-3xl font-bold text-ink">My Applications</h1>
        <p className="mt-3 text-stone">
          {isLoggedIn && student
            ? `Showing applications for ${student.email}.`
            : 'Log in to see only your applications, or filter by email below.'}
        </p>

        {!isLoggedIn ? (
          <div className="mt-6 rounded-lg border border-line bg-white p-4">
            <p className="text-sm text-stone">You are not logged in.</p>
              <Link to="/login" state={{ from: '/applications' }} className="btn btn-primary mt-3">
                Student Login
              </Link>
          </div>
        ) : null}

        {!isLoggedIn ? (
          <label className="mt-6 block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Filter by email</span>
            <input
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="you@gmail.com"
              className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-ink outline-none focus:border-sea"
            />
          </label>
        ) : null}

        <ul className="mt-8 space-y-3">
          {visible.map((app) => (
            <li key={app.id} className="rounded-lg border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-bold text-ink">{app.collegeName}</p>
                  <p className="mt-1 text-sm text-stone">
                    {app.studentName} · {app.branch}
                  </p>
                  <p className="mt-1 text-xs text-stone">
                    {new Date(app.createdAt).toLocaleString()} · {app.status}
                  </p>
                </div>
                {app.collegeSlug ? (
                  <Link
                    to={`/colleges/${app.collegeSlug}`}
                    className="text-sm font-medium text-sea hover:text-sea-deep"
                  >
                    View college
                  </Link>
                ) : null}
              </div>
              <p className="mt-2 font-mono text-xs text-stone">Ref: {app.id}</p>
            </li>
          ))}
          {visible.length === 0 ? (
            <li className="rounded-lg border border-line bg-white px-4 py-8 text-center text-stone">
              No applications yet.{' '}
              <Link to="/colleges" className="font-medium text-sea hover:text-sea-deep">
                Find a college
              </Link>
            </li>
          ) : null}
        </ul>
      </main>

      <SiteFooter />
    </div>
  )
}
