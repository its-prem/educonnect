import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink text-mist">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p className="font-display text-2xl font-bold text-white">EduConnect</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist/70">
            College and course discovery for students. Campus tools for colleges. One platform for
            admissions clarity.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-mist/75">
          <Link to="/colleges" className="transition-all duration-300 hover:translate-y-[-1px] hover:text-white">
            Colleges
          </Link>
          <Link to="/courses" className="transition-all duration-300 hover:translate-y-[-1px] hover:text-white">
            Courses
          </Link>
          <Link to="/login" className="transition-all duration-300 hover:translate-y-[-1px] hover:text-white">
            Student Login
          </Link>
          <Link to="/college/register" className="transition-all duration-300 hover:translate-y-[-1px] hover:text-white">
            List a College
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-4 text-xs text-mist/50 md:px-8">
          © {new Date().getFullYear()} EduConnect. Built for Hostinger-ready deployment.
        </p>
      </div>
    </footer>
  )
}
