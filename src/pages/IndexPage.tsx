import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Reveal } from '../components/motion/Reveal'
import { useApprovedColleges, useCatalog } from '../hooks/useCatalog'
import { ADMISSION_STATUS_LABELS } from '../types/catalog'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80'

const steps = [
  {
    title: 'Browse colleges',
    text: 'Explore by stream — Engineering, Medical, and more — then open Diploma, B.Tech, or M.Tech lists.',
  },
  {
    title: 'Take Admission',
    text: 'Open a campus page, check fees and branches, then apply in one form when admissions are open.',
  },
  {
    title: 'Track applications',
    text: 'Follow every submission from your student account under My Applications.',
  },
]

export function IndexPage() {
  const location = useLocation()
  const catalog = useCatalog()
  const colleges = useApprovedColleges().slice(0, 3)

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace('#', '')
    const el = document.getElementById(id)
    if (el) {
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }, [location.hash])

  return (
    <div className="page-enter min-h-screen bg-fog">
      <section className="relative min-h-[100svh] overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Students walking across a college campus"
            className="animate-hero-zoom h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(112deg, rgba(11,31,51,0.94) 0%, rgba(11,31,51,0.7) 48%, rgba(11,31,51,0.28) 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(circle at 18% 22%, rgba(31,160,136,0.28), transparent 42%), radial-gradient(circle at 88% 78%, rgba(31,160,136,0.12), transparent 35%)',
            }}
          />
        </div>

        <SiteHeader />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24 md:pt-20">
          <p className="animate-hero-rise font-display text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            EduConnect
          </p>

          <h1 className="animate-hero-rise-delay mt-5 max-w-xl font-display text-2xl font-bold leading-tight text-white sm:text-3xl md:mt-6 md:text-4xl">
            Discover colleges. Apply with confidence.
          </h1>

          <p className="animate-hero-rise-delay mt-4 max-w-md text-base leading-relaxed text-white/80 md:text-lg">
            Search by stream and program, read campus details, and take admission — built for
            students and campuses.
          </p>

          <div className="animate-hero-rise-delay-2 mt-8 flex flex-wrap items-center gap-3 md:mt-10">
            <Link to="/courses" className="btn btn-primary btn-lg">
              Browse by stream
            </Link>
            <Link to="/colleges" className="btn btn-secondary btn-lg">
              All colleges
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-fog px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
              How EduConnect works
            </h2>
            <p className="mt-3 max-w-lg text-stone">
              A straight path from discovery to admission — no compare clutter, no guesswork.
            </p>
          </Reveal>

          <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Reveal delayMs={index * 100}>
                  <div className="transition-transform duration-500 hover:-translate-y-1">
                    <span className="font-display text-5xl font-extrabold text-sea/25 md:text-6xl">
                      0{index + 1}
                    </span>
                    <h3 className="mt-3 font-display text-xl font-bold text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone">{step.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="streams" className="scroll-mt-24 border-y border-line bg-white px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                  Explore by stream
                </h2>
                <p className="mt-3 max-w-lg text-stone">
                  Pick a field, choose Diploma / B.Tech / M.Tech, then open college details and Take
                  Admission.
                </p>
              </div>
              <Link
                to="/courses"
                className="text-sm font-semibold text-sea transition-colors hover:text-sea-deep"
              >
                View all streams →
              </Link>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.streams.map((stream, index) => (
                <Link
                  key={stream.id}
                  to={`/courses/${stream.slug}`}
                  className="lift group relative overflow-hidden rounded-lg border border-line bg-fog px-5 py-7 hover:border-sea/40 hover:bg-white hover:shadow-[0_18px_40px_-28px_rgba(11,31,51,0.35)]"
                  style={{ transitionDelay: `${index * 40}ms` }}
                >
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-stone uppercase">
                    Stream
                  </p>
                  <h3 className="mt-3 font-display text-xl font-bold text-ink transition-colors duration-300 group-hover:text-sea-deep">
                    {stream.name}
                  </h3>
                  <p className="mt-2 text-sm text-stone">{stream.hint}</p>
                  <span className="mt-5 inline-block text-sm font-medium text-sea transition-transform duration-300 group-hover:translate-x-1">
                    Open →
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {colleges.length > 0 ? (
        <section className="bg-fog px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                    Featured campuses
                  </h2>
                  <p className="mt-3 max-w-lg text-stone">
                    A few approved colleges to start with — open any campus for images, fees, and
                    admission.
                  </p>
                </div>
                <Link
                  to="/colleges"
                  className="text-sm font-semibold text-sea transition-colors hover:text-sea-deep"
                >
                  See all colleges →
                </Link>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {colleges.map((college, index) => (
                <Reveal key={college.id} delayMs={index * 90}>
                  <Link
                    to={`/colleges/${college.slug}`}
                    className="lift group block overflow-hidden rounded-lg border border-line bg-white hover:border-sea/35 hover:shadow-[0_18px_40px_-28px_rgba(11,31,51,0.4)]"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-mist">
                      {college.images[0] ? (
                        <img
                          src={college.images[0]}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </div>
                    <div className="px-4 py-4">
                      <h3 className="font-display text-lg font-bold text-ink transition-colors group-hover:text-sea-deep">
                        {college.name}
                      </h3>
                      <p className="mt-1 text-sm text-stone">{college.city}</p>
                      <p className="mt-2 text-xs font-semibold text-sea-deep">
                        {ADMISSION_STATUS_LABELS[college.admissionStatus]}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative overflow-hidden bg-ink-soft px-5 py-20 text-white md:px-8 md:py-24">
        <div
          className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #1fa088 0%, transparent 70%)' }}
        />
        <Reveal>
          <div className="relative mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                Are you a college?
              </h2>
              <p className="mt-3 text-mist/75">
                List your campus with programs, branches, and fees. Super Admin approves — then
                students can find you and take admission.
              </p>
            </div>
            <Link to="/college/register" className="btn btn-primary btn-lg w-fit">
              Register Your Campus
            </Link>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  )
}
