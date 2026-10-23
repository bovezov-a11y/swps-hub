import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

type DialogProps = {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

/** Modal built on the native <dialog>, which handles focus trapping, Escape and the backdrop for us. */
export function Dialog({ title, description, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    // Environments without modal dialogs (older browsers, jsdom) still get a visible, non-modal one.
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    return () => (typeof dialog.close === 'function' ? dialog.close() : dialog.removeAttribute('open'))
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className="m-auto max-h-[90vh] w-[min(42rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <h2 id="dialog-title" className="truncate font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 truncate text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </dialog>
  )
}
