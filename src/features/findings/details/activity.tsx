import { format, formatDistanceToNow } from 'date-fns'
import { type FindingEvent } from '@/types/cspm'
import {
  BellOff,
  CheckCircle2,
  CircleDot,
  PlayCircle,
  Radar,
  RotateCcw,
} from 'lucide-react'
import { SUPPRESSION_REASONS } from '@/lib/findings'

function describe(e: FindingEvent): { icon: React.ElementType; text: string } {
  if (e.type === 'detected') return { icon: Radar, text: 'Detected by scan' }
  if (e.type === 'resolved_by_scan')
    return { icon: CheckCircle2, text: 'Resolved: scan confirmed the fix' }
  switch (e.status) {
    case 'in_progress':
      return { icon: PlayCircle, text: `${e.by} started fixing` }
    case 'suppressed':
      return {
        icon: BellOff,
        text: `${e.by} suppressed it${e.reason ? ` (${SUPPRESSION_REASONS[e.reason].label.toLowerCase()})` : ''}`,
      }
    case 'open':
      return { icon: RotateCcw, text: `${e.by} reopened it` }
    default:
      return { icon: CircleDot, text: `${e.by} changed the status` }
  }
}

/** Newest first. */
export function Activity({
  events,
  lastSeenAt,
}: {
  events: FindingEvent[]
  lastSeenAt: string
}) {
  const items = [...events].reverse()
  return (
    <div className='space-y-4'>
      <p className='text-muted-foreground text-xs'>
        Last seen by a scan{' '}
        {formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}
      </p>
      <ol className='relative space-y-4 border-s ps-5'>
        {items.map((e, i) => {
          const { icon: Icon, text } = describe(e)
          return (
            <li key={`${e.at}-${i}`} className='relative'>
              <span className='bg-background absolute -start-[1.95rem] top-0 flex size-5 items-center justify-center rounded-full border'>
                <Icon className='text-muted-foreground size-3' aria-hidden />
              </span>
              <p className='text-sm'>{text}</p>
              {e.note && (
                <p className='bg-muted/50 mt-1 rounded-md px-2 py-1 text-xs'>
                  “{e.note}”
                </p>
              )}
              <time
                dateTime={e.at}
                className='text-muted-foreground text-xs'
                title={format(new Date(e.at), 'd MMM yyyy, HH:mm')}
              >
                {formatDistanceToNow(new Date(e.at), { addSuffix: true })}
              </time>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
