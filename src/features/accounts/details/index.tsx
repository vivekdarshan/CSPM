import { useEffect, useMemo, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { APP_CONFIG } from '@/config/app'
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Clock,
  Globe2,
  Loader2,
  MoreHorizontal,
  Pencil,
  PlugZap,
  Radar,
  ShieldAlert,
  Unplug,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  countBySeverity,
  startAccountScan,
  testAccountConnection,
} from '@/lib/api/cspm-api'
import { cspmQueries } from '@/lib/api/queries'
import { ENVIRONMENT_LABELS, regionName } from '@/lib/aws'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyField } from '@/components/cspm/copy-button'
import { EmptyState } from '@/components/cspm/empty-state'
import { ProviderIcon } from '@/components/cspm/provider-icon'
import { SeverityBreakdown } from '@/components/cspm/severity-breakdown'
import { StatCard } from '@/components/cspm/stat-card'
import { StatusBadge } from '@/components/cspm/status-badge'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { AutoFixCard } from '../components/auto-fix-card'
import { ConnectionChecks } from '../components/connection-checks'
import { DisconnectDialog } from '../components/disconnect-dialog'
import { EditAccountDialog } from '../components/edit-account-dialog'
import { ScanHistory } from '../components/scan-history'

/** "Just now" for the first minute, then "5 minutes ago" etc. */
const sinceLabel = (iso: string) =>
  Date.now() - new Date(iso).getTime() < 60_000
    ? 'Just now'
    : formatDistanceToNow(new Date(iso), { addSuffix: true })

const isOpen = (status: string) => status === 'open' || status === 'in_progress'

export function AccountDetails({ accountId }: { accountId: string }) {
  const queryClient = useQueryClient()
  const account = useQuery(cspmQueries.account(accountId))
  const scans = useQuery(cspmQueries.accountScans(accountId))
  const findings = useQuery(cspmQueries.findings())
  const [editOpen, setEditOpen] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)

  const runningScan = scans.data?.find((s) => s.status === 'running')

  // When a scan finishes, refresh everything it may have changed
  const wasRunning = useRef(false)
  useEffect(() => {
    if (wasRunning.current && !runningScan) {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['findings'] })
      queryClient.invalidateQueries({ queryKey: ['posture'] })
      const latest = scans.data?.[0]
      if (latest?.status === 'succeeded') toast.success('Scan complete')
      if (latest?.status === 'failed')
        toast.error('Scan failed', { description: latest.error })
    }
    wasRunning.current = Boolean(runningScan)
  }, [runningScan, scans.data, queryClient])

  const test = useMutation({
    mutationFn: () => testAccountConnection(accountId),
    onSuccess: (result) => {
      if (result.ok) toast.success('Connection is healthy')
      else
        toast.error('Connection test failed', {
          description: 'See the failed check for details.',
        })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const scan = useMutation({
    mutationFn: () => startAccountScan(accountId),
    onSuccess: () => {
      toast.success('Scan started')
      queryClient.invalidateQueries({
        queryKey: ['accounts', accountId, 'scans'],
      })
    },
  })

  const severityCounts = useMemo(
    () =>
      countBySeverity(
        (findings.data ?? []).filter(
          (f) => f.accountId === accountId && isOpen(f.status)
        )
      ),
    [findings.data, accountId]
  )

  if (account.isError) {
    return (
      <>
        <AppHeader />
        <Main>
          <EmptyState
            icon={AlertTriangle}
            title='Account not found'
            description='It may have been disconnected.'
            action={
              <Button asChild variant='outline'>
                <Link to='/accounts'>Back to cloud accounts</Link>
              </Button>
            }
          />
        </Main>
      </>
    )
  }

  const a = account.data
  const roleName = a?.connection?.roleArn.split('/').pop()
  const checks = test.data?.checks ?? a?.connection?.checks

  return (
    <>
      <AppHeader />
      <Main>
        <Button asChild variant='ghost' size='sm' className='-ms-2 mb-2'>
          <Link to='/accounts'>
            <ArrowLeft /> Cloud accounts
          </Link>
        </Button>

        {/* Heading */}
        <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
          {a ? (
            <div className='flex min-w-0 items-center gap-3'>
              <ProviderIcon provider={a.provider} size='lg' />
              <div className='min-w-0 space-y-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h1 className='truncate text-2xl font-bold tracking-tight'>
                    {a.name}
                  </h1>
                  <StatusBadge status={a.status} />
                </div>
                <p className='text-muted-foreground text-sm'>
                  <span className='font-mono'>{a.externalId}</span> ·{' '}
                  {ENVIRONMENT_LABELS[a.environment]} · Connected{' '}
                  {format(new Date(a.connectedAt), 'd MMM yyyy')}
                </p>
              </div>
            </div>
          ) : (
            <div className='flex items-center gap-3'>
              <Skeleton className='h-10 w-12' />
              <div className='space-y-2'>
                <Skeleton className='h-7 w-48' />
                <Skeleton className='h-4 w-64' />
              </div>
            </div>
          )}
          {a && (
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                onClick={() => test.mutate()}
                disabled={test.isPending}
              >
                {test.isPending ? (
                  <Loader2 className='animate-spin' />
                ) : (
                  <PlugZap />
                )}
                Test connection
              </Button>
              <Button
                onClick={() => scan.mutate()}
                disabled={
                  a.status !== 'connected' || !!runningScan || scan.isPending
                }
                title={
                  a.status !== 'connected'
                    ? 'Fix the connection before scanning'
                    : undefined
                }
              >
                {runningScan || scan.isPending ? (
                  <Loader2 className='animate-spin' />
                ) : (
                  <Radar />
                )}
                {runningScan ? 'Scanning…' : 'Run scan'}
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label='More actions'
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <Pencil /> Edit settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant='destructive'
                    onSelect={() => setDisconnectOpen(true)}
                  >
                    <Unplug /> Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Problems and progress */}
        {a?.status === 'error' && (
          <Alert variant='destructive' className='mb-6'>
            <AlertTriangle />
            <AlertTitle>{APP_CONFIG.name} can't reach this account</AlertTitle>
            <AlertDescription>
              <p>{a.statusMessage}</p>
              <ol className='text-foreground mt-2 list-decimal space-y-1 ps-4'>
                <li>
                  In the AWS IAM console, open the role
                  {roleName && (
                    <span className='font-mono'> {roleName}</span>
                  )}{' '}
                  and choose <strong>Trust relationships</strong>.
                </li>
                <li>
                  Check that the{' '}
                  <span className='font-mono'>sts:ExternalId</span> condition
                  matches the external ID under Connection details. If you used
                  CloudFormation, update the stack's ExternalId parameter
                  instead.
                </li>
                <li>
                  Choose <strong>Test connection</strong> here.
                </li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
        {runningScan && (
          <Alert className='mb-6'>
            <Loader2 className='animate-spin' />
            <AlertTitle>Scan in progress</AlertTitle>
            <AlertDescription>
              Started{' '}
              {formatDistanceToNow(new Date(runningScan.startedAt), {
                addSuffix: true,
              })}
              . This page updates when it finishes.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className='mb-6 grid gap-4 *:min-w-0 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Open findings'
            icon={ShieldAlert}
            loading={!a}
            value={a?.openFindingCount}
            description={
              a &&
              `${severityCounts.critical} critical · ${severityCounts.high} high`
            }
          />
          <StatCard
            title='Assets'
            icon={Boxes}
            loading={!a}
            value={a?.assetCount}
            description={
              a && a.assetCount > 0 ? (
                <Link
                  to='/assets'
                  search={{ account: [a.id] }}
                  className='hover:text-foreground underline underline-offset-4'
                >
                  View in asset inventory
                </Link>
              ) : (
                'Resources found in the last scan'
              )
            }
          />
          <StatCard
            title='Regions'
            icon={Globe2}
            loading={!a}
            value={a?.regions.length}
            description={a?.regions.join(', ')}
          />
          <StatCard
            title='Last scan'
            icon={Clock}
            loading={!a}
            value={
              <span className='text-xl'>
                {a?.lastScanAt ? sinceLabel(a.lastScanAt) : 'Never'}
              </span>
            }
            description={
              a?.lastScanAt
                ? format(new Date(a.lastScanAt), 'd MMM yyyy, HH:mm')
                : 'Run a scan to see results'
            }
          />
        </div>

        <div className='grid gap-4 *:min-w-0 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Connection health</CardTitle>
              <CardDescription>
                {a?.connection?.lastCheckedAt
                  ? `Last checked ${formatDistanceToNow(
                      new Date(
                        test.data?.checkedAt ?? a.connection.lastCheckedAt
                      ),
                      { addSuffix: true }
                    )}`
                  : 'Not checked yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {a ? (
                <ConnectionChecks running={test.isPending} checks={checks} />
              ) : (
                <Skeleton className='h-40 w-full' />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection details</CardTitle>
              <CardDescription>
                Read-only IAM role {APP_CONFIG.name} assumes to scan.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {a ? (
                <>
                  {a.connection && (
                    <>
                      <CopyField
                        label='Role ARN'
                        value={a.connection.roleArn}
                      />
                      <CopyField
                        label='External ID'
                        value={a.connection.trustExternalId}
                      />
                    </>
                  )}
                  <div className='space-y-1.5'>
                    <div className='text-muted-foreground text-xs font-medium'>
                      Regions scanned
                    </div>
                    <div className='flex flex-wrap gap-1.5'>
                      {a.regions.map((r) => (
                        <Badge
                          key={r}
                          variant='secondary'
                          title={regionName(r)}
                        >
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Skeleton className='h-40 w-full' />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open findings by severity</CardTitle>
              <CardDescription>From the latest scan</CardDescription>
            </CardHeader>
            <CardContent>
              {findings.data ? (
                <SeverityBreakdown counts={severityCounts} />
              ) : (
                <Skeleton className='h-28 w-full' />
              )}
            </CardContent>
          </Card>

          {a && <AutoFixCard account={a} />}

          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Scan history</CardTitle>
              <CardDescription>
                Scheduled daily; run one any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scans.data ? (
                <ScanHistory scans={scans.data} />
              ) : (
                <Skeleton className='h-48 w-full' />
              )}
            </CardContent>
          </Card>
        </div>

        {a && (
          <>
            <EditAccountDialog
              account={a}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
            <DisconnectDialog
              account={a}
              open={disconnectOpen}
              onOpenChange={setDisconnectOpen}
            />
          </>
        )}
      </Main>
    </>
  )
}
