/** Wordmark: "SWPS" with a small "hub" tucked into the bottom-right corner. Our own design, not the university's logo. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-end select-none" aria-label="SWPS Hub">
      <span
        aria-hidden="true"
        className={`text-[1.65rem] leading-none font-black tracking-[-0.04em] ${inverted ? 'text-white' : 'text-indigo-700'}`}
      >
        SWPS
      </span>
      <span
        aria-hidden="true"
        className={`mb-[1px] ml-0.5 rounded px-1 py-px text-[10px] leading-none font-bold tracking-wide lowercase ${
          inverted ? 'bg-white/15 text-indigo-100' : 'bg-indigo-100 text-indigo-600'
        }`}
      >
        hub
      </span>
    </span>
  )
}
