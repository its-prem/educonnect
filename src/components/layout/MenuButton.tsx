type MenuButtonProps = {
  open: boolean
  onToggle: () => void
  className?: string
}

export function MenuButton({ open, onToggle, className = '' }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      aria-expanded={open}
      aria-controls="site-menu"
      aria-label={open ? 'Close menu' : 'Open menu'}
      className={`relative z-50 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 ${
        open
          ? 'border-line bg-white text-ink shadow-md hover:bg-fog'
          : 'border-white/25 bg-white/15 text-white hover:bg-white/25'
      } ${className}`}
    >
      <span className="relative block h-3.5 w-5" aria-hidden>
        <span
          className={`absolute left-0 block h-0.5 w-full origin-center rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? 'top-1.5 rotate-45' : 'top-0'
          }`}
        />
        <span
          className={`absolute left-0 top-1.5 block h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
          }`}
        />
        <span
          className={`absolute left-0 block h-0.5 w-full origin-center rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? 'top-1.5 -rotate-45' : 'top-3'
          }`}
        />
      </span>
    </button>
  )
}
