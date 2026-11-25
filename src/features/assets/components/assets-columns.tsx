import { formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { type ColumnDef, type FilterFn } from '@tanstack/react-table'
import { CheckCircle2, Globe, Lock } from 'lucide-react'
import { resourceTypeMeta } from '@/lib/assets'
import { SEVERITY_META } from '@/lib/severity'
import { SeverityBadge } from '@/components/cspm/severity-badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type AssetRow, type RiskLevel } from '../types'

const includesValue: FilterFn<AssetRow> = (row, id, value: string[]) =>
  value.includes(String(row.getValue(id)))

const RISK_RANK: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
}

export const assetsColumns: ColumnDef<AssetRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Asset' />
    ),
    cell: ({ row }) => {
      const a = row.original
      const Icon = resourceTypeMeta(a.resourceType).icon
      return (
        <div className='flex max-w-72 items-center gap-3'>
          <span className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-md'>
            <Icon className='text-muted-foreground size-4' aria-hidden />
          </span>
          <div className='min-w-0'>
            <Link
              to='/assets/$assetId'
              params={{ assetId: a.id }}
              className='block truncate font-medium hover:underline'
              onClick={(e) => e.stopPropagation()}
            >
              {a.name}
            </Link>
            <p
              className='text-muted-foreground truncate font-mono text-xs'
              title={a.resourceId}
            >
              {a.resourceId}
            </p>
          </div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    id: 'type',
    accessorFn: (a) => a.resourceType,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => (
      <span className='whitespace-nowrap'>
        {resourceTypeMeta(row.original.resourceType).label}
      </span>
    ),
    sortingFn: (a, b) =>
      resourceTypeMeta(a.original.resourceType).label.localeCompare(
        resourceTypeMeta(b.original.resourceType).label
      ),
    filterFn: includesValue,
  },
  {
    id: 'account',
    accessorFn: (a) => a.accountId,
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
    accessorKey: 'region',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Region' />
    ),
    cell: ({ row }) => (
      <span className='font-mono text-xs'>{row.original.region}</span>
    ),
    filterFn: includesValue,
  },
  {
    id: 'exposure',
    accessorFn: (a) => (a.publiclyExposed ? 'public' : 'private'),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Exposure' />
    ),
    cell: ({ row }) =>
      row.original.publiclyExposed ? (
        <span className='text-severity-high-ink inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap'>
          <Globe className='size-3.5' aria-hidden /> Public
        </span>
      ) : (
        <span className='text-muted-foreground inline-flex items-center gap-1.5 text-sm whitespace-nowrap'>
          <Lock className='size-3.5' aria-hidden /> Private
        </span>
      ),
    filterFn: includesValue,
  },
  {
    id: 'risk',
    accessorFn: (a) => a.highestSeverity ?? 'none',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Open findings' />
    ),
    cell: ({ row }) => {
      const a = row.original
      if (!a.highestSeverity) {
        return (
          <span className='text-muted-foreground inline-flex items-center gap-1.5 text-sm'>
            <CheckCircle2 className='text-success size-3.5' aria-hidden /> None
          </span>
        )
      }
      return (
        <span className='inline-flex items-center gap-2 whitespace-nowrap'>
          <SeverityBadge severity={a.highestSeverity} />
          <span className='text-sm tabular-nums'>
            {a.openFindingCount}{' '}
            <span className='text-muted-foreground'>open</span>
          </span>
        </span>
      )
    },
    sortingFn: (a, b) => {
      const ra = RISK_RANK[(a.original.highestSeverity ?? 'none') as RiskLevel]
      const rb = RISK_RANK[(b.original.highestSeverity ?? 'none') as RiskLevel]
      return (
        ra - rb || a.original.openFindingCount - b.original.openFindingCount
      )
    },
    filterFn: includesValue,
  },
  {
    accessorKey: 'lastSeenAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last seen' />
    ),
    cell: ({ row }) => (
      <span className='text-muted-foreground whitespace-nowrap'>
        {formatDistanceToNow(new Date(row.original.lastSeenAt), {
          addSuffix: true,
        })}
      </span>
    ),
  },
]

export const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: 'critical', label: SEVERITY_META.critical.label },
  { value: 'high', label: SEVERITY_META.high.label },
  { value: 'medium', label: SEVERITY_META.medium.label },
  { value: 'low', label: SEVERITY_META.low.label },
  { value: 'none', label: 'No open findings' },
]
