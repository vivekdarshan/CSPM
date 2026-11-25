import { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type Severity } from '@/types/cspm'
import { AlertTriangle, Boxes, Plus } from 'lucide-react'
import { cspmQueries } from '@/lib/api/queries'
import { SEVERITY_ORDER } from '@/lib/severity'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/cspm/empty-state'
import { PageHeading } from '@/components/cspm/page-heading'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { AssetsTable } from './components/assets-table'
import { InventorySummary } from './components/inventory-summary'
import { type AssetRow } from './types'

const isOpen = (status: string) => status === 'open' || status === 'in_progress'

export function Assets() {
  const assets = useQuery(cspmQueries.assets())
  const accounts = useQuery(cspmQueries.accounts())
  const findings = useQuery(cspmQueries.findings())

  const rows = useMemo<AssetRow[] | undefined>(() => {
    if (!assets.data || !accounts.data || !findings.data) return undefined
    const accountNames = new Map(accounts.data.map((a) => [a.id, a.name]))
    const highest = new Map<string, AssetRow['highestSeverity']>()
    for (const f of findings.data) {
      if (!isOpen(f.status) || f.severity === 'informational') continue
      const current = highest.get(f.assetId)
      if (
        !current ||
        SEVERITY_ORDER.indexOf(f.severity) <
          SEVERITY_ORDER.indexOf(current as Severity)
      ) {
        highest.set(f.assetId, f.severity)
      }
    }
    return assets.data.map((a) => ({
      ...a,
      accountName: accountNames.get(a.accountId) ?? 'Unknown account',
      highestSeverity: highest.get(a.id) ?? null,
    }))
  }, [assets.data, accounts.data, findings.data])

  const lastSeen = assets.data?.map((a) => a.lastSeenAt).sort()[
    assets.data.length - 1
  ]

  const isError = assets.isError || accounts.isError || findings.isError

  return (
    <>
      <AppHeader />
      <Main>
        <PageHeading
          title='Asset inventory'
          description={
            rows
              ? `${rows.length} resources across ${accounts.data?.length ?? 0} accounts${
                  lastSeen
                    ? ` · updated ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
                    : ''
                }`
              : 'Every resource found in your connected accounts.'
          }
        />

        {isError ? (
          <EmptyState
            icon={AlertTriangle}
            title='Could not load the inventory'
            description='Check your connection and try again.'
            action={
              <Button
                variant='outline'
                onClick={() => {
                  assets.refetch()
                  accounts.refetch()
                  findings.refetch()
                }}
              >
                Retry
              </Button>
            }
          />
        ) : !rows ? (
          <div className='space-y-6'>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6'>
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className='h-24 rounded-xl' />
              ))}
            </div>
            <Skeleton className='h-96 w-full rounded-md' />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title='No assets yet'
            description='Connect an account and run a scan to build your inventory.'
            action={
              <Button asChild>
                <Link to='/accounts/connect'>
                  <Plus /> Connect account
                </Link>
              </Button>
            }
          />
        ) : (
          <div className='space-y-6'>
            <InventorySummary data={rows} />
            <AssetsTable data={rows} />
          </div>
        )}
      </Main>
    </>
  )
}
