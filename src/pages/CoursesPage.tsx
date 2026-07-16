import { Link, useSearchParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Reveal } from '../components/motion/Reveal'
import { useCatalog } from '../hooks/useCatalog'

export function CoursesPage() {
  const catalog = useCatalog()
  const [searchParams] = useSearchParams()
  const streamQuery = searchParams.get('stream')?.toLowerCase()

  const streams = catalog.streams
  const highlighted = streamQuery
    ? streams.find((stream) => stream.name.toLowerCase() === streamQuery || stream.slug === streamQuery)
    : null

  return (
    <div className="min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <Reveal>
          <p className="text-sm font-medium tracking-wide text-stone uppercase">Courses</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Browse by stream
          </h1>
          <p className="mt-3 max-w-xl text-stone">
            Choose a stream to see programs. Engineering opens B.Tech, Diploma, and M.Tech.
          </p>
        </Reveal>

        {highlighted ? (
          <Reveal>
            <div className="mt-8 rounded-lg border border-sea/30 bg-sea/5 px-4 py-3 text-sm text-ink-soft">
              Opening from home: <span className="font-semibold">{highlighted.name}</span> — pick it below
              to continue.
            </div>
          </Reveal>
        ) : null}

        <Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {streams.map((stream) => {
              const programCount = catalog.programs.filter((p) => p.streamId === stream.id).length
              const isHighlight = highlighted?.id === stream.id

              return (
                <Link
                  key={stream.id}
                  to={`/courses/${stream.slug}`}
                  className={`group block bg-white p-6 transition-all duration-500 hover:bg-mist ${
                    isHighlight ? 'ring-2 ring-sea ring-inset' : ''
                  }`}
                >
                  <h2 className="font-display text-lg font-bold text-ink transition-colors duration-300 group-hover:text-sea-deep">
                    {stream.name}
                  </h2>
                  <p className="mt-2 text-sm text-stone">{stream.hint}</p>
                  <p className="mt-4 text-xs font-medium text-stone">
                    {programCount} program{programCount === 1 ? '' : 's'}
                  </p>
                  <span className="mt-2 inline-block text-sm font-medium text-sea opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    View programs →
                  </span>
                </Link>
              )
            })}
          </div>
        </Reveal>

        {streams.length === 0 ? (
          <p className="mt-10 text-stone">No streams yet. Super Admin can add them from the panel.</p>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}
