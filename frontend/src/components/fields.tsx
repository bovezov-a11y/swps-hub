import { useId, type ComponentProps, type ReactNode } from 'react'

type FieldProps = {
  label: string
  error?: string
  hint?: string
}

type FieldShellProps = FieldProps & {
  id: string
  className?: string
  children: ReactNode
}

function FieldShell({ id, label, error, hint, className, children }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function controlProps(id: string, { error, hint }: FieldProps) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
    className: `block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm shadow-xs transition outline-none placeholder:text-slate-400 focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500 ${
      error
        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
    }`,
  }
}

export function TextField({ label, error, hint, id, className, ...props }: ComponentProps<'input'> & FieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} className={className}>
      <input {...controlProps(inputId, { label, error, hint })} {...props} />
    </FieldShell>
  )
}

export function SelectField({ label, error, hint, id, className, children, ...props }: ComponentProps<'select'> & FieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  return (
    <FieldShell id={selectId} label={label} error={error} hint={hint} className={className}>
      <select {...controlProps(selectId, { label, error, hint })} {...props}>
        {children}
      </select>
    </FieldShell>
  )
}

export function TextAreaField({ label, error, hint, id, className, ...props }: ComponentProps<'textarea'> & FieldProps) {
  const generatedId = useId()
  const textAreaId = id ?? generatedId
  return (
    <FieldShell id={textAreaId} label={label} error={error} hint={hint} className={className}>
      <textarea rows={4} {...controlProps(textAreaId, { label, error, hint })} {...props} />
    </FieldShell>
  )
}
