import { type RemediationStatus } from '@/types/cspm'
import { Loader2 } from 'lucide-react'
import { REMEDIATION_STATUS, type StatusTone } from '@/lib/remediation'
import { cn } from '@/lib/utils'

const TONE: Record<StatusTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  warning:
    'border-severity-medium/40 bg-severity-medium/15 text-severity-medium-ink',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-severity-low/30 bg-severity-low/10 text-severity-low',
  neutral: 'border-border bg-muted text-muted-foreground',
}

export function RemediationStatusBadge({
  status,
  className,
}: {
  status: RemediationStatus
  className?: string
}) {
  const { label, tone } = REMEDIATION_STATUS[status]
  const busy = status === 'running' || status === 'verifying'
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE[tone],
        className
      )}
    >
      {busy ? (
        <Loader2 className='size-3 animate-spin' aria-hidden />
      ) : (
        <span aria-hidden className='size-1.5 rounded-full bg-current' />
      )}
      {label}
    </span>
  )
}
