import { COLLEGE_TYPE_LABELS, type CollegeType } from '../../types/catalog'

const TYPE_STYLES: Record<CollegeType, string> = {
  government: 'bg-sea/10 text-sea-deep',
  'semi-government': 'bg-ink/8 text-ink-soft',
  private: 'bg-mist text-stone',
}

export function CollegeTypeBadge({ type }: { type: CollegeType }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${TYPE_STYLES[type]}`}
    >
      {COLLEGE_TYPE_LABELS[type]}
    </span>
  )
}
