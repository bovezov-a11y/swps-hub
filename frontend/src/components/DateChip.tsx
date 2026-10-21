const month = new Intl.DateTimeFormat('en-GB', { month: 'short' })

/** A tiny calendar page showing the month and day of a date. */
export function DateChip({ iso, accent = 'bg-indigo-500' }: { iso: string; accent?: string }) {
  const date = new Date(iso)
  return (
    <span
      aria-hidden="true"
      className="flex w-12 shrink-0 flex-col overflow-hidden rounded-xl bg-white text-center shadow-xs ring-1 ring-slate-200"
    >
      <span className={`py-0.5 text-[10px] font-bold tracking-wide text-white uppercase ${accent}`}>
        {month.format(date)}
      </span>
      <span className="py-1 text-lg leading-tight font-semibold text-slate-900 tabular-nums">{date.getDate()}</span>
    </span>
  )
}
