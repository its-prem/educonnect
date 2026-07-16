const MAX_IMAGE_EDGE = 1400
const IMAGE_QUALITY = 0.72
const MAX_PDF_BYTES = 2.5 * 1024 * 1024

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

/** Compress / resize image for localStorage-friendly data URLs */
export async function fileToImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file')
  }

  const raw = await readFileAsDataUrl(file)
  const img = await loadImage(raw)

  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return raw
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
}

export async function fileToPdfDataUrl(file: File): Promise<string> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Please upload a PDF file')
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('PDF must be under 2.5 MB')
  }
  return readFileAsDataUrl(file)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Invalid image'))
    img.src = src
  })
}
