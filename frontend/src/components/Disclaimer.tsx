import { Link } from 'react-router'

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs ${className}`}>
      SWPS Hub is an unofficial project built by students. It is not affiliated with or endorsed by SWPS University.{' '}
      <Link to="/privacy" className="underline underline-offset-2 hover:text-indigo-600">
        Privacy Policy
      </Link>
    </p>
  )
}
