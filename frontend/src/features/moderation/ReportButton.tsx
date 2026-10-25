import { Flag } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { TextAreaField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { ApiError } from '../../lib/api'
import type { ContentType, ReportReason } from '../../lib/types'
import { reportReasons, useReport } from './api'

/** Small "Report" link that opens a dialog. Reports are anonymous: moderators never see who sent them. */
export function ReportButton({ type, id, label }: { type: ContentType; id: string; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Report ${label}`}
        className="inline-flex items-center gap-1 font-medium text-slate-400 transition hover:text-amber-600"
      >
        <Flag className="size-3.5" aria-hidden="true" />
        Report
      </button>
      {open && <ReportDialog type={type} id={id} label={label} onClose={() => setOpen(false)} />}
    </>
  )
}

function ReportDialog({ type, id, label, onClose }: { type: ContentType; id: string; label: string; onClose: () => void }) {
  const report = useReport()
  const [reason, setReason] = useState<ReportReason>('INAPPROPRIATE')
  const [details, setDetails] = useState('')

  const submit = () => report.mutate({ targetType: type, targetId: id, reason, details })
  const alreadyReported = report.error instanceof ApiError && report.error.status === 409

  return (
    <Dialog title="Report content" description={label} onClose={onClose}>
      {report.isSuccess || alreadyReported ? (
        <div className="py-6 text-center">
          <p className="font-semibold text-slate-900">
            {alreadyReported ? 'You already reported this' : 'Thanks, moderators will take a look'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Your report is anonymous. Content reported by several students is hidden until it is reviewed.
          </p>
          <Button variant="secondary" className="mt-6" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {report.isError && <FormAlert message={report.error.message} />}
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">What is wrong with it?</legend>
            <div className="mt-2 space-y-2">
              {(Object.keys(reportReasons) as ReportReason[]).map((value) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm ring-1 transition ${
                    reason === value ? 'bg-indigo-50 ring-indigo-300' : 'ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="accent-indigo-600"
                  />
                  {reportReasons[value]}
                </label>
              ))}
            </div>
          </fieldset>
          <TextAreaField
            label="Details (optional)"
            rows={3}
            maxLength={1000}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Anything that helps moderators decide"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} isLoading={report.isPending}>
              Send report
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
