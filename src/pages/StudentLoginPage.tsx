import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useApprovedColleges } from '../hooks/useCatalog'
import { useStudentAuth } from '../hooks/useStudentAuth'

const inputClass =
  'w-full rounded-md border border-line bg-white px-3.5 py-3 text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-sea'

const OTHER_VALUE = '__other__'

type Mode = 'login' | 'register'

export function StudentLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { student, login, register } = useStudentAuth()
  const approvedColleges = useApprovedColleges()

  const initialMode: Mode = location.pathname.includes('register') ? 'register' : 'login'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [collegeSelect, setCollegeSelect] = useState('')
  const [otherCollegeName, setOtherCollegeName] = useState('')
  const [branch, setBranch] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const nextParam = new URLSearchParams(location.search).get('next')
  const redirectTo =
    (location.state as { from?: string } | null)?.from || nextParam || '/colleges'

  if (student) {
    return <Navigate to={redirectTo} replace />
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    navigate(next === 'register' ? '/register' : '/login', { replace: true })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      if (mode === 'register') {
        if (!collegeSelect) {
          setError('Please select your college from the list.')
          return
        }

        const isOther = collegeSelect === OTHER_VALUE
        let collegeId: string | null = null
        let collegeName = ''
        let collegeSlug = ''

        if (isOther) {
          collegeName = otherCollegeName.trim()
          if (collegeName.length < 2) {
            setError('Please type your college name.')
            return
          }
        } else {
          const selected = approvedColleges.find((college) => college.id === collegeSelect)
          if (!selected) {
            setError('Please select a valid college.')
            return
          }
          collegeId = selected.id
          collegeName = selected.name
          collegeSlug = selected.slug
        }

        const result = await register({
          name,
          phone,
          email,
          collegeId,
          collegeName,
          branch,
        })
        if (!result.ok) {
          setError(result.error)
          return
        }

        // Smart default next: linked students → their campus; Other → list new college
        const hasCustomNext = Boolean(nextParam || (location.state as { from?: string } | null)?.from)
        if (!hasCustomNext) {
          if (collegeId && collegeSlug) {
            navigate(`/colleges/${collegeSlug}`, { replace: true })
            return
          }
          navigate('/college/register', { replace: true })
          return
        }

        navigate(redirectTo, { replace: true })
        return
      }

      const result = await login({ email, phone })
      if (!result.ok) {
        setError(result.error)
        return
      }
      navigate(redirectTo, { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-enter min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(31,160,136,0.35) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 -left-20 h-64 w-64 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(11,31,51,0.18) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2 md:items-center md:px-8 md:py-20">
          <div className="animate-hero-rise">
            <p className="text-sm font-medium tracking-wide text-sea uppercase">Student account</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              {mode === 'register' ? 'Create your student profile' : 'Welcome back'}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-stone">
              {mode === 'register'
                ? 'Pick your college from the list (or Other if it is not listed). Linked students can update only their campus; Other students can list a new college.'
                : 'Log in with the Gmail and phone number you used while registering.'}
            </p>

            <ul className="mt-8 space-y-3 text-sm text-ink-soft">
              <li className="flex gap-2">
                <span className="text-sea">✓</span> Select college at registration
              </li>
              <li className="flex gap-2">
                <span className="text-sea">✓</span> Edit photos &amp; details for your campus only
              </li>
              <li className="flex gap-2">
                <span className="text-sea">✓</span> Or list a new college if yours is missing
              </li>
            </ul>
          </div>

          <div className="animate-hero-rise-delay rounded-lg border border-line bg-white p-6 shadow-[0_24px_60px_-40px_rgba(11,31,51,0.5)] md:p-8">
            <div className="grid grid-cols-2 gap-1 rounded-md bg-fog p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-md px-3 py-2.5 text-sm font-semibold transition-all ${
                  mode === 'login' ? 'bg-ink text-white' : 'text-stone hover:text-ink'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`rounded-md px-3 py-2.5 text-sm font-semibold transition-all ${
                  mode === 'register' ? 'bg-ink text-white' : 'text-stone hover:text-ink'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'register' ? (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink">Full name</span>
                    <input
                      className={inputClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink">Your college</span>
                    <select
                      className={inputClass}
                      value={collegeSelect}
                      onChange={(e) => setCollegeSelect(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select college…
                      </option>
                      {approvedColleges.map((college) => (
                        <option key={college.id} value={college.id}>
                          {college.name} ({college.city})
                        </option>
                      ))}
                      <option value={OTHER_VALUE}>Other — my college is not listed</option>
                    </select>
                  </label>

                  {collegeSelect === OTHER_VALUE ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-ink">
                        Type your college name
                      </span>
                      <input
                        className={inputClass}
                        value={otherCollegeName}
                        onChange={(e) => setOtherCollegeName(e.target.value)}
                        placeholder="College / campus name"
                        required
                      />
                      <span className="mt-1.5 block text-xs text-stone">
                        After register you can send a new college listing for Super Admin approval.
                      </span>
                    </label>
                  ) : null}

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink">Branch</span>
                    <input
                      className={inputClass}
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. CSE, Mechanical, Civil"
                      required
                    />
                  </label>
                </>
              ) : null}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Phone number</span>
                <input
                  className={inputClass}
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Gmail / Email</span>
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  required
                />
              </label>

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
                {busy
                  ? 'Please wait…'
                  : mode === 'register'
                    ? 'Create account'
                    : 'Log in'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-stone">
              {mode === 'register' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold text-sea hover:text-sea-deep"
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  New student?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-semibold text-sea hover:text-sea-deep"
                  >
                    Register with details
                  </button>
                </>
              )}
            </p>

            <Link
              to="/"
              className="mt-4 block text-center text-sm font-medium text-stone hover:text-ink"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
