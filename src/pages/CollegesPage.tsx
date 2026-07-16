import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CollegeCard } from '../components/colleges/CollegeCard'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Reveal } from '../components/motion/Reveal'
import { useApprovedColleges, useCatalog } from '../hooks/useCatalog'
import { COLLEGE_TYPE_LABELS, type CollegeType } from '../types/catalog'

const fieldClass =
  'h-10 appearance-none rounded-full border-0 bg-transparent pl-3.5 pr-8 text-sm font-medium text-ink outline-none focus:ring-0'

export function CollegesPage() {
  const colleges = useApprovedColleges()
  const catalog = useCatalog()
  const [typeFilter, setTypeFilter] = useState<'all' | CollegeType>('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [query, setQuery] = useState('')

  const programs = useMemo(
    () => [...catalog.programs].sort((a, b) => a.name.localeCompare(b.name)),
    [catalog.programs],
  )

  const filtered = colleges.filter((college) => {
    const matchesType = typeFilter === 'all' ? true : college.type === typeFilter
    const matchesProgram =
      programFilter === 'all' ? true : college.programIds.includes(programFilter)
    const needle = query.trim().toLowerCase()
    const matchesQuery =
      !needle ||
      college.name.toLowerCase().includes(needle) ||
      college.city.toLowerCase().includes(needle) ||
      college.branches.some((branch) => branch.toLowerCase().includes(needle))
    return matchesType && matchesProgram && matchesQuery
  })

  return (
    <div className="page-enter min-h-screen bg-fog">
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Colleges
              </h1>
              <p className="mt-2 max-w-md text-sm text-stone">
                Approved campuses — open any for fees, branches, and admission.
              </p>
            </div>
            <Link
              to="/college/register"
              className="text-sm font-semibold text-sea transition-colors hover:text-sea-deep"
            >
              List a college →
            </Link>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone"
              >
                ⌕
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search colleges"
                className="h-10 w-full rounded-full bg-white/80 pr-4 pl-9 text-sm text-ink outline-none ring-1 ring-line/80 placeholder:text-stone/70 focus:bg-white focus:ring-sea/40"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterPill active={typeFilter !== 'all'}>
                <select
                  className={fieldClass}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | CollegeType)}
                  aria-label="College type"
                >
                  <option value="all">All types</option>
                  <option value="government">{COLLEGE_TYPE_LABELS.government}</option>
                  <option value="private">{COLLEGE_TYPE_LABELS.private}</option>
                  <option value="semi-government">{COLLEGE_TYPE_LABELS['semi-government']}</option>
                </select>
              </FilterPill>

              <FilterPill active={programFilter !== 'all'}>
                <select
                  className={fieldClass}
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  aria-label="Program"
                >
                  <option value="all">All programs</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </FilterPill>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-6">
            {filtered.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((college) => (
                  <CollegeCard key={college.id} college={college} />
                ))}
              </div>
            ) : (
              <p className="py-14 text-center text-sm text-stone">No colleges match these filters.</p>
            )}
          </div>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  )
}

function FilterPill({
  children,
  active,
}: {
  children: ReactNode
  active?: boolean
}) {
  return (
    <div
      className={`relative inline-flex items-center rounded-full ring-1 transition-colors ${
        active
          ? 'bg-ink text-white ring-ink [&_select]:text-white'
          : 'bg-white/80 text-ink ring-line/80 hover:bg-white hover:ring-ink/20'
      }`}
    >
      {children}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] ${
          active ? 'text-white/70' : 'text-stone'
        }`}
      >
        ▾
      </span>
    </div>
  )
}
