export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={inverted ? '#fff' : '#4f46e5'} />
        <path d="M9 11.5 16 8l7 3.5-7 3.5-7-3.5Z" fill={inverted ? '#4f46e5' : '#fff'} />
        <path
          d="M11 14.5v4.2c0 1.6 2.2 3.3 5 3.3s5-1.7 5-3.3v-4.2"
          fill="none"
          stroke={inverted ? '#4f46e5' : '#fff'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className={`text-lg font-semibold tracking-tight ${inverted ? 'text-white' : 'text-slate-900'}`}>
        Student Hub
      </span>
    </span>
  )
}
