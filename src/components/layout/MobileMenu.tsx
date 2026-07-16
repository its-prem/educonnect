import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { menuSections } from '../../config/navigation'
import { useStudentAuth } from '../../hooks/useStudentAuth'

type MobileMenuProps = {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const location = useLocation()
  const { student, isLoggedIn, logout } = useStudentAuth()
  const prevPath = useRef(`${location.pathname}${location.hash}`)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  useEffect(() => {
    const next = `${location.pathname}${location.hash}`
    if (prevPath.current !== next) {
      prevPath.current = next
      onClose()
    }
  }, [location.pathname, location.hash, onClose])

  const menu = (
    <div
      id="site-menu"
      className={`fixed inset-0 z-[100] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close menu overlay"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/55 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute inset-y-0 right-0 flex h-[100dvh] max-h-[100dvh] w-[min(100%,24rem)] flex-col overflow-hidden bg-fog shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-5">
          <div>
            <p className="font-display text-xl font-extrabold text-ink">Menu</p>
            <p className="mt-0.5 text-xs text-stone">Browse · Login</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink hover:bg-mist"
          >
            <span className="relative block h-3.5 w-5" aria-hidden>
              <span className="absolute left-0 top-1.5 block h-0.5 w-full origin-center rotate-45 rounded-full bg-current" />
              <span className="absolute left-0 top-1.5 block h-0.5 w-full origin-center -rotate-45 rounded-full bg-current" />
            </span>
          </button>
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-6 [-webkit-overflow-scrolling:touch]"
          aria-label="Site menu"
        >
          <div className="space-y-8">
            {menuSections.map((section, sectionIndex) => (
              <div
                key={section.title}
                className={`menu-section ${open ? 'menu-section-in' : ''}`}
                style={{ transitionDelay: open ? `${80 + sectionIndex * 60}ms` : '0ms' }}
              >
                <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-stone uppercase">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={`${section.title}-${item.to}-${item.label}`}
                      className={`menu-item ${open ? 'menu-item-in' : ''}`}
                      style={{
                        transitionDelay: open
                          ? `${120 + sectionIndex * 60 + itemIndex * 35}ms`
                          : '0ms',
                      }}
                    >
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className="group flex items-start justify-between gap-3 rounded-lg px-3 py-3 hover:bg-white"
                      >
                        <span>
                          <span className="block text-[15px] font-semibold text-ink group-hover:text-sea-deep">
                            {item.label}
                          </span>
                          {item.description ? (
                            <span className="mt-0.5 block text-xs leading-relaxed text-stone">
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                        <span
                          aria-hidden
                          className="mt-1 text-stone group-hover:translate-x-1 group-hover:text-sea"
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-line bg-white px-5 py-4">
          {isLoggedIn && student ? (
            <div className="space-y-3">
              <p className="text-sm text-stone">
                Signed in as <span className="font-semibold text-ink">{student.name}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  logout()
                  onClose()
                }}
                className="btn btn-outline btn-block"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link to="/login" onClick={onClose} className="btn btn-ink btn-block">
                Student Login
              </Link>
              <Link to="/college/login" onClick={onClose} className="btn btn-primary btn-block">
                College Login
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  )

  if (typeof document === 'undefined') return null

  return createPortal(menu, document.body)
}
