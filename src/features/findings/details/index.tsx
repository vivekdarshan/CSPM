import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Crosshair,
  Globe,
  Info,
  Lock,
} from 'lucide-react'
import { cspmQueries } from '@/lib/api/queries'
import { resourceTypeMeta } from '@/lib/assets'
import {
  CATEGORY_LABELS,
  EFFORT_LABELS,
  EXPLOITABILITY_LABELS,
  IMPACT_LABELS,
} from '@/lib/findings'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/cspm/copy-button'
import { EmptyState } from '@/components/cspm/empty-state'
import { SeverityBadge } from '@/components/cspm/severity-badge'
import { StatusBadge } from '@/components/cspm/status-badge'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { AutoFixPanel } from '@/features/remediation/components/auto-fix-panel'
import { Activity } from './activity'
import { StatusActions } from './status-actions'

const EXPLOIT_TONE = {
  easy: 'text-destructive',
  moderate: 'text-severity-high-ink',
  hard: 'text-muted-foreground',
} as const

export function FindingDetails({ findingId }: { findingId: string }) {
  const finding = useQuery(cspmQueries.finding(findingId))
  const assets = useQuery(cspmQueries.assets())
  const accounts = useQuery(cspmQueries.accounts())

  if (finding.isError) {
    return (
      <>
        <AppHeader />
        <Main>
          <EmptyState
            icon={AlertTriangle}
            title='Finding not found'
            description='It may belong to an account that was disconnected.'
            action={
              <Button asChild variant='outline'>
                <Link to='/findings'>Back to findings</Link>
              </Button>
            }
          />
        </Main>
      </>
    )
  }

  const f = finding.data
  const asset = assets.data?.find((a) => a.id === f?.assetId)
  const account = accounts.data?.find((a) => a.id === f?.accountId)
  const typeMeta = f ? resourceTypeMeta(f.resourceType) : undefined
  const TypeIcon = typeMeta?.icon

  return (
    <>
      <AppHeader />
      <Main>
        <Button asChild variant='ghost' size='sm' className='-ms-2 mb-2'>
          <Link to='/findings'>
            <ArrowLeft /> Findings
          </Link>
        </Button>

        {/* Heading */}
        {f ? (
          <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
            <div className='min-w-0 space-y-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <SeverityBadge severity={f.severity} />
                <StatusBadge status={f.status} />
                <Badge variant='outline' className='text-muted-foreground'>
                  {CATEGORY_LABELS[f.category]}
                </Badge>
              </div>
              <h1 className='text-2xl font-bold tracking-tight'>{f.title}</h1>
              <p className='text-muted-foreground text-sm'>
                <Link
                  to='/assets/$assetId'
                  params={{ assetId: f.assetId }}
                  className='hover:text-foreground underline underline-offset-4'
                >
                  {f.resourceName}
                </Link>
                {' · '}
                {account ? (
                  <Link
                    to='/accounts/$accountId'
                    params={{ accountId: account.id }}
                    className='hover:text-foreground underline underline-offset-4'
                  >
                    {account.name}
                  </Link>
                ) : (
                  'Unknown account'
                )}
                {' · '}
                {f.region} · <span className='font-mono'>{f.ruleId}</span>
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <StatusActions finding={f} />
            </div>
          </div>
        ) : (
          <div className='mb-6 space-y-3'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-8 w-96 max-w-full' />
            <Skeleton className='h-4 w-72' />
          </div>
        )}

        {f?.status === 'resolved' && (
          <Alert className='border-success/40 bg-success/5 mb-6'>
            <Info className='text-success' />
            <AlertTitle>Fixed</AlertTitle>
            <AlertDescription>
              A scan confirmed this is no longer a problem. It reopens
              automatically if a later scan finds it again.
            </AlertDescription>
          </Alert>
        )}
        {f?.status === 'suppressed' && (
          <Alert className='mb-6'>
            <Info />
            <AlertTitle>Suppressed</AlertTitle>
            <AlertDescription>
              This finding doesn't count towards your posture score or alerts.
              See the activity log for who suppressed it and why.
            </AlertDescription>
          </Alert>
        )}

        {f ? (
          <div className='grid gap-4 *:min-w-0 lg:grid-cols-3'>
            {/* Main column */}
            <div className='space-y-4 *:min-w-0 lg:col-span-2'>
              <Card>
                <CardHeader>
                  <CardTitle>What we found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm leading-relaxed'>{f.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Why it matters</CardTitle>
                </CardHeader>
                <CardContent className='space-y-5'>
                  <p className='text-sm leading-relaxed'>
                    {f.risk.whyItMatters}
                  </p>
                  <div className='bg-muted/40 flex gap-3 rounded-lg border p-4'>
                    <Crosshair
                      className='text-muted-foreground mt-0.5 size-4 shrink-0'
                      aria-hidden
                    />
                    <div className='space-y-1 text-sm'>
                      <p className='font-medium'>How it could be exploited</p>
                      <p className='text-muted-foreground'>
                        {f.risk.attackScenario}
                      </p>
                    </div>
                  </div>
                  <dl className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-1.5'>
                      <dt className='text-muted-foreground text-xs font-medium'>
                        Possible impact
                      </dt>
                      <dd className='flex flex-wrap gap-1.5'>
                        {f.risk.impacts.map((i) => (
                          <Badge key={i} variant='secondary'>
                            {IMPACT_LABELS[i]}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                    <div className='space-y-1'>
                      <dt className='text-muted-foreground text-xs font-medium'>
                        Exploitability
                      </dt>
                      <dd>
                        <p
                          className={cn(
                            'text-sm font-medium',
                            EXPLOIT_TONE[f.risk.exploitability]
                          )}
                        >
                          {EXPLOITABILITY_LABELS[f.risk.exploitability].label}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {EXPLOITABILITY_LABELS[f.risk.exploitability].detail}
                        </p>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How to fix</CardTitle>
                  <CardDescription>{f.remediation.summary}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-5'>
                  <AutoFixPanel finding={f} />

                  {f.remediation.effort && (
                    <p className='text-muted-foreground inline-flex items-center gap-1.5 text-sm'>
                      <Clock className='size-4' aria-hidden />
                      Effort to fix by hand:{' '}
                      <span className='text-foreground font-medium'>
                        {EFFORT_LABELS[f.remediation.effort]}
                      </span>
                    </p>
                  )}

                  {f.remediation.steps.length > 0 && (
                    <div className='space-y-2'>
                      <h3 className='text-sm font-medium'>
                        In the AWS console
                      </h3>
                      <ol className='space-y-2'>
                        {f.remediation.steps.map((step, i) => (
                          <li key={i} className='flex gap-3 text-sm'>
                            <span
                              aria-hidden
                              className='bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold'
                            >
                              {i + 1}
                            </span>
                            <span className='pt-0.5'>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {f.remediation.cliCommand && (
                    <div className='space-y-2'>
                      <h3 className='text-sm font-medium'>With the AWS CLI</h3>
                      <div className='relative'>
                        <pre className='bg-muted/50 overflow-x-auto rounded-md border p-3 pe-10 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap'>
                          {f.remediation.cliCommand}
                        </pre>
                        <CopyButton
                          value={f.remediation.cliCommand}
                          label='Command'
                          className='absolute end-1.5 top-1.5'
                        />
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Check the command and replace any{' '}
                        <code>&lt;placeholders&gt;</code> before running it.
                      </p>
                    </div>
                  )}

                  {f.status !== 'resolved' && f.status !== 'suppressed' && (
                    <p className='text-muted-foreground border-t pt-4 text-xs'>
                      After you fix it, the next scan of{' '}
                      {account ? (
                        <Link
                          to='/accounts/$accountId'
                          params={{ accountId: account.id }}
                          className='hover:text-foreground underline underline-offset-4'
                        >
                          {account.name}
                        </Link>
                      ) : (
                        'the account'
                      )}{' '}
                      verifies the change and marks this finding resolved.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Side column */}
            <div className='space-y-4 *:min-w-0'>
              <Card>
                <CardHeader>
                  <CardTitle>Affected resource</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    {TypeIcon && (
                      <span className='bg-muted flex size-10 shrink-0 items-center justify-center rounded-md'>
                        <TypeIcon
                          className='text-muted-foreground size-5'
                          aria-hidden
                        />
                      </span>
                    )}
                    <div className='min-w-0'>
                      <p className='truncate font-medium'>{f.resourceName}</p>
                      <p className='text-muted-foreground text-xs'>
                        {typeMeta?.label} · {f.region}
                      </p>
                    </div>
                  </div>
                  {asset && (
                    <p className='text-sm'>
                      {asset.publiclyExposed ? (
                        <span className='text-severity-high-ink inline-flex items-center gap-1.5 font-medium'>
                          <Globe className='size-4' aria-hidden /> Internet
                          facing
                        </span>
                      ) : (
                        <span className='text-muted-foreground inline-flex items-center gap-1.5'>
                          <Lock className='size-4' aria-hidden /> Private
                        </span>
                      )}
                      {asset.openFindingCount > 1 && (
                        <span className='text-muted-foreground'>
                          {' '}
                          · {asset.openFindingCount} open findings
                        </span>
                      )}
                    </p>
                  )}
                  <Button
                    asChild
                    variant='outline'
                    size='sm'
                    className='w-full'
                  >
                    <Link to='/assets/$assetId' params={{ assetId: f.assetId }}>
                      View configuration <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  {f.complianceRefs.length ? (
                    <ul className='flex flex-wrap gap-1.5'>
                      {f.complianceRefs.map((ref) => (
                        <li key={ref}>
                          <Badge variant='outline' className='font-mono'>
                            {ref}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      Best practice; not mapped to a CIS control.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Activity events={f.history} lastSeenAt={f.lastSeenAt} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className='grid gap-4 lg:grid-cols-3'>
            <Skeleton className='h-96 lg:col-span-2' />
            <Skeleton className='h-96' />
          </div>
        )}
      </Main>
    </>
  )
}
