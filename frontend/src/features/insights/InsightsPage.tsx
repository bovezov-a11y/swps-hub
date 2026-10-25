import { BarChart3, BookOpen, CalendarClock, FileText, Layers, Lock, MessageCircleQuestion, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { ErrorState } from '../../components/EmptyState'
import { ProgramIcon } from '../../components/ProgramIcon'
import { Skeleton } from '../../components/Skeleton'
import { materialTypes } from '../../lib/academic'
import { HeatLegend } from '../../components/HeatLegend'
import { heatClass } from '../../lib/heat'
import type { MaterialType } from '../../lib/types'
import { useInsights, type Insights } from './api'

const weekLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

/** University dashboard: aggregate, anonymous figures only. */
export function InsightsPage() {
  const insights = useInsights()

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <BarChart3 className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">University insights</h1>
            <p className="mt-1 max-w-2xl text-slate-600">
              How students use SWPS Hub and where they may need support.
            </p>
          </div>
        </div>
        <p className="inline-flex max-w-sm items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-600/20">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Anonymous by design: no individual is shown, and any count of fewer than{' '}
          {insights.data?.minGroupSize ?? 5} people appears as “&lt;{insights.data?.minGroupSize ?? 5}”.
        </p>
      </div>

      {insights.isPending ? (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : insights.isError ? (
        <div className="mt-8">
          <ErrorState text="Could not load insights." />
        </div>
      ) : (
        <Dashboard data={insights.data} />
      )}
    </>
  )
}

function Dashboard({ data }: { data: Insights }) {
  const people = (value: number | null) => (value === null ? `<${data.minGroupSize}` : value.toLocaleString('en-GB'))
  const tiles: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Users, label: 'Verified students', value: people(data.overview.students) },
    { icon: BookOpen, label: 'Courses', value: data.overview.courses.toLocaleString('en-GB') },
    { icon: FileText, label: 'Shared files', value: data.overview.materials.toLocaleString('en-GB') },
    { icon: CalendarClock, label: 'Exams & deadlines, next 30 days', value: data.overview.upcomingAssessments.toLocaleString('en-GB') },
    { icon: Layers, label: 'Flashcard reviews, last 30 days', value: data.overview.flashcardReviews.toLocaleString('en-GB') },
    { icon: Sparkles, label: 'AI study aids, last 30 days', value: data.overview.aiGenerations.toLocaleString('en-GB') },
  ]

  return (
    <>
      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-5">
            <Icon className="size-5 text-indigo-500" aria-hidden="true" />
            <dd className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</dd>
            <dt className="mt-1 text-sm text-slate-500">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="card p-6">
          <h2 className="font-semibold">Exam pressure by program</h2>
          <p className="mt-1 text-sm text-slate-500">Exams and deadlines per week over the next 12 weeks.</p>
          <ProgramHeatmap heatmap={data.assessmentHeatmap} />
        </section>

        <section className="card flex flex-col p-6">
          <h2 className="font-semibold">Students in a crunch</h2>
          <p className="mt-1 text-sm text-slate-500">
            {data.crunch.assessments}+ exams or deadlines within {data.crunch.days} days, in the next 30 days.
          </p>
          <p className="mt-6 text-5xl font-semibold tracking-tight text-indigo-700 tabular-nums">
            {people(data.crunch.studentsInCrunch)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            out of {people(data.crunch.studentsWithAssessments)} students with an upcoming exam or deadline.
          </p>
          <p className="mt-auto pt-6 text-xs text-slate-500">
            Worth a reminder about study support and counselling before these weeks.
          </p>
        </section>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="font-semibold">Programs</h2>
        <ProgramTable data={data} people={people} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RankedList
          icon={FileText}
          title="Busy courses with few materials"
          hint="Where lecturers could share more."
          empty="No course has enough members yet."
          items={data.materialGaps.map((gap) => ({
            key: gap.code,
            title: gap.name,
            meta: `${gap.code} · ${gap.program}`,
            value: `${gap.materials} files · ${gap.members} students`,
          }))}
        />
        <RankedList
          icon={MessageCircleQuestion}
          title="Unanswered questions"
          hint="Courses where students are stuck."
          empty="Every question has an answer."
          items={data.unansweredQuestions.map((course) => ({
            key: course.code,
            title: course.name,
            meta: course.code,
            value: `${course.unanswered} open`,
          }))}
        />
        <RankedList
          icon={Sparkles}
          title="Most helpful materials"
          hint="By student upvotes."
          empty="No upvoted materials yet."
          items={data.topMaterials.map((material) => ({
            key: `${material.courseCode}-${material.title}`,
            title: material.title,
            meta: `${material.courseCode} · ${materialTypes[material.type as MaterialType]?.label ?? material.type}`,
            value: `${material.votes} ▲`,
          }))}
        />
      </div>
    </>
  )
}

function ProgramHeatmap({ heatmap }: { heatmap: Insights['assessmentHeatmap'] }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              Program
            </th>
            {heatmap.weeks.map((week) => (
              <th key={week} scope="col" className="px-0.5 pb-1 text-center font-medium whitespace-nowrap text-slate-500">
                {weekLabel.format(new Date(week))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmap.rows.map((row) => (
            <tr key={row.slug}>
              <th scope="row" className="pr-2 text-left font-medium whitespace-nowrap text-slate-700">
                {row.name}
              </th>
              {row.counts.map((count, index) => {
                const label = `${row.name}, week of ${weekLabel.format(new Date(heatmap.weeks[index]!))}: ${count} ${
                  count === 1 ? 'exam or deadline' : 'exams and deadlines'
                }`
                return (
                  <td key={heatmap.weeks[index]} className="p-0">
                    <div
                      title={label}
                      aria-label={label}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-md font-semibold tabular-nums ${heatClass(count)}`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <HeatLegend />
    </div>
  )
}

function ProgramTable({ data, people }: { data: Insights; people: (value: number | null) => string }) {
  const maxMaterials = Math.max(1, ...data.programs.map((program) => program.materials))
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th scope="col" className="py-2 font-medium">Program</th>
            <th scope="col" className="py-2 text-right font-medium">Courses</th>
            <th scope="col" className="py-2 text-right font-medium">Students</th>
            <th scope="col" className="w-1/3 py-2 pl-6 font-medium">Shared files</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.programs.map((program) => (
            <tr key={program.slug}>
              <td className="py-2.5">
                <span className="flex items-center gap-3">
                  <ProgramIcon slug={program.slug} size="sm" />
                  <span className="font-medium">{program.name}</span>
                </span>
              </td>
              <td className="py-2.5 text-right tabular-nums">{program.courses}</td>
              <td className="py-2.5 text-right tabular-nums">{people(program.students)}</td>
              <td className="py-2.5 pl-6">
                <span className="flex items-center gap-2">
                  <span className="h-2 flex-1 rounded-full bg-slate-100">
                    <span
                      className="block h-2 rounded-full bg-indigo-500"
                      style={{ width: `${(program.materials / maxMaterials) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right tabular-nums">{program.materials}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type RankedItem = { key: string; title: string; meta: string; value: string }

function RankedList({ icon: Icon, title, hint, empty, items }: { icon: LucideIcon; title: string; hint: string; empty: string; items: RankedItem[] }) {
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon className="size-4.5 text-indigo-500" aria-hidden="true" />
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{empty}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => (
            <li key={item.key} className="flex items-start gap-3 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.title}</span>
                <span className="block truncate text-xs text-slate-500">{item.meta}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-slate-700 tabular-nums">{item.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
