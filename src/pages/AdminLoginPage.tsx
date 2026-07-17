import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AdminShell } from '../components/layout/AdminShell'
import { useSuperAdmin } from '../hooks/useCatalog'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { isAdmin, login } = useSuperAdmin()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const ok = await login(password)
      if (!ok) {
        setError('Wrong password.')
        return
      }
      navigate('/admin', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminShell>
      <main className="mx-auto flex max-w-md flex-col px-5 py-16 md:py-24">
        <h1 className="font-display text-3xl font-bold text-ink">Super Admin login</h1>
        <p className="mt-3 text-sm text-stone">
          This page is separate from the public site. Users only see Student Login.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-ink outline-none transition-colors focus:border-sea"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button type="submit" className="btn btn-ink btn-block" disabled={busy}>
            {busy ? 'Checking…' : 'Enter admin panel'}
          </button>
        </form>
      </main>
    </AdminShell>
  )
}
