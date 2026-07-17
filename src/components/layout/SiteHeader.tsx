import { useCallback, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCatalog } from '../../hooks/useCatalog'
import { useStudentAuth } from '../../hooks/useStudentAuth'
import { MenuButton } from './MenuButton'
import { MobileMenu } from './MobileMenu'

type SiteHeaderProps = {
  variant?: 'transparent' | 'solid'
}

export function SiteHeader({ variant = 'transparent' }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { student, isLoggedIn, logout } = useStudentAuth()
  const catalog = useCatalog()

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), [])

  const isSolid = variant === 'solid'

  const myCollege = student
    ? student.collegeId
      ? catalog.colleges.find((college) => college.id === student.collegeId)
      : catalog.colleges.find(
          (college) =>
            college.approvalStatus === 'approved' &&
            college.name.trim().toLowerCase().replace(/\s+/g, ' ') ===
              student.collegeName.trim().toLowerCase().replace(/\s+/g, ' '),
        )
    : undefined

  const editHref = myCollege
    ? `/colleges/${myCollege.slug}#edit-college`
    : student && !student.collegeId
      ? '/college/register'
      : null

  // Keep center nav light — only primary browse links
  const navLinks = [
    { label: 'Home', to: '/', end: true },
    { label: 'Colleges', to: '/colleges', end: false },
    { label: 'Courses', to: '/courses', end: false },
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
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 md:h-[4.25rem] md:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 font-display text-lg font-extrabold tracking-tight transition-opacity hover:opacity-90 md:text-xl"
            onClick={closeMenu}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-sea text-sm text-white shadow-sm">
              E
            </span>
            EduConnect
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
            aria-label="Primary"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-md px-3.5 py-2 text-[13px] font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'bg-white/12 text-white'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isLoggedIn ? (
              <NavLink
                to="/applications"
                className={({ isActive }) =>
                  `rounded-md px-3.5 py-2 text-[13px] font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'bg-white/12 text-white'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                Applications
              </NavLink>
            ) : null}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            {isLoggedIn && student ? (
              <div className="hidden items-center gap-2 lg:flex">
                {editHref ? (
                  <Link
                    to={editHref}
                    className="rounded-md bg-sea px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-sea-deep"
                    title={student.collegeName || undefined}
                  >
                    {myCollege ? 'Edit' : 'List'}
                  </Link>
                ) : null}
                <div
                  className="flex items-center gap-2 rounded-md bg-white/10 py-1 pr-2.5 pl-1"
                  title={
                    student.collegeName
                      ? `${student.name} · ${student.collegeName}`
                      : student.name
                  }
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-sea text-[11px] font-bold text-white uppercase">
                    {student.name.trim().charAt(0) || 'U'}
                  </span>
                  <span className="max-w-[7rem] truncate text-[13px] font-medium text-white">
                    {student.name.split(' ')[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  to="/login"
                  className="rounded-md bg-sea px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-sea-deep"
                >
                  Login
                </Link>
              </div>
            )}

            <MenuButton open={menuOpen} onToggle={toggleMenu} className="lg:hidden" />
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}
