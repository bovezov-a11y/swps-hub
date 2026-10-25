import { ArrowBigUp, Download, ExternalLink, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatFileSize, materialTypes } from '../../lib/academic'
import { relativeDay } from '../../lib/dates'
import { fileKind } from '../../lib/file-kinds'
import type { Material } from '../../lib/types'
import { ReportButton } from '../moderation/ReportButton'
import { isPreviewable, openMaterial } from './open-material'

type MaterialCardProps = {
  material: Material
  onVote: (voted: boolean) => void
  onDelete: () => void
  /** Opens AI study tools; omitted when they are unavailable for this file. */
  onStudy?: () => void
}

export function MaterialCard({ material, onVote, onDelete, onStudy }: MaterialCardProps) {
  const [openError, setOpenError] = useState(false)
  const kind = fileKind(material.fileName)
  const { label, badge } = materialTypes[material.type]
  const preview = isPreviewable(material)
  const OpenIcon = preview ? ExternalLink : Download

  const open = async () => {
    setOpenError(false)
    try {
      await openMaterial(material)
    } catch {
      setOpenError(true)
    }
  }

  return (
    <li className="card group flex gap-4 p-4 transition duration-200 hover:border-indigo-200 hover:shadow-card-hover sm:p-5">
      <button
        type="button"
        onClick={open}
        aria-label={`${preview ? 'Open' : 'Download'} ${material.fileName}`}
        className={`hidden size-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl ring-1 transition hover:scale-105 sm:flex ${kind.classes}`}
      >
        <kind.icon className="size-6" aria-hidden="true" />
        <span className="text-[10px] font-bold tracking-wide uppercase">{kind.label}</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${badge}`}>{label}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {material.academicYear}
          </span>
          {material.hidden && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset">
              Hidden by moderators
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-semibold text-slate-900">{material.title}</h3>
        {material.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{material.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>
            Shared by{' '}
            <span className="font-medium text-slate-700">
              {material.mine ? 'you' : (material.uploader?.displayName ?? 'a student')}
            </span>{' '}
            ·{' '}
            {relativeDay(material.createdAt).toLowerCase()}
          </span>
          <button
            type="button"
            onClick={open}
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-500"
          >
            <OpenIcon className="size-3.5" aria-hidden="true" />
            {preview ? 'Open' : 'Download'}
            <span className="font-normal text-slate-400">· {formatFileSize(material.fileSize)}</span>
          </button>
          {onStudy && (
            <button
              type="button"
              onClick={onStudy}
              className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 px-2.5 py-1 font-semibold text-white shadow-sm transition hover:shadow-glow"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              Summary, quiz &amp; cards
            </button>
          )}
          {!material.mine && <ReportButton type="MATERIAL" id={material.id} label={material.title} />}
          {material.canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 font-medium text-slate-400 transition hover:text-red-600"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
        {openError && <p className="mt-2 text-sm text-red-600">Could not open the file. Please try again.</p>}
      </div>

      <button
        type="button"
        onClick={() => onVote(!material.voted)}
        aria-pressed={material.voted}
        aria-label={material.voted ? `Remove your upvote from ${material.title}` : `Upvote ${material.title}`}
        className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-bold transition active:scale-95 ${
          material.voted
            ? 'bg-indigo-600 text-white shadow-glow'
            : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:ring-indigo-200'
        }`}
      >
        <ArrowBigUp className={`size-6 ${material.voted ? 'fill-current' : ''}`} aria-hidden="true" />
        <span className="tabular-nums">{material.voteCount}</span>
      </button>
    </li>
  )
}
