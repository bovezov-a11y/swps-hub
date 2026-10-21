import type { RouteObject } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { AuthLayout } from './components/AuthLayout'
import { GuestOnly, RequireAuth } from './components/route-guards'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { CourseDetailPage } from './features/courses/CourseDetailPage'
import { CourseFormPage } from './features/courses/CourseFormPage'
import { CoursesPage } from './features/courses/CoursesPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/courses', element: <CoursesPage /> },
          { path: '/courses/new', element: <CourseFormPage /> },
          { path: '/courses/:courseId', element: <CourseDetailPage /> },
          { path: '/courses/:courseId/edit', element: <CourseFormPage /> },
          { path: '/calendar', element: <CalendarPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
