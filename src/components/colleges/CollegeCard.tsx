import { Link } from 'react-router-dom'
import type { College } from '../../types/catalog'
import { ADMISSION_STATUS_LABELS } from '../../types/catalog'
import { CollegeTypeBadge } from './CollegeTypeBadge'
import { useCatalog } from '../../hooks/useCatalog'

type CollegeCardProps = {
  college: College
}

export function CollegeCard({ college }: CollegeCardProps) {
  const catalog = useCatalog()
  const thumb = college.images[0]
  const programs = catalog.programs.filter((program) => college.programIds.includes(program.id))

  return (
    <article className="lift group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white hover:border-sea/35 hover:shadow-[0_18px_44px_-28px_rgba(11,31,51,0.45)]">
      <Link to={`/colleges/${college.slug}`} className="flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-mist">
          {thumb ? (
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl font-bold text-sea/40">
              {college.name.charAt(0)}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/35 to-transparent" />
        </div>

        <div className="flex flex-1 flex-col px-4 pt-4 pb-5">
          <h3 className="font-display text-lg leading-snug font-bold text-ink transition-colors duration-300 group-hover:text-sea-deep">
            {college.name}
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <CollegeTypeBadge type={college.type} />
            <span
              className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                college.admissionStatus === 'open'
                  ? 'bg-sea/12 text-sea-deep'
                  : 'bg-mist text-stone'
              }`}
            >
              {ADMISSION_STATUS_LABELS[college.admissionStatus]}
            </span>
          </div>

          <p className="mt-3 text-sm text-stone">{college.city}</p>

          {programs.length > 0 ? (
            <p className="mt-2 text-xs leading-relaxed text-stone">
              {programs.map((program) => program.name).join(' · ')}
            </p>
          ) : null}

          <span className="mt-4 text-sm font-medium text-sea opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
            View details →
          </span>
        </div>
      </Link>
    </article>
  )
}
