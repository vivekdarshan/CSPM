import { type ConnectionCheck, type ConnectionCheckStatus } from '@/types/cspm'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Loader2,
  MinusCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CHECK_META: Record<
  ConnectionCheckStatus,
  { icon: React.ElementType; className: string; label: string }
> = {
  pass: { icon: CheckCircle2, className: 'text-success', label: 'Passed' },
  fail: { icon: XCircle, className: 'text-destructive', label: 'Failed' },
  warn: {
    icon: AlertTriangle,
    className: 'text-severity-medium-ink',
    label: 'Warning',
  },
  skipped: {
    icon: MinusCircle,
    className: 'text-muted-foreground',
    label: 'Skipped',
  },
}

/** Steps shown while a test is in flight, before results arrive. */
const PENDING_CHECK_LABELS = [
  'Assume IAM role',
  'External ID required',
  'Account matches',
  'Read-only permissions',
  'Regions reachable',
]

type ConnectionChecksProps = {
  checks?: ConnectionCheck[]
  /** Show spinner rows instead of results */
  running?: boolean
}

export function ConnectionChecks({ checks, running }: ConnectionChecksProps) {
  if (running) {
    return (
      <ul className='space-y-3' aria-live='polite' aria-busy='true'>
        {PENDING_CHECK_LABELS.map((label, i) => (
          <li key={label} className='flex items-center gap-3 text-sm'>
            {i === 0 ? (
              <Loader2
                className='text-muted-foreground size-4 shrink-0 animate-spin'
                aria-hidden
              />
            ) : (
              <CircleDashed
                className='text-muted-foreground/60 size-4 shrink-0'
                aria-hidden
              />
            )}
            <span className={cn(i > 0 && 'text-muted-foreground')}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  if (!checks?.length) {
    return (
      <p className='text-muted-foreground text-sm'>
        No connection test has run yet.
      </p>
    )
  }

  return (
    <ul className='space-y-3' aria-live='polite'>
      {checks.map((check) => {
        const meta = CHECK_META[check.status]
        const Icon = meta.icon
        return (
          <li key={check.id} className='flex gap-3'>
            <Icon
              className={cn('mt-0.5 size-4 shrink-0', meta.className)}
              aria-hidden
            />
            <div className='min-w-0 text-sm'>
              <p className='font-medium'>
                {check.label}
                <span className='sr-only'>: {meta.label}</span>
              </p>
              <p className='text-muted-foreground break-words'>
                {check.detail}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
