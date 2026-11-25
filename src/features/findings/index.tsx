import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { cspmQueries } from '@/lib/api/queries'
import { isOpenFinding } from '@/lib/findings'
import { CHARTED_SEVERITIES, SEVERITY_META } from '@/lib/severity'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/cspm/empty-state'
import { PageHeading } from '@/components/cspm/page-heading'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { type FindingRow } from './components/findings-columns'
import { FindingsTable } from './components/findings-table'

const route = getRouteApi('/_authenticated/findings/')

type View = 'open' | 'suppressed' | 'resolved' | 'all'

const VIEWS: { id: View; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'suppressed', label: 'Suppressed' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
]

const inView = (view: View, f: FindingRow) =>
  view === 'all' || (view === 'open' ? isOpenFinding(f) : f.status === view)

export function Findings() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const view: View = search.view ?? 'open'

  const findings = useQuery(cspmQueries.findings())
  const accounts = useQuery(cspmQueries.accounts())

  const rows = useMemo<FindingRow[] | undefined>(() => {
    if (!findings.data || !accounts.data) return undefined
    const names = new Map(accounts.data.map((a) => [a.id, a.name]))
    return findings.data.map((f) => ({
      ...f,
      accountName: names.get(f.accountId) ?? 'Unknown account',
    }))
  }, [findings.data, accounts.data])

  const open = rows?.filter(isOpenFinding) ?? []
  const counts = Object.fromEntries(
    VIEWS.map((v) => [v.id, rows?.filter((f) => inView(v.id, f)).length ?? 0])
  ) as Record<View, number>
  const visible = rows?.filter((f) => inView(view, f)) ?? []

  const severityFilter = search.severity ?? []

  return (
    <>
      <AppHeader />
      <Main>
        <PageHeading
          title='Findings'
          description={
            rows
              ? `${open.length} open across ${new Set(open.map((f) => f.assetId)).size} resources. Fix the highest severity first.`
              : 'Misconfigurations and exposures found in your accounts.'
          }
        />

        {findings.isError || accounts.isError ? (
          <EmptyState
            icon={AlertTriangle}
            title='Could not load findings'
            description='Check your connection and try again.'
            action={
              <Button
                variant='outline'
                onClick={() => {
                  findings.refetch()
                  accounts.refetch()
                }}
              >
                Retry
              </Button>
            }
          />
        ) : !rows ? (
          <div className='space-y-6'>
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className='h-20 rounded-xl' />
              ))}
            </div>
            <Skeleton className='h-96 w-full rounded-md' />
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Open findings by severity; click to filter */}
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
              {CHARTED_SEVERITIES.map((s) => {
                const count = open.filter((f) => f.severity === s).length
                const active =
                  severityFilter.length === 1 && severityFilter[0] === s
                return (
                  <button
                    key={s}
                    type='button'
                    aria-pressed={active}
                    onClick={() =>
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          view: undefined,
                          severity: active ? undefined : [s],
                          page: undefined,
                        }),
                      })
                    }
                    className={cn(
                      'bg-card hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-4 text-start transition-colors',
                      'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
                      active && 'border-primary ring-primary/20 ring-2'
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'h-9 w-1.5 shrink-0 rounded-full',
                        SEVERITY_META[s].bgClass
                      )}
                    />
                    <span>
                      <span className='block text-2xl font-bold tabular-nums'>
                        {count}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {SEVERITY_META[s].label} open
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <Tabs
              value={view}
              onValueChange={(v) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    view: v === 'open' ? undefined : (v as View),
                    page: undefined,
                  }),
                })
              }
            >
              <TabsList>
                {VIEWS.map((v) => (
                  <TabsTrigger key={v.id} value={v.id}>
                    {v.label}
                    <span className='text-muted-foreground ms-1 tabular-nums'>
                      {counts[v.id]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {view === 'open' && open.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title='No open findings'
                description='Everything found so far is fixed or suppressed. New issues appear here after each scan.'
              />
            ) : (
              <FindingsTable data={visible} />
            )}
          </div>
        )}
      </Main>
    </>
  )
}
