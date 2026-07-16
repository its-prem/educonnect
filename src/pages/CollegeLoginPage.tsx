import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useCollegeAuth } from '../hooks/useCollegeAuth'

const inputClass =
  'w-full rounded-md border border-line bg-white px-3.5 py-3 text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-sea'

type Mode = 'login' | 'register'

export function CollegeLoginPage() {
  const navigate = useNavigate()
  const { account, login, register } = useCollegeAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [collegeName, setCollegeName] = useState('')
  const [contactName, setContactName] = useState('')
  const [branch, setBranch] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (account) {
    return <Navigate to="/login?next=/college/register" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      if (mode === 'register') {
        const result = await register({ collegeName, contactName, phone, email, branch })
        if (!result.ok) {
          setError(result.error)
          return
        }
        navigate('/login?next=/college/register', { replace: true })
        return
      }

      const result = await login({ email, phone })
      if (!result.ok) {
        setError(result.error)
        return
      }
      navigate('/login?next=/college/register', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-enter min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(31,160,136,0.28) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2 md:items-center md:px-8 md:py-20">
          <div className="animate-hero-rise">
            <p className="text-sm font-medium tracking-wide text-sea uppercase">College account</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              {mode === 'register' ? 'Register your campus login' : 'College login'}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-stone">
              Campus contact details are saved here. To submit a college listing for Super Admin
              review, continue with Student Login — only logged-in students can send listing
              requests.
            </p>
          </div>

          <div className="animate-hero-rise-delay rounded-lg border border-line bg-white p-6 shadow-[0_24px_60px_-40px_rgba(11,31,51,0.5)] md:p-8">
            <div className="grid grid-cols-2 gap-1 rounded-md bg-fog p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError('')
                }}
                className={`rounded-md px-3 py-2.5 text-sm font-semibold transition-all ${
                  mode === 'login' ? 'bg-ink text-white' : 'text-stone hover:text-ink'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError('')
                }}
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
                    <span className="mb-1.5 block text-sm font-medium text-ink">College name</span>
                    <input
                      className={inputClass}
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="Campus name"
                      required
                    />
                  </label>
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
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink">Contact person</span>
                    <input
                      className={inputClass}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
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
                  placeholder="campus@gmail.com"
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
                    ? 'Create campus account'
                    : 'Log in'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-stone">
              Student?{' '}
              <Link to="/login" className="font-semibold text-sea hover:text-sea-deep">
                Student Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
