import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

/** Counts of people are null when fewer than `minGroupSize` people are involved. */
export type Insights = {
  overview: {
    students: number | null
    courses: number
    materials: number
    upcomingAssessments: number
    aiGenerations: number
    flashcardReviews: number
  }
  programs: { slug: string; name: string; courses: number; materials: number; students: number | null }[]
  assessmentHeatmap: { weeks: string[]; rows: { slug: string; name: string; counts: number[] }[] }
  crunch: { studentsWithAssessments: number | null; studentsInCrunch: number | null; assessments: number; days: number }
  materialGaps: { code: string; name: string; program: string; members: number; materials: number }[]
  topMaterials: { title: string; type: string; courseCode: string; courseName: string; votes: number }[]
  unansweredQuestions: { code: string; name: string; unanswered: number }[]
  minGroupSize: number
}

export function useInsights() {
  return useQuery({ queryKey: ['insights'], queryFn: () => api<Insights>('/insights') })
}
