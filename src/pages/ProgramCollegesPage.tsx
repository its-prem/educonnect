import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CollegeCard } from '../components/colleges/CollegeCard'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Reveal } from '../components/motion/Reveal'
import { useCatalog } from '../hooks/useCatalog'
import { COLLEGE_TYPE_LABELS, type CollegeType } from '../types/catalog'

const FILTERS: Array<'all' | CollegeType> = [
  'all',
  'government',
  'semi-government',
  'private',
]

export function ProgramCollegesPage() {
  const { streamSlug = '', programSlug = '' } = useParams()
  const catalog = useCatalog()
  const [typeFilter, setTypeFilter] = useState<'all' | CollegeType>('all')

  const stream = catalog.streams.find((item) => item.slug === streamSlug)
  const program = stream
    ? catalog.programs.find((item) => item.streamId === stream.id && item.slug === programSlug)
    : undefined

  const colleges = useMemo(() => {
    if (!program) return []
    const programName = program.name.trim().toLowerCase()
    const matchesProgram = (college: (typeof catalog.colleges)[number]) => {
      if (college.programIds.includes(program.id)) return true
      // Legacy / bulk colleges may only have program names (no linked IDs).
      const names = [...(college.customPrograms ?? []), ...(college.courses ?? [])]
      return names.some((n) => n.trim().toLowerCase() === programName)
    }
    return catalog.colleges
      .filter((college) => college.approvalStatus === 'approved')
      .filter(matchesProgram)
      .filter((college) => (typeFilter === 'all' ? true : college.type === typeFilter))
  }, [catalog.colleges, program, typeFilter])

  if (!stream || !program) {
    return <Navigate to="/courses" replace />
  }

  return (
    <div className="min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <Reveal>
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone">
            <Link to="/courses" className="font-medium text-sea hover:text-sea-deep">
              Courses
            </Link>
            <span>/</span>
            <Link
              to={`/courses/${stream.slug}`}
              className="font-medium text-sea hover:text-sea-deep"
            >
              {stream.name}
            </Link>
            <span>/</span>
            <span className="text-ink">{program.name}</span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            {program.name} colleges
          </h1>
          <p className="mt-3 max-w-xl text-stone">
            Click a college to open campus images, fees, location, principal, branches, and Take
            Admission.
          </p>
        </Reveal>

        <Reveal>
          <div className="mt-8 flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const label = filter === 'all' ? 'All' : COLLEGE_TYPE_LABELS[filter]
              const active = typeFilter === filter
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTypeFilter(filter)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-300 ${
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-white text-stone hover:border-ink/30 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-6">
            {colleges.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {colleges.map((college) => (
                  <CollegeCard key={college.id} college={college} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-white px-4 py-10 text-center text-stone">
                No colleges for this filter yet. Super Admin can add them with the + control.
              </div>
            )}
          </div>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  )
}
