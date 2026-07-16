import { Link, Navigate, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Reveal } from '../components/motion/Reveal'
import { useCatalog } from '../hooks/useCatalog'

export function StreamProgramsPage() {
  const { streamSlug = '' } = useParams()
  const catalog = useCatalog()

  const stream = catalog.streams.find((item) => item.slug === streamSlug)
  if (!stream) {
    return <Navigate to="/courses" replace />
  }

  const programs = catalog.programs.filter((program) => program.streamId === stream.id)

  return (
    <div className="min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <Reveal>
          <Link to="/courses" className="text-sm font-medium text-sea hover:text-sea-deep">
            ← All streams
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {stream.name}
          </h1>
          <p className="mt-3 max-w-xl text-stone">
            Select a program to see colleges. Each college shows type — Government, Semi Government,
            or Private.
          </p>
        </Reveal>

        <Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => {
              const collegeCount = catalog.colleges.filter(
                (college) =>
                  college.approvalStatus === 'approved' &&
                  college.programIds.includes(program.id),
              ).length

              return (
                <Link
                  key={program.id}
                  to={`/courses/${stream.slug}/${program.slug}`}
                  className="group rounded-lg border border-line bg-white px-6 py-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-sea/40 hover:bg-mist"
                >
                  <h2 className="font-display text-2xl font-bold text-ink transition-colors duration-300 group-hover:text-sea-deep">
                    {program.name}
                  </h2>
                  <p className="mt-2 text-sm text-stone">
                    {collegeCount} college{collegeCount === 1 ? '' : 's'}
                  </p>
                  <span className="mt-6 inline-block text-sm font-medium text-sea">
                    View colleges →
                  </span>
                </Link>
              )
            })}
          </div>
        </Reveal>

        {programs.length === 0 ? (
          <p className="mt-10 text-stone">
            No programs in this stream yet. Super Admin can add B.Tech, Diploma, M.Tech, and more.
          </p>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}
