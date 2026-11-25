import { formatDistanceToNowStrict } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { type ColumnDef, type FilterFn } from '@tanstack/react-table'
import { type Finding } from '@/types/cspm'
import { Zap } from 'lucide-react'
import { resourceTypeMeta } from '@/lib/assets'
import { CATEGORY_LABELS } from '@/lib/findings'
import { SEVERITY_ORDER } from '@/lib/severity'
import { SeverityBadge } from '@/components/cspm/severity-badge'
import { StatusBadge } from '@/components/cspm/status-badge'
import { DataTableColumnHeader } from '@/components/data-table'

export type FindingRow = Finding & { accountName: string }

const includesValue: FilterFn<FindingRow> = (row, id, value: string[]) =>
  value.includes(String(row.getValue(id)))

export const findingsColumns: ColumnDef<FindingRow>[] = [
  {
    accessorKey: 'severity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Severity' />
    ),
    cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
    // Higher severity sorts as "greater" so descending puts critical first
    sortingFn: (a, b) =>
      SEVERITY_ORDER.indexOf(b.original.severity) -
        SEVERITY_ORDER.indexOf(a.original.severity) ||
      b.original.firstSeenAt.localeCompare(a.original.firstSeenAt),
    filterFn: includesValue,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Finding' />
    ),
    cell: ({ row }) => {
      const f = row.original
      return (
        <div className='max-w-md min-w-56 space-y-0.5 whitespace-normal'>
          <Link
            to='/findings/$findingId'
            params={{ findingId: f.id }}
            className='font-medium hover:underline'
            onClick={(e) => e.stopPropagation()}
          >
            {f.title}
          </Link>
          <p className='text-muted-foreground truncate text-xs'>
            {f.resourceName} · {resourceTypeMeta(f.resourceType).label}
          </p>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    id: 'account',
    accessorFn: (f) => f.accountId,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Account' />
    ),
    cell: ({ row }) => (
      <span className='whitespace-nowrap'>{row.original.accountName}</span>
    ),
    sortingFn: (a, b) =>
      a.original.accountName.localeCompare(b.original.accountName),
    filterFn: includesValue,
  },
  {
    accessorKey: 'category',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => (
      <span className='whitespace-nowrap'>
        {CATEGORY_LABELS[row.original.category]}
      </span>
    ),
    filterFn: includesValue,
  },
  {
    id: 'type',
    accessorFn: (f) => f.resourceType,
    header: 'Resource type',
    cell: ({ row }) => (
      <span className='whitespace-nowrap'>
        {resourceTypeMeta(row.original.resourceType).label}
      </span>
    ),
    filterFn: includesValue,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col items-start gap-1'>
        <StatusBadge status={row.original.status} />
        {row.original.remediation.automatable &&
          (row.original.status === 'open' ||
            row.original.status === 'in_progress') && (
            <span className='text-muted-foreground inline-flex items-center gap-1 text-xs whitespace-nowrap'>
              <Zap className='size-3' aria-hidden /> Auto-fixable
            </span>
          )}
      </div>
    ),
  },
  {
    accessorKey: 'firstSeenAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Age' />
    ),
    cell: ({ row }) => (
      <span
        className='text-muted-foreground whitespace-nowrap'
        title={new Date(row.original.firstSeenAt).toLocaleString()}
      >
        {formatDistanceToNowStrict(new Date(row.original.firstSeenAt))}
      </span>
    ),
    // Older findings are "greater" so descending puts the oldest first
    sortingFn: (a, b) =>
      b.original.firstSeenAt.localeCompare(a.original.firstSeenAt),
  },
]
