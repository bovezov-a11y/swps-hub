import { FileArchive, FileImage, FileSpreadsheet, FileText, File as FileIcon, Presentation, type LucideIcon } from 'lucide-react'

type FileKind = { icon: LucideIcon; label: string; classes: string }

const kinds: Record<string, FileKind> = {
  pdf: { icon: FileText, label: 'PDF', classes: 'bg-rose-50 text-rose-600 ring-rose-100' },
  doc: { icon: FileText, label: 'Word', classes: 'bg-blue-50 text-blue-600 ring-blue-100' },
  docx: { icon: FileText, label: 'Word', classes: 'bg-blue-50 text-blue-600 ring-blue-100' },
  ppt: { icon: Presentation, label: 'Slides', classes: 'bg-orange-50 text-orange-600 ring-orange-100' },
  pptx: { icon: Presentation, label: 'Slides', classes: 'bg-orange-50 text-orange-600 ring-orange-100' },
  xls: { icon: FileSpreadsheet, label: 'Excel', classes: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  xlsx: { icon: FileSpreadsheet, label: 'Excel', classes: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  png: { icon: FileImage, label: 'Image', classes: 'bg-violet-50 text-violet-600 ring-violet-100' },
  jpg: { icon: FileImage, label: 'Image', classes: 'bg-violet-50 text-violet-600 ring-violet-100' },
  jpeg: { icon: FileImage, label: 'Image', classes: 'bg-violet-50 text-violet-600 ring-violet-100' },
  webp: { icon: FileImage, label: 'Image', classes: 'bg-violet-50 text-violet-600 ring-violet-100' },
  zip: { icon: FileArchive, label: 'ZIP', classes: 'bg-amber-50 text-amber-700 ring-amber-100' },
}

const other: FileKind = { icon: FileIcon, label: 'File', classes: 'bg-slate-100 text-slate-600 ring-slate-200' }

export const fileKind = (fileName: string) => kinds[fileName.split('.').pop()?.toLowerCase() ?? ''] ?? other
