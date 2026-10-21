import type { ReactNode } from 'react'

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-600">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ text = 'Something went wrong while loading this page.' }: { text?: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
      {text}
    </div>
  )
}
