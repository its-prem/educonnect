import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AdminShellProps = {
  children: ReactNode
  onLogout?: () => void
  showLogout?: boolean
}

/** Separate chrome for Super Admin — not linked from the public site menu */
export function AdminShell({ children, onLogout, showLogout = false }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-fog">
      <header className="sticky top-0 z-50 border-b border-line bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div>
            <p className="font-display text-lg font-extrabold tracking-tight md:text-xl">
              EduConnect Admin
            </p>
            <p className="text-xs text-white/55">Super Admin panel — separate from public site</p>
          </div>
          <div className="flex items-center gap-2">
            {showLogout && onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-md border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/18"
              >
                Log out
              </button>
            ) : null}
            <Link
              to="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:text-white"
            >
              Public site
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
