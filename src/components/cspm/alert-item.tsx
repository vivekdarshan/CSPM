import { formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { type Alert } from '@/types/cspm'
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  Unplug,
  Wrench,
  XCircle,
} from 'lucide-react'
import { SEVERITY_META } from '@/lib/severity'
import { cn } from '@/lib/utils'

function AlertIcon({ alert }: { alert: Alert }) {
  const base = 'size-4 shrink-0'
  switch (alert.type) {
    case 'new_finding':
      return (
        <ShieldAlert
          className={cn(
            base,
            alert.severity
              ? SEVERITY_META[alert.severity].textClass
              : 'text-muted-foreground'
          )}
          aria-hidden
        />
      )
    case 'finding_resolved':
      return <CheckCircle2 className={cn(base, 'text-success')} aria-hidden />
    case 'connection_failed':
      return <Unplug className={cn(base, 'text-destructive')} aria-hidden />
    case 'scan_failed':
      return <XCircle className={cn(base, 'text-destructive')} aria-hidden />
    case 'remediation_pending':
      return (
        <Clock className={cn(base, 'text-severity-medium-ink')} aria-hidden />
      )
    case 'remediation_failed':
      return <Wrench className={cn(base, 'text-destructive')} aria-hidden />
  }
}

type AlertItemProps = {
  alert: Alert
  /** Called when the alert's link is followed */
  onOpen?: (alert: Alert) => void
  compact?: boolean
  actions?: React.ReactNode
}

/** One alert row, used in the header bell and the alerts inbox. */
export function AlertItem({ alert, onOpen, compact, actions }: AlertItemProps) {
  const linkClass =
    'font-medium leading-snug hover:underline after:absolute after:inset-0'
  const title = alert.remediationId ? (
    <Link
      to='/remediation/$actionId'
      params={{ actionId: alert.remediationId }}
      className={linkClass}
      onClick={() => onOpen?.(alert)}
    >
      {alert.title}
    </Link>
  ) : alert.findingId ? (
    <Link
      to='/findings/$findingId'
      params={{ findingId: alert.findingId }}
      className={linkClass}
      onClick={() => onOpen?.(alert)}
    >
      {alert.title}
    </Link>
  ) : alert.accountId ? (
    <Link
      to='/accounts/$accountId'
      params={{ accountId: alert.accountId }}
      className={linkClass}
      onClick={() => onOpen?.(alert)}
    >
      {alert.title}
    </Link>
  ) : (
    <span className='font-medium'>{alert.title}</span>
  )

  return (
    <div
      className={cn(
        'hover:bg-muted/50 relative flex gap-3 rounded-md',
        compact ? 'px-2 py-2.5' : 'p-3'
      )}
    >
      <span className='mt-0.5'>
        <AlertIcon alert={alert} />
      </span>
      <div className='min-w-0 flex-1 space-y-0.5 text-sm'>
        <p className={cn(compact && 'line-clamp-2')}>
          {!alert.read && <span className='sr-only'>Unread: </span>}
          {title}
        </p>
        <p
          className={cn(
            'text-muted-foreground text-xs',
            compact && 'line-clamp-1'
          )}
        >
          {alert.message}
        </p>
        <time
          dateTime={alert.createdAt}
          className='text-muted-foreground text-xs'
        >
          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
        </time>
      </div>
      <div className='relative z-10 flex shrink-0 items-start gap-1'>
        {actions}
        {!alert.read && (
          <span
            aria-hidden
            className='bg-primary mt-1.5 size-2 rounded-full'
            title='Unread'
          />
        )}
      </div>
    </div>
  )
}
