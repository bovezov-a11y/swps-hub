import { CalendarPlus, FileText, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { FormAlert } from '../../components/FormAlert'
import { Spinner } from '../../components/Spinner'
import { useReadSyllabus, type SyllabusItem } from '../ai/api'
import { useCreateEvents } from './api'

type Row = {
  include: boolean
  title: string
  type: SyllabusItem['type']
  date: string
  time: string
  item: SyllabusItem
}

const toRow = (item: SyllabusItem): Row => ({
  // Only items with an exact date are ticked; the student adds dates for the rest if they know them.
  include: item.date !== null,
  title: item.title,
  type: item.type,
  date: item.date ?? '',
  time: item.time?.slice(0, 5) ?? (item.type === 'EXAM' ? '09:00' : '23:59'),
  item,
})

const EXAM_LENGTH_MS = 2 * 60 * 60 * 1000

/** Reads exams and deadlines out of a syllabus with AI, lets the student check them, then adds them to the course. */
export function SyllabusImport({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const read = useReadSyllabus(courseId)
  const create = useCreateEvents(courseId)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [added, setAdded] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const chosen = rows?.filter((row) => row.include && row.date && row.title.trim()) ?? []
  const update = (index: number, change: Partial<Row>) =>
    setRows((current) => current!.map((row, position) => (position === index ? { ...row, ...change } : row)))

  const pickFile = (file: File | undefined) => {
    if (!file) return
    read.mutate(file, { onSuccess: (result) => setRows(result.items.map(toRow)) })
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setSaveError(null)
    let count = 0
    try {
      for (const row of chosen) {
        const startsAt = new Date(`${row.date}T${row.time || '09:00'}`)
        const endsAt = row.type === 'EXAM' ? new Date(startsAt.getTime() + EXAM_LENGTH_MS) : startsAt
        await create.mutateAsync({
          type: row.type,
          title: row.title.trim(),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          location: null,
          repeatWeeks: null,
        })
        count++
      }
      setAdded(count)
    } catch (error) {
      setSaveError(`Added ${count} of ${chosen.length}. ${error instanceof Error ? error.message : ''}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title="Import dates from the syllabus"
      description="AI reads the exams and deadlines; you check them before anything is added."
      onClose={onClose}
    >
      {added !== null ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CalendarPlus className="size-10 text-emerald-600" aria-hidden="true" />
          <p className="font-semibold text-slate-900">
            Added {added} {added === 1 ? 'date' : 'dates'} to the course schedule
          </p>
          <p className="max-w-sm text-sm text-slate-500">Everyone in the course now sees them in their calendar.</p>
          <Button className="mt-2" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : read.isPending ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center" role="status">
          <Spinner className="size-8 text-indigo-600" />
          <p className="font-medium text-slate-900">Reading the syllabus…</p>
          <p className="text-sm text-slate-500">This can take up to a minute.</p>
        </div>
      ) : rows === null ? (
        <div className="space-y-4">
          {read.isError && <FormAlert message={read.error.message} />}
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
            <FileText className="size-8 text-indigo-500" aria-hidden="true" />
            <span className="font-semibold text-slate-900">Choose the syllabus</span>
            <span className="text-sm text-slate-500">PDF, image or text file, up to 20 MB. The file is not stored.</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
              className="sr-only"
              aria-label="Syllabus file"
              onChange={(event) => pickFile(event.target.files?.[0])}
            />
          </label>
        </div>
      ) : rows.length === 0 ? (
        <div className="space-y-4 py-6 text-center">
          <p className="font-medium text-slate-900">No exams or deadlines found in this file.</p>
          <Button variant="secondary" onClick={() => setRows(null)}>
            Try another file
          </Button>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-4">
          {saveError && <FormAlert message={saveError} />}
          {read.data?.gradingSummary && (
            <p className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              <span className="font-semibold">Grading: </span>
              {read.data.gradingSummary}
            </p>
          )}
          <ul className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {rows.map((row, index) => (
              <li
                key={index}
                className={`rounded-xl p-3 ring-1 ${row.include ? 'bg-white ring-indigo-200' : 'bg-slate-50 ring-slate-200'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(event) => update(index, { include: event.target.checked })}
                    aria-label={`Add ${row.title}`}
                    className="mt-2.5 size-4 accent-indigo-600"
                  />
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                    <input
                      value={row.title}
                      onChange={(event) => update(index, { title: event.target.value })}
                      aria-label="Title"
                      maxLength={200}
                      className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                    <select
                      value={row.type}
                      onChange={(event) => update(index, { type: event.target.value as Row['type'] })}
                      aria-label={`Type of ${row.title}`}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="EXAM">Exam</option>
                      <option value="DEADLINE">Deadline</option>
                    </select>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(event) =>
                        update(index, { date: event.target.value, include: Boolean(event.target.value) || row.include })
                      }
                      aria-label={`Date of ${row.title}`}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                    <input
                      type="time"
                      value={row.time}
                      onChange={(event) => update(index, { time: event.target.value })}
                      aria-label={`Time of ${row.title}`}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <p className="mt-1.5 pl-7 text-xs text-slate-500">
                  {row.item.weightPercent !== null && `${row.item.weightPercent}% of the grade`}
                  {row.item.weightPercent !== null && (row.item.timing || !row.date) && ' · '}
                  {!row.date &&
                    (row.item.timing
                      ? `Syllabus says: ${row.item.timing}. Add the date to include it.`
                      : 'No date in the syllabus. Add it to include it.')}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Sparkles className="size-3.5 text-indigo-500" aria-hidden="true" />
              Check each date against the syllabus. AI can make mistakes.
            </span>
            <Button type="submit" isLoading={saving} disabled={chosen.length === 0}>
              <CalendarPlus className="size-4" aria-hidden="true" />
              Add {chosen.length} to the schedule
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
