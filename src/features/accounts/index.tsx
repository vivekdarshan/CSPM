import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { APP_CONFIG } from '@/config/app'
import { type CloudAccount, type ConnectionStatus } from '@/types/cspm'
import { AlertTriangle, ChevronRight, Cloud, Plus, Search } from 'lucide-react'
import { cspmQueries } from '@/lib/api/queries'
import { ENVIRONMENT_LABELS } from '@/lib/aws'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/cspm/empty-state'
import { PageHeading } from '@/components/cspm/page-heading'
import { ProviderIcon } from '@/components/cspm/provider-icon'
import { StatusBadge } from '@/components/cspm/status-badge'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'

type StatusFilter = 'all' | ConnectionStatus

const lastScanLabel = (a: CloudAccount) =>
  a.lastScanAt
    ? formatDistanceToNow(new Date(a.lastScanAt), { addSuffix: true })
    : 'Never'

export function Accounts() {
  const accounts = useQuery(cspmQueries.accounts())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (accounts.data ?? []).filter(
      (a) =>
        (status === 'all' || a.status === status) &&
        (!q || a.name.toLowerCase().includes(q) || a.externalId.includes(q))
    )
  }, [accounts.data, search, status])

  const failing = accounts.data?.filter((a) => a.status === 'error') ?? []
  const hasAccounts = (accounts.data?.length ?? 0) > 0

  return (
    <>
      <AppHeader />
      <Main>
        <PageHeading
          title='Cloud accounts'
          description={`Accounts ${APP_CONFIG.name} scans with read-only access.`}
          actions={
            <Button asChild>
              <Link to='/accounts/connect'>
                <Plus /> Connect account
              </Link>
            </Button>
          }
        />

        {failing.length > 0 && (
          <Alert variant='destructive' className='mb-6'>
            <AlertTriangle />
            <AlertTitle>
              {failing.length === 1
                ? '1 account needs attention'
                : `${failing.length} accounts need attention`}
            </AlertTitle>
            <AlertDescription>
              <p>
                {APP_CONFIG.name} can't reach{' '}
                {failing.map((a, i) => (
                  <span key={a.id}>
                    {i > 0 && ', '}
                    <Link
                      to='/accounts/$accountId'
                      params={{ accountId: a.id }}
                      className='font-medium underline underline-offset-4'
                    >
                      {a.name}
                    </Link>
                  </span>
                ))}
                , so {failing.length === 1 ? 'its' : 'their'} results are out of
                date.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {accounts.isPending ? (
          <Card className='gap-0 p-0'>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className='flex items-center gap-3 border-b p-4'>
                <Skeleton className='h-7 w-9' />
                <Skeleton className='h-4 w-40' />
                <Skeleton className='ms-auto h-5 w-20 rounded-full' />
              </div>
            ))}
          </Card>
        ) : accounts.isError ? (
          <EmptyState
            icon={AlertTriangle}
            title='Could not load accounts'
            description='Check your connection and try again.'
            action={
              <Button variant='outline' onClick={() => accounts.refetch()}>
                Retry
              </Button>
            }
          />
        ) : !hasAccounts ? (
          <EmptyState
            icon={Cloud}
            title='Connect your first cloud account'
            description={`${APP_CONFIG.name} needs read-only access to scan for misconfigurations. Setup takes about five minutes.`}
            action={
              <Button asChild>
                <Link to='/accounts/connect'>
                  <Plus /> Connect AWS account
                </Link>
              </Button>
            }
          />
        ) : (
          <div className='space-y-4'>
            <div className='flex flex-wrap gap-2'>
              <div className='relative min-w-0 flex-1 sm:max-w-xs'>
                <Search
                  className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2'
                  aria-hidden
                />
                <Input
                  type='search'
                  placeholder='Search name or account ID'
                  aria-label='Search accounts'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='ps-8'
                />
              </div>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as StatusFilter)}
              >
                <SelectTrigger className='w-40' aria-label='Filter by status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='connected'>Connected</SelectItem>
                  <SelectItem value='error'>Error</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title='No matching accounts'
                description='Try a different search or status.'
                className='py-10'
              />
            ) : (
              <>
                <AccountsTable accounts={filtered} />
                <AccountCards accounts={filtered} />
              </>
            )}
          </div>
        )}
      </Main>
    </>
  )
}

function AccountsTable({ accounts }: { accounts: CloudAccount[] }) {
  const navigate = useNavigate()
  return (
    <Card className='hidden gap-0 py-0 md:block'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='ps-4'>Account</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-end'>Assets</TableHead>
            <TableHead className='text-end'>Open findings</TableHead>
            <TableHead>Last scan</TableHead>
            <TableHead className='w-8'>
              <span className='sr-only'>Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((a) => (
            <TableRow
              key={a.id}
              className='cursor-pointer'
              onClick={() =>
                navigate({
                  to: '/accounts/$accountId',
                  params: { accountId: a.id },
                })
              }
            >
              <TableCell className='ps-4'>
                <div className='flex items-center gap-3'>
                  <ProviderIcon provider={a.provider} />
                  <div className='min-w-0'>
                    <Link
                      to='/accounts/$accountId'
                      params={{ accountId: a.id }}
                      className='font-medium hover:underline'
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.name}
                    </Link>
                    <p className='text-muted-foreground font-mono text-xs'>
                      {a.externalId}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{ENVIRONMENT_LABELS[a.environment]}</TableCell>
              <TableCell>
                <StatusBadge status={a.status} />
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {a.assetCount}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {a.openFindingCount}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {lastScanLabel(a)}
              </TableCell>
              <TableCell>
                <ChevronRight
                  className='text-muted-foreground size-4'
                  aria-hidden
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function AccountCards({ accounts }: { accounts: CloudAccount[] }) {
  return (
    <ul className='space-y-3 md:hidden'>
      {accounts.map((a) => (
        <li key={a.id}>
          <Link
            to='/accounts/$accountId'
            params={{ accountId: a.id }}
            className='bg-card hover:bg-muted/50 block rounded-xl border p-4 transition-colors'
          >
            <div className='flex items-center gap-3'>
              <ProviderIcon provider={a.provider} />
              <div className='min-w-0 flex-1'>
                <p className='truncate font-medium'>{a.name}</p>
                <p className='text-muted-foreground font-mono text-xs'>
                  {a.externalId}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <dl className='text-muted-foreground mt-3 grid grid-cols-3 gap-2 text-xs'>
              <div>
                <dt>Assets</dt>
                <dd className='text-foreground font-medium tabular-nums'>
                  {a.assetCount}
                </dd>
              </div>
              <div>
                <dt>Open findings</dt>
                <dd className='text-foreground font-medium tabular-nums'>
                  {a.openFindingCount}
                </dd>
              </div>
              <div>
                <dt>Last scan</dt>
                <dd className='text-foreground font-medium'>
                  {lastScanLabel(a)}
                </dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  )
}
