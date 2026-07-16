import { useCallback, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
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

  const navLinks = [
    { label: 'Home', to: '/', end: true },
    { label: 'Colleges', to: '/colleges', end: false },
    { label: 'Courses', to: '/courses', end: false },
    ...(isLoggedIn ? [{ label: 'My Applications', to: '/applications', end: false }] : []),
  ]

  return (
    <>
      <header
        className={`animate-fade-in z-50 ${
          isSolid
            ? 'sticky top-0 border-b border-white/10 bg-ink/95 text-white shadow-lg backdrop-blur-md'
            : 'absolute inset-x-0 top-0 text-white'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4 md:px-8 md:py-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight transition-opacity duration-300 hover:opacity-90 md:text-2xl"
            onClick={closeMenu}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-sea text-white shadow-sm">
              E
            </span>
            EduConnect
          </Link>

          {/* Desktop nav — centered */}
          <nav
            className="mx-auto hidden items-center gap-1 lg:flex"
            aria-label="Primary"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0">
            {isLoggedIn && student ? (
              <div className="hidden items-center gap-3 lg:flex">
                <span className="flex items-center gap-2 rounded-full bg-white/10 py-1.5 pr-3 pl-1.5 text-sm font-medium text-white">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-sea text-xs font-bold text-white uppercase">
                    {student.name.trim().charAt(0) || 'U'}
                  </span>
                  <span className="max-w-[120px] truncate">{student.name.split(' ')[0]}</span>
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  to="/login"
                  className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Student Login
                </Link>
                <Link
                  to="/college/login"
                  className="rounded-lg bg-sea px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sea-deep"
                >
                  College Login
                </Link>
              </div>
            )}

            {/* Hamburger — mobile / tablet only */}
            <MenuButton open={menuOpen} onToggle={toggleMenu} className="lg:hidden" />
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}
