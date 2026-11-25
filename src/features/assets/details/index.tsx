import { useMemo } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type Finding } from '@/types/cspm'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
} from 'lucide-react'
import { cspmQueries } from '@/lib/api/queries'
import { resourceTypeMeta } from '@/lib/assets'
import { compareSeverity } from '@/lib/severity'
import { Badge } from '@/components/ui/badge'
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
import { CopyButton } from '@/components/cspm/copy-button'
import { EmptyState } from '@/components/cspm/empty-state'
import { SeverityBadge } from '@/components/cspm/severity-badge'
import { StatusBadge } from '@/components/cspm/status-badge'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import {
  AccessKeys,
  ConfigurationList,
  PolicyList,
  SecurityGroupRules,
} from './configuration'

const isOpen = (f: Finding) => f.status === 'open' || f.status === 'in_progress'

export function AssetDetails({ assetId }: { assetId: string }) {
  const asset = useQuery(cspmQueries.asset(assetId))
  const accounts = useQuery(cspmQueries.accounts())
  const findings = useQuery(cspmQueries.findings())

  const assetFindings = useMemo(
    () => (findings.data ?? []).filter((f) => f.assetId === assetId),
    [findings.data, assetId]
  )
  const open = assetFindings
    .filter(isOpen)
    .sort((a, b) => compareSeverity(a.severity, b.severity))
  const closed = assetFindings.length - open.length

  if (asset.isError) {
    return (
      <>
        <AppHeader />
        <Main>
          <EmptyState
            icon={AlertTriangle}
            title='Asset not found'
            description='It may have been deleted, or its account disconnected.'
            action={
              <Button asChild variant='outline'>
                <Link to='/assets'>Back to asset inventory</Link>
              </Button>
            }
          />
        </Main>
      </>
    )
  }

  const a = asset.data
  const account = accounts.data?.find((acc) => acc.id === a?.accountId)
  const meta = a ? resourceTypeMeta(a.resourceType) : undefined
  const Icon = meta?.icon
  const config = a?.configuration

  return (
    <>
      <AppHeader />
      <Main>
        <Button asChild variant='ghost' size='sm' className='-ms-2 mb-2'>
          <Link to='/assets'>
            <ArrowLeft /> Asset inventory
          </Link>
        </Button>

        {/* Heading */}
        {a && meta && Icon ? (
          <div className='mb-6 flex min-w-0 items-start gap-3'>
            <span className='bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg'>
              <Icon className='text-muted-foreground size-6' aria-hidden />
            </span>
            <div className='min-w-0 space-y-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='truncate text-2xl font-bold tracking-tight'>
                  {a.name}
                </h1>
                {a.publiclyExposed ? (
                  <Badge
                    variant='outline'
                    className='border-severity-high/40 text-severity-high-ink'
                  >
                    <Globe /> Public
                  </Badge>
                ) : (
                  <Badge variant='outline' className='text-muted-foreground'>
                    <Lock /> Private
                  </Badge>
                )}
              </div>
              <p className='text-muted-foreground text-sm'>
                {meta.label} ·{' '}
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
                )}{' '}
                · {a.region}
              </p>
              <div className='flex min-w-0 items-center gap-1'>
                <code
                  className='text-muted-foreground truncate text-xs'
                  title={a.resourceId}
                >
                  {a.resourceId}
                </code>
                <CopyButton value={a.resourceId} label='Resource ID' />
              </div>
            </div>
          </div>
        ) : (
          <div className='mb-6 flex items-center gap-3'>
            <Skeleton className='size-12 rounded-lg' />
            <div className='space-y-2'>
              <Skeleton className='h-7 w-48' />
              <Skeleton className='h-4 w-72' />
            </div>
          </div>
        )}

        <div className='grid gap-4 *:min-w-0 lg:grid-cols-3'>
          {/* Main column */}
          <div className='space-y-4 *:min-w-0 lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Security-relevant settings from the latest scan. Risky values
                  are marked.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {config ? (
                  <ConfigurationList config={config} />
                ) : (
                  <Skeleton className='h-48 w-full' />
                )}
              </CardContent>
            </Card>

            {config?.kind === 'security_group' && (
              <Card>
                <CardHeader>
                  <CardTitle>Inbound rules</CardTitle>
                  <CardDescription>
                    Traffic this group allows in. Web ports (80, 443) open to
                    the internet are expected for load balancers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecurityGroupRules rules={config.inboundRules} />
                </CardContent>
              </Card>
            )}

            {config?.kind === 'iam_user' && (
              <Card>
                <CardHeader>
                  <CardTitle>Access keys</CardTitle>
                  <CardDescription>
                    Long-lived keys should be rotated at least every 90 days.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AccessKeys keys={config.accessKeys} />
                </CardContent>
              </Card>
            )}

            {(config?.kind === 'iam_user' || config?.kind === 'iam_role') && (
              <Card>
                <CardHeader>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>Attached policies.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PolicyList policies={config.policies} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side column */}
          <div className='space-y-4 *:min-w-0'>
            <Card>
              <CardHeader>
                <CardTitle>Open findings</CardTitle>
                <CardDescription>
                  {findings.data
                    ? open.length === 0
                      ? 'Nothing to fix on this asset.'
                      : `${open.length} to fix`
                    : 'Loading…'}
                </CardDescription>
                <CardAction>
                  <Button asChild variant='ghost' size='sm'>
                    <Link to='/findings'>
                      All findings <ArrowRight />
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {!findings.data ? (
                  <Skeleton className='h-32 w-full' />
                ) : open.length === 0 ? (
                  <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <CheckCircle2 className='text-success size-4' aria-hidden />
                    No open findings
                  </p>
                ) : (
                  <ul className='divide-y'>
                    {open.map((f) => (
                      <li key={f.id} className='space-y-1.5 py-3 first:pt-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <SeverityBadge severity={f.severity} />
                          {f.status === 'in_progress' && (
                            <StatusBadge status={f.status} />
                          )}
                        </div>
                        <p className='text-sm font-medium'>{f.title}</p>
                        <p className='text-muted-foreground text-xs'>
                          {f.remediation.summary}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {f.complianceRefs.join(' · ')}
                          {f.complianceRefs.length > 0 && ' · '}
                          First seen{' '}
                          {formatDistanceToNow(new Date(f.firstSeenAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {closed > 0 && (
                  <p className='text-muted-foreground mt-3 border-t pt-3 text-xs'>
                    {closed} resolved or suppressed finding
                    {closed === 1 ? '' : 's'} not shown.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                {a ? (
                  <dl className='space-y-3 text-sm'>
                    <div>
                      <dt className='text-muted-foreground text-xs'>
                        Resource type
                      </dt>
                      <dd className='font-mono text-xs'>{a.resourceType}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground text-xs'>
                        Last seen
                      </dt>
                      <dd>
                        {format(new Date(a.lastSeenAt), 'd MMM yyyy, HH:mm')}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground text-xs'>Tags</dt>
                      <dd className='mt-1'>
                        {Object.keys(a.tags).length === 0 ? (
                          <span className='text-muted-foreground'>No tags</span>
                        ) : (
                          <ul className='flex flex-wrap gap-1.5'>
                            {Object.entries(a.tags).map(([k, v]) => (
                              <li key={k}>
                                <Badge
                                  variant='secondary'
                                  className='font-mono'
                                >
                                  {k}: {v}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <Skeleton className='h-24 w-full' />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
