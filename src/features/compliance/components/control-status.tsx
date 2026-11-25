import { type ControlStatus } from '@/types/cspm'
import { CheckCircle2, ClipboardList, XCircle } from 'lucide-react'
import { CONTROL_STATUS_LABELS } from '@/lib/compliance'
import { cn } from '@/lib/utils'

const META: Record<
  ControlStatus,
  { icon: React.ElementType; className: string }
> = {
  pass: {
    icon: CheckCircle2,
    className: 'border-success/30 bg-success/10 text-success',
  },
  fail: {
    icon: XCircle,
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  manual: {
    icon: ClipboardList,
    className: 'border-border bg-muted text-muted-foreground',
  },
}

export function ControlStatusBadge({
  status,
  className,
}: {
  status: ControlStatus
  className?: string
}) {
  const { icon: Icon, className: tone } = META[status]
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tone,
        className
      )}
    >
      <Icon className='size-3' aria-hidden />
      {CONTROL_STATUS_LABELS[status]}
    </span>
  )
}

/** Thin pass-rate bar with the numbers beside it. */
export function PassBar({
  pass,
  fail,
  className,
}: {
  pass: number
  fail: number
  className?: string
}) {
  const total = pass + fail
  const pct = total ? (pass / total) * 100 : 100
  return (
    <div
      role='img'
      aria-label={`${pass} of ${total} automated controls passing`}
      className={cn('bg-muted h-2 overflow-hidden rounded-full', className)}
    >
      <div
        className='bg-success h-full rounded-full'
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
