import { formatDistanceToNow } from 'date-fns'
import { type RemediationStep } from '@/types/cspm'
import {
  CheckCircle2,
  CircleDashed,
  Loader2,
  MinusCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON: Record<
  RemediationStep['status'],
  { icon: React.ElementType; className: string; label: string }
> = {
  pending: {
    icon: CircleDashed,
    className: 'text-muted-foreground/60',
    label: 'Not started',
  },
  running: {
    icon: Loader2,
    className: 'text-severity-low animate-spin',
    label: 'In progress',
  },
  done: { icon: CheckCircle2, className: 'text-success', label: 'Done' },
  failed: { icon: XCircle, className: 'text-destructive', label: 'Failed' },
  skipped: {
    icon: MinusCircle,
    className: 'text-muted-foreground',
    label: 'Skipped',
  },
}

/** Execution progress, one row per step. */
export function Steps({ steps }: { steps: RemediationStep[] }) {
  return (
    <ol className='space-y-3' aria-live='polite'>
      {steps.map((s) => {
        const meta = ICON[s.status]
        const Icon = meta.icon
        return (
          <li key={s.id} className='flex gap-3'>
            <Icon
              className={cn('mt-0.5 size-4 shrink-0', meta.className)}
              aria-hidden
            />
            <div className='min-w-0 text-sm'>
              <p
                className={cn(
                  'font-medium',
                  (s.status === 'pending' || s.status === 'skipped') &&
                    'text-muted-foreground font-normal'
                )}
              >
                {s.label}
                <span className='sr-only'>: {meta.label}</span>
              </p>
              {s.detail && (
                <p
                  className={cn(
                    'text-xs break-words',
                    s.status === 'failed'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {s.detail}
                </p>
              )}
              {s.finishedAt && s.status === 'done' && (
                <p className='text-muted-foreground text-xs'>
                  {formatDistanceToNow(new Date(s.finishedAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
