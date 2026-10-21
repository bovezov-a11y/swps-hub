import { FolderOpen, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  text: string
  action?: ReactNode
  icon?: LucideIcon
}

export function EmptyState({ title, text, action, icon: Icon = FolderOpen }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-600">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({ text = 'Something went wrong while loading this page.' }: { text?: string }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-700"
    >
      <TriangleAlert className="size-5 shrink-0" aria-hidden="true" />
      {text}
    </div>
  )
}
