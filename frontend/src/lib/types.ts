export type Role = 'STUDENT' | 'MODERATOR' | 'ADMIN'

export type User = {
  id: string
  email: string
  displayName: string
  role: Role
  createdAt: string
}

export type AuthResponse = {
  token: string
  expiresAt: string
  user: User
}

export type Page<T> = {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export type ProgramRef = { id: string; slug: string; name: string }

export type Program = ProgramRef & { courseCount: number }

export type Term = 'WINTER' | 'SUMMER' | 'FULL_YEAR'

export type CourseSummary = {
  id: string
  code: string
  name: string
  program: ProgramRef
  studyYear: number
  term: Term
  lecturer: string | null
  memberCount: number
  materialCount: number
  enrolled: boolean
}

export type CourseDetail = CourseSummary & {
  description: string | null
  canEdit: boolean
  createdAt: string
}

/** STUDY marks a student's own study session; course events never use it. */
export type EventType = 'LECTURE' | 'CLASS' | 'LAB' | 'EXAM' | 'DEADLINE' | 'OTHER' | 'STUDY'

export type CourseEvent = {
  id: string
  courseId: string
  type: EventType
  title: string
  startsAt: string
  endsAt: string
  location: string | null
  canDelete: boolean
}

export type CalendarEvent = {
  id: string
  type: EventType
  title: string
  startsAt: string
  endsAt: string
  location: string | null
  course: { id: string; code: string; name: string }
}

export type MaterialType = 'PAST_EXAM' | 'NOTES' | 'SUMMARY' | 'ASSIGNMENT' | 'OTHER'

export type Material = {
  id: string
  course: { id: string; code: string; name: string }
  type: MaterialType
  title: string
  description: string | null
  academicYear: string
  fileName: string
  contentType: string
  fileSize: number
  voteCount: number
  voted: boolean
  /** Null when the uploader stays anonymous to the viewer, which is the default for other people's files. */
  uploader: { displayName: string } | null
  mine: boolean
  /** Hidden by moderators; only the uploader and moderators see it. */
  hidden: boolean
  createdAt: string
  canDelete: boolean
}

export type ContentType = 'MATERIAL' | 'QUESTION' | 'ANSWER'

export type ReportReason = 'COPYRIGHT' | 'INAPPROPRIATE' | 'WRONG_COURSE' | 'SPAM' | 'OTHER'
