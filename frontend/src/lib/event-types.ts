import type { EventType } from './types'

export const eventTypes: Record<EventType, { label: string; badge: string; accent: string }> = {
  LECTURE: { label: 'Lecture', badge: 'bg-sky-50 text-sky-700 ring-sky-600/20', accent: 'bg-sky-500' },
  CLASS: { label: 'Class', badge: 'bg-violet-50 text-violet-700 ring-violet-600/20', accent: 'bg-violet-500' },
  LAB: { label: 'Lab', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', accent: 'bg-emerald-500' },
  EXAM: { label: 'Exam', badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', accent: 'bg-rose-500' },
  DEADLINE: { label: 'Deadline', badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', accent: 'bg-amber-500' },
  OTHER: { label: 'Other', badge: 'bg-slate-100 text-slate-700 ring-slate-500/20', accent: 'bg-slate-400' },
}

export const eventTypeOrder: EventType[] = ['LECTURE', 'CLASS', 'LAB', 'EXAM', 'DEADLINE', 'OTHER']

export const isAssessment = (type: EventType) => type === 'EXAM' || type === 'DEADLINE'
