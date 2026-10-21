import { programIdentity } from '../lib/program-identity'

const sizes = {
  sm: { box: 'size-9 rounded-lg', icon: 'size-4.5' },
  md: { box: 'size-12 rounded-xl', icon: 'size-6' },
  lg: { box: 'size-16 rounded-2xl', icon: 'size-8' },
}

export function ProgramIcon({ slug, size = 'md', className = '' }: { slug: string; size?: keyof typeof sizes; className?: string }) {
  const { icon: Icon, gradient } = programIdentity(slug)
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-linear-to-br text-white shadow-sm ${gradient} ${sizes[size].box} ${className}`}
    >
      <Icon className={sizes[size].icon} strokeWidth={2} />
    </span>
  )
}
