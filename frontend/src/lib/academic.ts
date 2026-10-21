import type { MaterialType, Term } from './types'

export const terms: Record<Term, string> = {
  WINTER: 'Winter',
  SUMMER: 'Summer',
  FULL_YEAR: 'Full year',
}

export const termOrder: Term[] = ['WINTER', 'SUMMER', 'FULL_YEAR']

export const studyYears = [1, 2, 3, 4, 5]

export const studyYearLabel = (year: number) => `Year ${year}`

/** The academic year a date belongs to, like the backend expects: October 2026 – September 2027 is "2026/27". */
export function academicYearOf(date: Date) {
  const startYear = date.getMonth() + 1 >= 10 ? date.getFullYear() : date.getFullYear() - 1
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`
}

/** The current academic year and the five before it, newest first. */
export function academicYearOptions(today = new Date()) {
  const current = Number(academicYearOf(today).slice(0, 4))
  return Array.from({ length: 6 }, (_, index) => {
    const startYear = current - index
    return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`
  })
}

export const materialTypes: Record<MaterialType, { label: string; plural: string; badge: string }> = {
  PAST_EXAM: { label: 'Past exam', plural: 'Past exams', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
  NOTES: { label: 'Notes', plural: 'Notes', badge: 'bg-sky-50 text-sky-700 ring-sky-600/20' },
  SUMMARY: { label: 'Summary', plural: 'Summaries', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  ASSIGNMENT: { label: 'Assignment', plural: 'Assignments', badge: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  OTHER: { label: 'Other', plural: 'Other', badge: 'bg-slate-100 text-slate-700 ring-slate-500/20' },
}

export const materialTypeOrder: MaterialType[] = ['PAST_EXAM', 'NOTES', 'SUMMARY', 'ASSIGNMENT', 'OTHER']

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
