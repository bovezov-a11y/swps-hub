export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-indigo-600',
  secondary:
    'bg-white text-slate-700 shadow-xs ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus-visible:outline-slate-400',
  danger: 'bg-white text-red-600 shadow-xs ring-1 ring-red-200 ring-inset hover:bg-red-50 focus-visible:outline-red-500',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'rounded-md px-3 py-1.5 text-sm',
  md: 'rounded-lg px-4 py-2.5 text-sm',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className = '') {
  return `inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`
}
