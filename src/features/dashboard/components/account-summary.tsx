import { formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { type CloudAccount } from '@/types/cspm'
import { AlertTriangle } from 'lucide-react'
import { ProviderIcon } from '@/components/cspm/provider-icon'
import { StatusBadge } from '@/components/cspm/status-badge'

export function AccountSummary({ accounts }: { accounts: CloudAccount[] }) {
  return (
    <ul className='divide-y'>
      {accounts.map((a) => (
        <li key={a.id} className='space-y-2 py-3 first:pt-0 last:pb-0'>
          <div className='flex items-center gap-3'>
            <ProviderIcon provider={a.provider} />
            <div className='min-w-0 flex-1'>
              <Link
                to='/accounts/$accountId'
                params={{ accountId: a.id }}
                className='block truncate text-sm font-medium hover:underline'
              >
                {a.name}
              </Link>
              <p className='text-muted-foreground font-mono text-xs'>
                {a.externalId}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
          <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 ps-12 text-xs'>
            <span>
              <span className='text-foreground font-medium tabular-nums'>
                {a.openFindingCount}
              </span>{' '}
              open findings
            </span>
            <span>
              <span className='text-foreground font-medium tabular-nums'>
                {a.assetCount}
              </span>{' '}
              assets
            </span>
            <span>
              {a.lastScanAt
                ? `Scanned ${formatDistanceToNow(new Date(a.lastScanAt), { addSuffix: true })}`
                : 'Never scanned'}
            </span>
          </div>
          {a.status === 'error' && a.statusMessage && (
            <p className='text-destructive ms-12 flex gap-1.5 text-xs'>
              <AlertTriangle className='mt-px size-3.5 shrink-0' aria-hidden />
              {a.statusMessage}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
