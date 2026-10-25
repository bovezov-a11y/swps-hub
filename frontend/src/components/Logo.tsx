/** Wordmark: "SWPS" with a small "hub" tucked into the bottom-right corner. Our own design, not the university's logo. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-end select-none" aria-label="SWPS Hub">
      <span
        aria-hidden="true"
        className={`text-[1.45rem] leading-none font-black tracking-[-0.045em] ${inverted ? 'text-white' : 'text-slate-900'}`}
      >
        SWPS
      </span>
      <span
        aria-hidden="true"
        className={`mb-px ml-0.5 rounded-md px-1 py-px text-[10px] leading-none font-bold tracking-wide lowercase ${
          inverted ? 'bg-white text-indigo-700' : 'bg-linear-to-r from-indigo-600 to-violet-500 text-white'
        }`}
      >
        hub
      </span>
    </span>
  )
}
