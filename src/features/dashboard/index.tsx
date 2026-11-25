import { formatDistanceToNow } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Boxes,
  Cloud,
  Globe,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { startScan } from '@/lib/api/cspm-api'
import { cspmQueries } from '@/lib/api/queries'
import { postureGrade } from '@/lib/posture'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeading } from '@/components/cspm/page-heading'
import { PostureScoreRing } from '@/components/cspm/posture-score-ring'
import { SeverityBreakdown } from '@/components/cspm/severity-breakdown'
import { StatCard } from '@/components/cspm/stat-card'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { AccountSummary } from './components/account-summary'
import { FindingsTrendChart } from './components/findings-trend-chart'
import { TopRisks } from './components/top-risks'

export function Dashboard() {
  const queryClient = useQueryClient()
  const summary = useQuery(cspmQueries.postureSummary())
  const trend = useQuery(cspmQueries.findingsTrend())
  const findings = useQuery(cspmQueries.findings())
  const accounts = useQuery(cspmQueries.accounts())

  const scan = useMutation({
    mutationFn: startScan,
    onSuccess: () => {
      toast.success('Scan started', {
        description: 'Results will appear here as each account finishes.',
      })
      queryClient.invalidateQueries()
    },
  })

  const s = summary.data
  const openTotal = s
    ? Object.values(s.openFindings).reduce((a, b) => a + b, 0) -
      s.openFindings.informational
    : 0

  return (
    <>
      <AppHeader />
      <Main>
        <PageHeading
          title='Security overview'
          description={
            s ? (
              <>
                {s.connectedAccounts} of {s.totalAccounts} accounts connected
                {s.lastScanAt &&
                  ` · Last scan ${formatDistanceToNow(new Date(s.lastScanAt), { addSuffix: true })}`}
              </>
            ) : (
              <Skeleton className='h-4 w-64' />
            )
          }
          actions={
            <Button onClick={() => scan.mutate()} disabled={scan.isPending}>
              {scan.isPending ? (
                <Loader2 className='animate-spin' />
              ) : (
                <RefreshCw />
              )}
              Run scan
            </Button>
          }
        />

        <div className='space-y-4'>
          {/* ===== Key numbers ===== */}
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <StatCard
              title='Open findings'
              icon={ShieldAlert}
              loading={!s}
              value={openTotal}
              description={
                s && (
                  <>
                    <span className='text-severity-critical font-medium'>
                      {s.openFindings.critical} critical
                    </span>
                    {' · '}
                    <span className='text-severity-high-ink font-medium'>
                      {s.openFindings.high} high
                    </span>
                  </>
                )
              }
            />
            <StatCard
              title='Publicly exposed'
              icon={Globe}
              loading={!s}
              value={s?.exposedAssets}
              description={
                <Link
                  to='/assets'
                  search={{ exposure: ['public'] }}
                  className='hover:text-foreground underline underline-offset-4'
                >
                  View internet-facing resources
                </Link>
              }
            />
            <StatCard
              title='Assets monitored'
              icon={Boxes}
              loading={!s}
              value={s?.totalAssets}
              description='EC2, S3, RDS, IAM and network'
            />
            <StatCard
              title='Cloud accounts'
              icon={Cloud}
              loading={!s}
              value={s && `${s.connectedAccounts}/${s.totalAccounts}`}
              description={
                s && s.connectedAccounts < s.totalAccounts ? (
                  <span className='text-destructive font-medium'>
                    {s.totalAccounts - s.connectedAccounts} need attention
                  </span>
                ) : (
                  'All connected'
                )
              }
            />
          </div>

          {/* ===== Posture + trend ===== */}
          <div className='grid gap-4 *:min-w-0 lg:grid-cols-7'>
            <Card className='lg:col-span-3'>
              <CardHeader>
                <CardTitle>Posture score</CardTitle>
                <CardDescription>
                  Weighted by the severity of open findings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {s ? (
                  <div className='flex flex-col items-center gap-6 sm:flex-row sm:items-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <PostureScoreRing score={s.score} />
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          postureGrade(s.score).inkClass
                        )}
                      >
                        {postureGrade(s.score).label}
                      </span>
                      <ScoreDelta delta={s.scoreDelta} />
                    </div>
                    <div className='w-full flex-1'>
                      <SeverityBreakdown counts={s.openFindings} />
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center gap-6'>
                    <Skeleton className='size-37 rounded-full' />
                    <div className='flex-1 space-y-3'>
                      {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className='h-3 w-full' />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>Open findings</CardTitle>
                <CardDescription>Last 30 days, by severity</CardDescription>
              </CardHeader>
              <CardContent>
                {trend.data ? (
                  <FindingsTrendChart data={trend.data} />
                ) : (
                  <Skeleton className='h-[284px] w-full' />
                )}
              </CardContent>
            </Card>
          </div>

          {/* ===== Top risks + accounts ===== */}
          <div className='grid gap-4 *:min-w-0 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>Top risks</CardTitle>
                <CardDescription>Fix these first</CardDescription>
                <CardAction>
                  <Button variant='ghost' size='sm' asChild>
                    <Link to='/findings'>
                      View all <ArrowRight />
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {findings.data && accounts.data ? (
                  <TopRisks findings={findings.data} accounts={accounts.data} />
                ) : (
                  <ListSkeleton rows={5} />
                )}
              </CardContent>
            </Card>

            <Card className='lg:col-span-3'>
              <CardHeader>
                <CardTitle>Cloud accounts</CardTitle>
                <CardDescription>
                  Connection health and coverage
                </CardDescription>
                <CardAction>
                  <Button variant='ghost' size='sm' asChild>
                    <Link to='/accounts'>
                      Manage <ArrowRight />
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {accounts.data ? (
                  <AccountSummary accounts={accounts.data} />
                ) : (
                  <ListSkeleton rows={3} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}

function ScoreDelta({ delta }: { delta: number }) {
  if (delta === 0)
    return (
      <span className='text-muted-foreground text-xs'>
        No change in 30 days
      </span>
    )
  const up = delta > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        up ? 'text-success' : 'text-destructive'
      )}
    >
      <Icon className='size-3.5' aria-hidden />
      {up ? '+' : ''}
      {delta} in 30 days
    </span>
  )
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className='space-y-4'>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className='flex items-center gap-3'>
          <Skeleton className='h-6 w-8' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-3.5 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
        </div>
      ))}
    </div>
  )
}
