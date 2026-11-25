import { format, formatDistanceStrict } from 'date-fns'
import { type ScanRun, type ScanStatus } from '@/types/cspm'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const SCAN_STATUS: Record<
  ScanStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  running: {
    label: 'Running',
    icon: Loader2,
    className: 'text-severity-low [&>svg]:animate-spin',
  },
  succeeded: {
    label: 'Succeeded',
    icon: CheckCircle2,
    className: 'text-success',
  },
  failed: { label: 'Failed', icon: XCircle, className: 'text-destructive' },
}

function ScanStatusLabel({ status }: { status: ScanStatus }) {
  const meta = SCAN_STATUS[status]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium',
        meta.className
      )}
    >
      <Icon className='size-4' aria-hidden />
      {meta.label}
    </span>
  )
}

const duration = (run: ScanRun) =>
  run.finishedAt
    ? formatDistanceStrict(new Date(run.finishedAt), new Date(run.startedAt))
    : '—'

export function ScanHistory({ scans }: { scans: ScanRun[] }) {
  if (scans.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        No scans yet. Run the first scan to see results.
      </p>
    )
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Started</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className='hidden sm:table-cell'>Trigger</TableHead>
          <TableHead className='hidden sm:table-cell'>Duration</TableHead>
          <TableHead className='text-end'>Assets</TableHead>
          <TableHead className='text-end'>Findings</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scans.map((run) => (
          <TableRow key={run.id} className='align-top'>
            <TableCell className='whitespace-nowrap'>
              {format(new Date(run.startedAt), 'd MMM, HH:mm')}
            </TableCell>
            <TableCell className='whitespace-normal'>
              <ScanStatusLabel status={run.status} />
              {run.error && (
                <p className='text-muted-foreground mt-1 max-w-sm text-xs'>
                  {run.error}
                </p>
              )}
            </TableCell>
            <TableCell className='text-muted-foreground hidden capitalize sm:table-cell'>
              {run.trigger}
            </TableCell>
            <TableCell className='text-muted-foreground hidden sm:table-cell'>
              {duration(run)}
            </TableCell>
            <TableCell className='text-end tabular-nums'>
              {run.assetsScanned ?? '—'}
            </TableCell>
            <TableCell className='text-end tabular-nums'>
              {run.findingsFound ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
