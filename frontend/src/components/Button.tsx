import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import { buttonClass, type ButtonSize, type ButtonVariant } from './button-styles'
import { Spinner } from './Spinner'

type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant,
  size,
  isLoading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ComponentProps<'button'> & StyleProps & { isLoading?: boolean }) {
  return (
    <button type={type} disabled={disabled || isLoading} className={buttonClass(variant, size, className)} {...props}>
      {isLoading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}

export function LinkButton({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}
