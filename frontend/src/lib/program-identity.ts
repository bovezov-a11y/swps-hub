import {
  Brain,
  Briefcase,
  Code2,
  Drama,
  GraduationCap,
  Languages,
  Lightbulb,
  Newspaper,
  Palette,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type ProgramIdentity = {
  icon: LucideIcon
  /** Gradient stops for `bg-linear-*` backgrounds. */
  gradient: string
  soft: string
}

const identities: Record<string, ProgramIdentity> = {
  psychology: { icon: Brain, gradient: 'from-violet-500 to-fuchsia-500', soft: 'bg-violet-50 text-violet-700' },
  'computer-science': { icon: Code2, gradient: 'from-sky-500 to-indigo-600', soft: 'bg-sky-50 text-sky-700' },
  'cognitive-science': { icon: Lightbulb, gradient: 'from-amber-400 to-orange-500', soft: 'bg-amber-50 text-amber-700' },
  law: { icon: Scale, gradient: 'from-slate-600 to-slate-900', soft: 'bg-slate-100 text-slate-700' },
  management: { icon: Briefcase, gradient: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50 text-emerald-700' },
  'english-studies': { icon: Languages, gradient: 'from-rose-500 to-pink-500', soft: 'bg-rose-50 text-rose-700' },
  design: { icon: Palette, gradient: 'from-pink-500 to-orange-400', soft: 'bg-pink-50 text-pink-700' },
  journalism: { icon: Newspaper, gradient: 'from-cyan-500 to-blue-600', soft: 'bg-cyan-50 text-cyan-700' },
  sociology: { icon: Users, gradient: 'from-lime-500 to-emerald-600', soft: 'bg-lime-50 text-lime-700' },
  'cultural-studies': { icon: Drama, gradient: 'from-purple-500 to-indigo-500', soft: 'bg-purple-50 text-purple-700' },
}

const fallback: ProgramIdentity = {
  icon: GraduationCap,
  gradient: 'from-indigo-500 to-violet-600',
  soft: 'bg-indigo-50 text-indigo-700',
}

/** Colour and icon that make each program recognisable across the app. */
export const programIdentity = (slug: string) => identities[slug] ?? fallback
