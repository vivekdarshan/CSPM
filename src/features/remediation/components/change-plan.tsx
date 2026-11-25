import { type RemediationChange } from '@/types/cspm'
import { AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type ChangePlanProps = {
  changes: RemediationChange[]
  apiCalls: string[]
  warnings: string[]
  reversible: boolean
}

/** Exactly what a fix changes, what it calls and what might break. */
export function ChangePlan({
  changes,
  apiCalls,
  warnings,
  reversible,
}: ChangePlanProps) {
  return (
    <div className='space-y-5'>
      <section className='space-y-2'>
        <h3 className='text-sm font-medium'>What will change</h3>
        <ul className='divide-y rounded-md border'>
          {changes.map((c, i) => (
            <li
              key={i}
              className='grid gap-1 p-3 text-sm sm:grid-cols-[9rem_1fr] sm:gap-3'
            >
              <span className='text-muted-foreground'>{c.setting}</span>
              <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                <span className='text-muted-foreground line-through decoration-1'>
                  <span className='sr-only'>From </span>
                  {c.before}
                </span>
                <ArrowRight
                  className='text-muted-foreground size-3.5 shrink-0'
                  aria-hidden
                />
                <span className='font-medium'>
                  <span className='sr-only'>to </span>
                  {c.after}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {warnings.length > 0 && (
        <section className='border-severity-medium/40 bg-severity-medium/10 space-y-2 rounded-md border p-3'>
          <h3 className='text-severity-medium-ink flex items-center gap-1.5 text-sm font-medium'>
            <AlertTriangle className='size-4' aria-hidden /> Before you approve
          </h3>
          <ul className='list-disc space-y-1 ps-5 text-sm'>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      <div className='text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-xs'>
        <span className='inline-flex items-center gap-1.5'>
          <RotateCcw className='size-3.5' aria-hidden />
          {reversible
            ? 'Can be rolled back after it runs'
            : 'Cannot be fully rolled back'}
        </span>
        <span className='inline-flex flex-wrap items-center gap-1.5'>
          AWS calls:
          {apiCalls.map((c) => (
            <Badge key={c} variant='outline' className='font-mono font-normal'>
              {c}
            </Badge>
          ))}
        </span>
      </div>
    </div>
  )
}
