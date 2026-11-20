import { type ConnectionStatus, type FindingStatus } from '@/types/cspm'
import { cn } from '@/lib/utils'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const TONE_CLASS: Record<Tone, { pill: string; dot: string }> = {
  success: {
    pill: 'border-success/30 bg-success/10 text-success',
    dot: 'bg-success',
  },
  warning: {
    pill: 'border-severity-medium/40 bg-severity-medium/15 text-severity-medium-ink',
    dot: 'bg-severity-medium',
  },
  danger: {
    pill: 'border-destructive/30 bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
  },
  info: {
    pill: 'border-severity-low/30 bg-severity-low/10 text-severity-low',
    dot: 'bg-severity-low',
  },
  neutral: {
    pill: 'border-border bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
}

const STATUS_META: Record<
  ConnectionStatus | FindingStatus,
  { label: string; tone: Tone }
> = {
  connected: { label: 'Connected', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  error: { label: 'Error', tone: 'danger' },
  disconnected: { label: 'Disconnected', tone: 'neutral' },
  open: { label: 'Open', tone: 'danger' },
  in_progress: { label: 'In progress', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
  suppressed: { label: 'Suppressed', tone: 'neutral' },
}

type StatusBadgeProps = {
  status: ConnectionStatus | FindingStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, tone } = STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASS[tone].pill,
        className
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', TONE_CLASS[tone].dot)}
      />
      {label}
    </span>
  )
}
