import { formatDistanceToNowStrict } from 'date-fns'
import { type CloudAccount, type Finding } from '@/types/cspm'
import { ShieldCheck } from 'lucide-react'
import { compareSeverity } from '@/lib/severity'
import { EmptyState } from '@/components/cspm/empty-state'
import { ProviderIcon } from '@/components/cspm/provider-icon'
import { SeverityBadge } from '@/components/cspm/severity-badge'
import { StatusBadge } from '@/components/cspm/status-badge'

type TopRisksProps = {
  findings: Finding[]
  accounts: CloudAccount[]
  limit?: number
}

export function TopRisks({ findings, accounts, limit = 6 }: TopRisksProps) {
  const accountName = new Map(accounts.map((a) => [a.id, a.name]))
  const top = findings
    .filter((f) => f.status === 'open' || f.status === 'in_progress')
    .sort(
      (a, b) =>
        compareSeverity(a.severity, b.severity) ||
        a.firstSeenAt.localeCompare(b.firstSeenAt)
    )
    .slice(0, limit)

  if (top.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title='No open findings'
        description='Nice work. New issues will show up here after the next scan.'
        className='py-10'
      />
    )
  }

  return (
    <ul className='divide-y'>
      {top.map((f) => (
        <li
          key={f.id}
          className='flex items-start gap-3 py-3 first:pt-0 last:pb-0'
        >
          <ProviderIcon provider={f.provider} size='sm' className='mt-0.5' />
          <div className='min-w-0 flex-1 space-y-1'>
            <p className='text-sm leading-snug font-medium'>{f.title}</p>
            <p className='text-muted-foreground truncate text-xs'>
              {f.resourceName} · {accountName.get(f.accountId) ?? f.accountId}
              {' · '}open {formatDistanceToNowStrict(new Date(f.firstSeenAt))}
            </p>
          </div>
          <div className='flex shrink-0 flex-col items-end gap-1'>
            <SeverityBadge severity={f.severity} />
            {f.status === 'in_progress' && <StatusBadge status={f.status} />}
          </div>
        </li>
      ))}
    </ul>
  )
}
