import { type SeverityCounts } from '@/types/cspm'
import { SEVERITY_META } from '@/lib/severity'

const SHOWN = ['critical', 'high', 'medium', 'low'] as const

/** Horizontal bars, one per severity, each labelled with its count. */
export function SeverityBreakdown({ counts }: { counts: SeverityCounts }) {
  const max = Math.max(1, ...SHOWN.map((s) => counts[s]))
  return (
    <ul className='space-y-2.5'>
      {SHOWN.map((s) => (
        <li
          key={s}
          className='grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-sm'
        >
          <span className='text-muted-foreground'>
            {SEVERITY_META[s].label}
          </span>
          <span className='bg-muted h-2 overflow-hidden rounded-full'>
            <span
              className={`block h-full rounded-full ${SEVERITY_META[s].bgClass}`}
              style={{ width: `${(counts[s] / max) * 100}%` }}
            />
          </span>
          <span className='text-end font-medium tabular-nums'>{counts[s]}</span>
        </li>
      ))}
    </ul>
  )
}
