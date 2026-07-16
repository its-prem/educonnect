import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type {
  AdmissionStatus,
  College,
  CollegeInput,
  CollegeType,
  FeeRow,
  Program,
  Stream,
} from '../../types/catalog'
import { ADMISSION_STATUS_LABELS, COLLEGE_TYPE_LABELS, formatFeeRows } from '../../types/catalog'
import { fileToImageDataUrl } from '../../utils/fileData'

const inputClass =
  'w-full rounded-md border border-line bg-white px-3 py-2.5 text-ink outline-none transition-colors focus:border-sea'

type CollegeListingFormProps = {
  programs: Program[]
  streams: Stream[]
  submitLabel: string
  onSubmit: (input: CollegeInput) => void | Promise<void>
  onCancel?: () => void
  defaultSubmittedBy?: CollegeInput['submittedBy']
  initialCollege?: College | null
  showAdmissionToggle?: boolean
}

function splitList(value: string, separator: RegExp | string = ',') {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseOtherPrograms(text: string) {
  return text
    .split(/\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function CollegeListingForm({
  programs,
  streams,
  submitLabel,
  onSubmit,
  onCancel,
  defaultSubmittedBy = 'student',
  initialCollege = null,
  showAdmissionToggle = false,
}: CollegeListingFormProps) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [location, setLocation] = useState('')
  const [principalName, setPrincipalName] = useState('')
  const [feeRows, setFeeRows] = useState<FeeRow[]>([])
  const [branchesText, setBranchesText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [about, setAbout] = useState('')
  const [type, setType] = useState<CollegeType>('private')
  const [programIds, setProgramIds] = useState<string[]>([])
  const [otherProgramsText, setOtherProgramsText] = useState('')
  const [admissionStatus, setAdmissionStatus] = useState<AdmissionStatus>('open')
  const [uploadError, setUploadError] = useState('')
  const [busy, setBusy] = useState(false)

  const customPrograms = useMemo(
    () => parseOtherPrograms(otherProgramsText),
    [otherProgramsText],
  )

  useEffect(() => {
    if (!initialCollege) {
      setName('')
      setCity('')
      setLocation('')
      setPrincipalName('')
      setFeeRows([])
      setBranchesText('')
      setImages([])
      setAbout('')
      setType('private')
      setProgramIds([])
      setOtherProgramsText('')
      setAdmissionStatus('open')
      setUploadError('')
      return
    }

    setName(initialCollege.name)
    setCity(initialCollege.city)
    setLocation(initialCollege.location)
    setPrincipalName(initialCollege.principalName)
    setFeeRows(
      initialCollege.feeRows?.length
        ? initialCollege.feeRows
        : initialCollege.feesStructure
          ? [{ programLabel: 'Fees', amount: initialCollege.feesStructure }]
          : [],
    )
    setBranchesText(initialCollege.branches.join(', '))
    setImages(initialCollege.images)
    setAbout(initialCollege.about)
    setType(initialCollege.type)
    setProgramIds(initialCollege.programIds)
    setOtherProgramsText((initialCollege.customPrograms ?? []).join('\n'))
    setAdmissionStatus(initialCollege.admissionStatus)
    setUploadError('')
  }, [initialCollege])

  const selectedProgramLabels = useMemo(() => {
    const fromCatalog = programs
      .filter((program) => programIds.includes(program.id))
      .map((program) => program.name)
    return [...fromCatalog, ...customPrograms]
  }, [programs, programIds, customPrograms])

  useEffect(() => {
    setFeeRows((prev) => {
      const next = selectedProgramLabels.map((label) => {
        const existing = prev.find(
          (row) => row.programLabel.toLowerCase() === label.toLowerCase(),
        )
        return { programLabel: label, amount: existing?.amount ?? '' }
      })
      const extras = prev.filter(
        (row) =>
          !selectedProgramLabels.some(
            (label) => label.toLowerCase() === row.programLabel.toLowerCase(),
          ) && row.amount.trim(),
      )
      return [...next, ...extras]
    })
  }, [selectedProgramLabels])

  function toggleProgram(id: string) {
    setProgramIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  function updateFeeAmount(programLabel: string, amount: string) {
    setFeeRows((prev) =>
      prev.map((row) => (row.programLabel === programLabel ? { ...row, amount } : row)),
    )
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return
    setUploadError('')
    setBusy(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        uploaded.push(await fileToImageDataUrl(file))
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Image upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (!name.trim() || !city.trim()) return
    if (programIds.length === 0 && customPrograms.length === 0) return

    const branches = splitList(branchesText, /,/)
    const cleanedFees = feeRows.filter((row) => row.programLabel.trim() && row.amount.trim())

    setBusy(true)
    setUploadError('')
    try {
      await onSubmit({
        name,
        city,
        location: location || city,
        principalName: principalName || 'To be updated',
        feesStructure: formatFeeRows(cleanedFees),
        feeRows: cleanedFees,
        courses: customPrograms,
        branches,
        images,
        type,
        programIds,
        customPrograms,
        about,
        submittedBy: defaultSubmittedBy,
        admissionStatus,
      })
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Submit failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (programs.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-white px-4 py-3 text-sm text-stone">
        No stream programs available yet. Super Admin must add streams/programs first.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">College name</span>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">City</span>
          <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Type</span>
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value as CollegeType)}
          >
            {(Object.keys(COLLEGE_TYPE_LABELS) as CollegeType[]).map((key) => (
              <option key={key} value={key}>
                {COLLEGE_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Full location / address</span>
        <input
          className={inputClass}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Street, area, city, state, PIN"
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

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Programs at this college</legend>
        <div className="space-y-3 rounded-md border border-line bg-white p-3">
          <div className="space-y-2">
            {programs.map((program) => {
              const streamName = streams.find((stream) => stream.id === program.streamId)?.name ?? ''
              return (
                <label
                  key={program.id}
                  className="flex items-center gap-2 border-b border-line/60 pb-2 text-sm text-ink last:border-0 last:pb-0"
                >
                  <input
                    type="checkbox"
                    checked={programIds.includes(program.id)}
                    onChange={() => toggleProgram(program.id)}
                  />
                  <span>
                    {program.name}
                    <span className="text-stone"> ({streamName})</span>
                  </span>
                </label>
              )
            })}
          </div>

          <label className="block border-t border-line pt-3">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Other programs (one per line)
            </span>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={otherProgramsText}
              onChange={(e) => setOtherProgramsText(e.target.value)}
              placeholder={'MBA\nNursing\nBBA'}
            />
            <span className="mt-1 block text-xs text-stone">
              Example: write MBA, press Enter, then Nursing on the next line.
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Fees structure (program-wise)</legend>
        <div className="space-y-2 rounded-md border border-line bg-white p-3">
          {feeRows.length === 0 ? (
            <p className="text-sm text-stone">Select or add programs to enter fees.</p>
          ) : (
            feeRows.map((row) => (
              <div
                key={row.programLabel}
                className="grid gap-2 border-b border-line/60 pb-2 last:border-0 last:pb-0 sm:grid-cols-[8rem_1fr] sm:items-center"
              >
                <span className="text-sm font-semibold text-ink">{row.programLabel}</span>
                <input
                  className={inputClass}
                  value={row.amount}
                  onChange={(e) => updateFeeAmount(row.programLabel, e.target.value)}
                  placeholder="e.g. ₹55,000 / year"
                  required={selectedProgramLabels.includes(row.programLabel)}
                />
              </div>
            ))
          )}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Branches (comma separated) — e.g. CSE, Mechanical, Civil
        </span>
        <input
          className={inputClass}
          value={branchesText}
          onChange={(e) => setBranchesText(e.target.value)}
          placeholder="CSE, Mechanical, Civil"
          required
        />
      </label>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Campus images</legend>
        <div className="rounded-md border border-line bg-white p-3">
          <label className="block">
            <span className="mb-1.5 block text-sm text-stone">
              Upload as many campus photos as you want — slider shows all
            </span>
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
          </label>

          {images.length > 0 ? (
            <>
              <p className="mt-3 text-xs font-medium text-stone">{images.length} photo(s) added</p>
              <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
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
            </>
          ) : (
            <p className="mt-2 text-xs text-stone">No images yet — keep uploading more anytime.</p>
          )}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">About college</span>
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />
      </label>

      {showAdmissionToggle ? (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Admission status</span>
          <select
            className={inputClass}
            value={admissionStatus}
            onChange={(e) => setAdmissionStatus(e.target.value as AdmissionStatus)}
          >
            {(Object.keys(ADMISSION_STATUS_LABELS) as AdmissionStatus[]).map((key) => (
              <option key={key} value={key}>
                {ADMISSION_STATUS_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {uploadError ? <p className="text-sm font-medium text-red-700">{uploadError}</p> : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Please wait…' : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
