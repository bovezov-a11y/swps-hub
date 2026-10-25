import { Navigate, type RouteObject } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { AuthLayout } from './components/AuthLayout'
import { GuestOnly, RequireAuth, RequireRole } from './components/route-guards'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { VerifyEmailPage } from './features/auth/VerifyEmailPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { CourseDetailPage } from './features/courses/CourseDetailPage'
import { CourseFormPage } from './features/courses/CourseFormPage'
import { StudyPage } from './features/flashcards/StudyPage'
import { MyCoursesPage } from './features/courses/MyCoursesPage'
import { ExplorePage } from './features/programs/ExplorePage'
import { ProgramPage } from './features/programs/ProgramPage'
import { QuestionPage } from './features/qa/QuestionPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PrivacyPage } from './pages/PrivacyPage'

export const routes: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/verify-email', element: <VerifyEmailPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        // Pages only some students open are split into their own chunks.
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/explore', element: <ExplorePage /> },
          { path: '/programs/:slug', element: <ProgramPage /> },
          { path: '/my-courses', element: <MyCoursesPage /> },
          { path: '/courses', element: <Navigate to="/explore" replace /> },
          { path: '/courses/new', element: <CourseFormPage /> },
          { path: '/courses/:courseId', element: <CourseDetailPage /> },
          { path: '/courses/:courseId/edit', element: <CourseFormPage /> },
          { path: '/calendar', element: <CalendarPage /> },
          {
            path: '/wellbeing',
            lazy: () => import('./features/wellbeing/WellbeingPage').then((m) => ({ Component: m.WellbeingPage })),
          },
          { path: '/questions/:questionId', element: <QuestionPage /> },
          { path: '/decks/:deckId/study', element: <StudyPage /> },
          {
            element: <RequireRole roles={['MODERATOR', 'ADMIN']} />,
            children: [
              {
                path: '/moderation',
                lazy: () => import('./features/moderation/ModerationPage').then((m) => ({ Component: m.ModerationPage })),
              },
            ],
          },
          {
            element: <RequireRole roles={['ADMIN']} />,
            children: [
              { path: '/insights', lazy: () => import('./features/insights/InsightsPage').then((m) => ({ Component: m.InsightsPage })) },
            ],
          },
        ],
      },
    ],
  },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '*', element: <NotFoundPage /> },
]
