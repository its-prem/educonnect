import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { primaryNav } from '../../config/navigation'
import { useStudentAuth } from '../../hooks/useStudentAuth'
import { MenuButton } from './MenuButton'
import { MobileMenu } from './MobileMenu'

type SiteHeaderProps = {
  variant?: 'transparent' | 'solid'
}

export function SiteHeader({ variant = 'transparent' }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { student, isLoggedIn, logout } = useStudentAuth()

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), [])

  const isSolid = variant === 'solid'

  return (
    <>
      <header
        className={`animate-fade-in z-50 ${
          isSolid
            ? 'sticky top-0 border-b border-line bg-ink/95 text-white shadow-sm backdrop-blur-md'
            : 'absolute inset-x-0 top-0 text-white'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-5">
          <Link
            to="/"
            className="font-display text-xl font-extrabold tracking-tight transition-opacity duration-300 hover:opacity-90 md:text-2xl"
            onClick={closeMenu}
          >
            EduConnect
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {primaryNav.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/80 hover:bg-white/12 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn && student ? (
              <>
                <span className="hidden max-w-[140px] truncate text-sm font-medium text-white/85 lg:inline">
                  Hi, {student.name.split(' ')[0]}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-ghost btn-sm hidden lg:inline-flex"
                >
                  Logout
                </button>
              </>
            ) : null}

            <MenuButton open={menuOpen} onToggle={toggleMenu} />
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}
