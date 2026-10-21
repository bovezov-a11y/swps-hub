import { useState } from 'react'
import { formatFileSize, materialTypes } from '../../lib/academic'
import { relativeDay } from '../../lib/dates'
import type { Material } from '../../lib/types'
import { isPreviewable, openMaterial } from './open-material'

type MaterialCardProps = {
  material: Material
  onVote: (voted: boolean) => void
  onDelete: () => void
}

export function MaterialCard({ material, onVote, onDelete }: MaterialCardProps) {
  const [openError, setOpenError] = useState(false)
  const extension = material.fileName.split('.').pop()?.toUpperCase().slice(0, 4) ?? 'FILE'
  const { label, badge } = materialTypes[material.type]

  const open = async () => {
    setOpenError(false)
    try {
      await openMaterial(material)
    } catch {
      setOpenError(true)
    }
  }

  return (
    <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      <button
        type="button"
        onClick={() => onVote(!material.voted)}
        aria-pressed={material.voted}
        aria-label={material.voted ? `Remove your upvote from ${material.title}` : `Upvote ${material.title}`}
        className={`flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-semibold ring-1 transition ${
          material.voted
            ? 'bg-indigo-600 text-white ring-indigo-600'
            : 'bg-white text-slate-600 ring-slate-200 hover:text-indigo-600 hover:ring-indigo-300'
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
          <path d="M10 4 3.5 11h4v5h5v-5h4L10 4Z" />
        </svg>
        <span className="tabular-nums">{material.voteCount}</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{material.title}</h3>
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge}`}>{label}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {material.academicYear}
          </span>
        </div>
        {material.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{material.description}</p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Shared by {material.uploader.displayName} · {relativeDay(material.createdAt).toLowerCase()}
        </p>
        {openError && <p className="mt-2 text-sm text-red-600">Could not open the file. Please try again.</p>}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <button
          type="button"
          onClick={open}
          className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 font-mono text-[10px] font-bold text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">
            {extension}
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold text-indigo-600">
              {isPreviewable(material) ? 'Open' : 'Download'}
            </span>
            <span className="block text-xs text-slate-500">{formatFileSize(material.fileSize)}</span>
          </span>
        </button>
        {material.canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-medium text-slate-400 transition hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </li>
  )
}
