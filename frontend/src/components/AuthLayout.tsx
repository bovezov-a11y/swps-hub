import { ArrowBigUp, CalendarClock, FileText, Library, RefreshCw } from 'lucide-react'
import { Outlet } from 'react-router'
import { Disclaimer } from './Disclaimer'
import { Logo } from './Logo'

const highlights = [
  { icon: Library, title: 'Past exams & notes', text: 'For every course in every program, shared by students.' },
  { icon: CalendarClock, title: 'Never miss an exam', text: 'Your lectures, exams and deadlines in one calendar.' },
  { icon: RefreshCw, title: 'Synced everywhere', text: 'Subscribe in Google, Apple or Outlook Calendar.' },
]

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-indigo-950 p-12 text-white lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-24 size-[32rem] rounded-full bg-indigo-500/40 blur-3xl" />
          <div className="absolute top-1/3 -left-40 size-[26rem] rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div className="absolute -bottom-32 right-10 size-[22rem] rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:22px_22px]" />
        </div>

        <Logo inverted />

        <div className="relative">
          <h1 className="max-w-md text-4xl leading-tight font-semibold tracking-tight text-balance">
            Study smarter with everything your seniors left behind.
          </h1>
          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                  <Icon className="size-5 text-indigo-200" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-indigo-200">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <PreviewCard />
        </div>

        <div className="relative text-indigo-300">
          <p className="text-sm">Built by students, for students.</p>
          <Disclaimer className="mt-1 text-indigo-300/70" />
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-[radial-gradient(40rem_24rem_at_50%_0%,rgb(99_102_241/0.08),transparent)] px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <Outlet />
          <Disclaimer className="mt-12 text-center text-slate-400 lg:hidden" />
        </div>
      </main>
    </div>
  )
}

/** A sample of what students find inside, so the value is clear before signing up. */
function PreviewCard() {
  return (
    <div aria-hidden="true" className="mt-12 max-w-sm -rotate-1 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl shadow-indigo-950/50">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Final exam 2025/26 · Group A</p>
          <p className="text-xs text-slate-500">Statistics in Psychology · Year 2</p>
        </div>
        <span className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white">
          <ArrowBigUp className="size-3.5" />
          48
        </span>
      </div>
    </div>
  )
}
