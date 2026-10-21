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

export type CourseSummary = {
  id: string
  code: string
  name: string
  semester: string
  lecturer: string | null
  memberCount: number
  enrolled: boolean
}

export type CourseDetail = CourseSummary & {
  description: string | null
  canEdit: boolean
  createdAt: string
}

export type EventType = 'LECTURE' | 'CLASS' | 'LAB' | 'EXAM' | 'DEADLINE' | 'OTHER'

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
