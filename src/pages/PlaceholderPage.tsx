import { Link } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'

type PlaceholderProps = {
  title: string
  note: string
}

export function PlaceholderPage({ title, note }: PlaceholderProps) {
  return (
    <div className="min-h-screen bg-fog">
      <SiteHeader variant="solid" />
      <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-24 text-center">
        <h1 className="animate-hero-rise font-display text-3xl font-bold text-ink md:text-4xl">
          {title}
        </h1>
        <p className="animate-hero-rise-delay mt-4 text-stone">{note}</p>
        <Link
          to="/"
          className="animate-hero-rise-delay-2 mt-8 rounded-md bg-sea px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-sea-deep"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
