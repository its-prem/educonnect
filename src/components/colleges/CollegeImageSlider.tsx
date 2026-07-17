import { useEffect, useState } from 'react'

type CollegeImageSliderProps = {
  images: string[]
  collegeName: string
}

function slugFilePart(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'campus'
}

async function downloadImage(src: string, filename: string) {
  // data: URLs can download directly
  if (src.startsWith('data:')) {
    const link = document.createElement('a')
    link.href = src
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
    return
  }

  // Remote / relative URLs — fetch as blob so download works reliably
  const response = await fetch(src)
  if (!response.ok) throw new Error('Could not download image')
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export function CollegeImageSlider({ images, collegeName }: CollegeImageSliderProps) {
  const slides = images.length > 0 ? images : []
  const [index, setIndex] = useState(0)
  const [downloading, setDownloading] = useState(false)

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

  async function handleDownload() {
    const src = slides[index]
    if (!src || downloading) return
    setDownloading(true)
    try {
      const base = slugFilePart(collegeName)
      const ext = src.startsWith('data:image/png')
        ? 'png'
        : src.startsWith('data:image/webp')
          ? 'webp'
          : 'jpg'
      await downloadImage(src, `${base}-photo-${index + 1}.${ext}`)
    } catch {
      // Fallback: open in new tab if fetch/CORS fails
      window.open(src, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-ink">
      <div className="relative h-[42vw] max-h-[420px] min-h-[220px]">
        {slides.map((src, i) => (
          <img
            key={`${src.slice(0, 48)}-${i}`}
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

      <div className="absolute right-3 bottom-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="rounded-md border border-white/25 bg-ink/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-ink/75 disabled:opacity-60"
        >
          {downloading ? 'Downloading…' : 'Download'}
        </button>
        <p className="rounded-md bg-ink/55 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {index + 1} / {slides.length}
        </p>
      </div>
    </div>
  )
}
