import { useEffect, useState } from 'react'

type CollegeImageSliderProps = {
  images: string[]
  collegeName: string
}

export function CollegeImageSlider({ images, collegeName }: CollegeImageSliderProps) {
  const slides = images.length > 0 ? images : []
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [collegeName, slides.length])

  if (slides.length === 0) {
    return (
      <div className="flex h-[42vw] max-h-[420px] min-h-[220px] items-center justify-center rounded-lg border border-line bg-mist text-stone">
        No campus images yet
      </div>
    )
  }

  const go = (next: number) => {
    setIndex((prev) => (prev + next + slides.length) % slides.length)
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-ink">
      <div className="relative h-[42vw] max-h-[420px] min-h-[220px]">
        {slides.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${collegeName} campus photo ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-white/25 bg-ink/45 text-white backdrop-blur-sm transition-colors hover:bg-ink/65"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-white/25 bg-ink/45 text-white backdrop-blur-sm transition-colors hover:bg-ink/65"
          >
            →
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === index ? 'w-5 bg-white' : 'bg-white/45 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}

      <p className="absolute right-3 bottom-3 z-10 rounded-md bg-ink/55 px-2 py-1 text-xs text-white backdrop-blur-sm">
        {index + 1} / {slides.length}
      </p>
    </div>
  )
}
