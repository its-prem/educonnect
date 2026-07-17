import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { College } from '../../types/catalog'
import type { Student } from '../../types/student'
import type { CollegeEditFields } from '../../types/contributions'
import { ADMISSION_STATUS_LABELS, COLLEGE_TYPE_LABELS } from '../../types/catalog'
import { submitContribution } from '../../data/contributionsStore'
import { fileToImageDataUrl } from '../../utils/fileData'

const inputClass =
  'w-full rounded-md border border-line bg-white px-3 py-2.5 text-ink outline-none transition-colors focus:border-sea'

type Props = {
  college: College
  student: Student
  /** Open the form immediately (e.g. from navbar Edit link) */
  defaultOpen?: boolean
}

export function CollegeContributeForm({ college, student, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [showEdits, setShowEdits] = useState(false)

  const [images, setImages] = useState<string[]>([])
  const [about, setAbout] = useState(college.about ?? '')
  const [location, setLocation] = useState(college.location ?? '')
  const [principalName, setPrincipalName] = useState(college.principalName ?? '')
  const [feesStructure, setFeesStructure] = useState(college.feesStructure ?? '')
  const [branchesText, setBranchesText] = useState(college.branches.join(', '))
  const [type, setType] = useState(college.type)
  const [admissionStatus, setAdmissionStatus] = useState(college.admissionStatus)
  const [note, setNote] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const originalBranches = useMemo(() => college.branches.join(', '), [college.branches])

  useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash === '#edit-college') {
      setOpen(true)
      document.getElementById('edit-college')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return
    setError('')
    setBusy(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        uploaded.push(await fileToImageDataUrl(file))
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setBusy(false)
    }
  }

  function buildEdits(): CollegeEditFields {
    const edits: CollegeEditFields = {}
    if (showEdits) {
      const trimmedAbout = about.trim()
      const trimmedLocation = location.trim()
      const trimmedPrincipal = principalName.trim()
      const trimmedFees = feesStructure.trim()
      if (trimmedAbout && trimmedAbout !== (college.about ?? '').trim()) edits.about = trimmedAbout
      if (trimmedLocation && trimmedLocation !== (college.location ?? '').trim())
        edits.location = trimmedLocation
      if (trimmedPrincipal && trimmedPrincipal !== (college.principalName ?? '').trim())
        edits.principalName = trimmedPrincipal
      if (trimmedFees && trimmedFees !== (college.feesStructure ?? '').trim())
        edits.feesStructure = trimmedFees
      if (type !== college.type) edits.type = type
      if (admissionStatus !== college.admissionStatus) edits.admissionStatus = admissionStatus
      if (branchesText.trim() !== originalBranches.trim()) {
        const branches = branchesText
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
        if (branches.length) edits.branches = branches
      }
    }
    return edits
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setError('')

    const edits = buildEdits()
    if (images.length === 0 && Object.keys(edits).length === 0) {
      setError('Add at least one photo or change a detail before sending.')
      return
    }

    setBusy(true)
    try {
      await submitContribution({
        collegeId: college.id,
        collegeSlug: college.slug,
        collegeName: college.name,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        studentPhone: student.phone,
        images,
        edits,
        note: note.trim(),
      })
      setDone(true)
      setImages([])
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your request.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div
        id="edit-college"
        className="scroll-mt-24 rounded-lg border-2 border-sea/40 bg-sea/5 p-5 md:p-6"
      >
        <h3 className="font-display text-lg font-bold text-ink">Thanks, {student.name.split(' ')[0]}!</h3>
        <p className="mt-2 text-sm text-ink-soft">
          Request Super Admin ko bhej diya. Approve hone ke baad photos / edits is page pe dikhenge.
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false)
            setOpen(true)
          }}
          className="mt-4 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-mist"
        >
          Send another request
        </button>
      </div>
    )
  }

  return (
    <div
      id="edit-college"
      className="scroll-mt-24 rounded-lg border-2 border-sea/35 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(11,31,51,0.45)] md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-sea uppercase">
            Your campus
          </p>
          <h3 className="mt-1 font-display text-xl font-bold text-ink">Edit college</h3>
          <p className="mt-1 text-sm text-stone">
            Is card mein Edit dabao — photo upload ya details change request bhejo. Admin approve ke
            baad live hoga.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md bg-sea px-5 py-2.5 text-sm font-semibold text-white hover:bg-sea-deep"
        >
          {open ? 'Close' : 'Edit'}
        </button>
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-5 border-t border-line pt-5">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink">1. Campus photos upload</legend>
            <input
              type="file"
              accept="image/*"
              multiple
              className="block w-full text-sm text-stone file:mr-3 file:rounded-md file:border-0 file:bg-sea file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sea-deep"
              onChange={(e) => {
                void handleImageUpload(e.target.files)
                e.target.value = ''
              }}
            />
            {images.length > 0 ? (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((src, index) => (
                  <li key={`${index}-${src.slice(0, 24)}`} className="group relative">
                    <img
                      src={src}
                      alt=""
                      className="aspect-[4/3] w-full rounded-md object-cover ring-1 ring-line"
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 rounded bg-ink/80 px-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-stone">Abhi koi photo nahi — Choose files se add karo.</p>
            )}
          </fieldset>

          <div className="border-t border-line pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={showEdits}
                onChange={(e) => setShowEdits(e.target.checked)}
              />
              2. College details bhi edit karna hai (fees, location, branches…)
            </label>
          </div>

          {showEdits ? (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">About college</span>
                <textarea
                  className={`${inputClass} min-h-20 resize-y`}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Location / address</span>
                  <input
                    className={inputClass}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Principal name</span>
                  <input
                    className={inputClass}
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Type</span>
                  <select
                    className={inputClass}
                    value={type}
                    onChange={(e) => setType(e.target.value as College['type'])}
                  >
                    {(Object.keys(COLLEGE_TYPE_LABELS) as College['type'][]).map((key) => (
                      <option key={key} value={key}>
                        {COLLEGE_TYPE_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Admission status</span>
                  <select
                    className={inputClass}
                    value={admissionStatus}
                    onChange={(e) => setAdmissionStatus(e.target.value as College['admissionStatus'])}
                  >
                    {(Object.keys(ADMISSION_STATUS_LABELS) as College['admissionStatus'][]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {ADMISSION_STATUS_LABELS[key]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Fees (text)</span>
                <textarea
                  className={`${inputClass} min-h-20 resize-y`}
                  value={feesStructure}
                  onChange={(e) => setFeesStructure(e.target.value)}
                  placeholder="e.g. B.Tech ₹55,000 / year"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Branches (comma separated)
                </span>
                <input
                  className={inputClass}
                  value={branchesText}
                  onChange={(e) => setBranchesText(e.target.value)}
                  placeholder="CSE, Mechanical, Civil"
                />
              </label>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Note to admin (optional)</span>
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Updated main gate photos"
            />
          </label>

          {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Sending…' : 'Send for admin approval'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-outline">
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
