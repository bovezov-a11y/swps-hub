export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'white'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-glow focus-visible:outline-indigo-600',
  secondary:
    'bg-white text-slate-700 shadow-xs ring-1 ring-slate-300/80 ring-inset hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-slate-400',
  danger: 'bg-white text-red-600 shadow-xs ring-1 ring-red-200 ring-inset hover:bg-red-50 focus-visible:outline-red-500',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400',
  white: 'bg-white text-indigo-700 shadow-sm hover:bg-indigo-50 focus-visible:outline-white',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-3 py-1.5 text-sm',
  md: 'rounded-xl px-4 py-2.5 text-sm',
  lg: 'rounded-xl px-5 py-3 text-base',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className = '') {
  return `inline-flex items-center justify-center gap-2 font-semibold transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`
}
