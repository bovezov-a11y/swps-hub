import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '../../lib/api'

/** Shows backend validation errors next to their fields, and anything else as a form-level error. */
export function applyServerErrors<T extends FieldValues>(error: unknown, fields: Path<T>[], setError: UseFormSetError<T>) {
  if (error instanceof ApiError) {
    let matchedField = false
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      if (fields.includes(field as Path<T>)) {
        setError(field as Path<T>, { message })
        matchedField = true
      }
    }
    if (!matchedField) setError('root', { message: error.message })
    return
  }
  setError('root', { message: 'Could not reach the server. Check your connection and try again.' })
}
