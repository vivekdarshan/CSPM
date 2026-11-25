import { useState } from 'react'
import { formatDistanceToNow, subDays } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { type Finding, type RemediationAction } from '@/types/cspm'
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Hammer,
  Loader2,
  Users,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { updateRemediationSettings } from '@/lib/api/cspm-api'
import { cspmQueries } from '@/lib/api/queries'
import { isOpenFinding } from '@/lib/findings'
import { canApprove, isActiveRemediation, isInFlight } from '@/lib/remediation'
import { compareSeverity } from '@/lib/severity'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/cspm/empty-state'
import { PageHeading } from '@/components/cspm/page-heading'
import { RemediationStatusBadge } from '@/components/cspm/remediation-status-badge'
import { SeverityBadge } from '@/components/cspm/severity-badge'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { RequestFixDialog } from './components/auto-fix-panel'

const route = getRouteApi('/_authenticated/remediation/')

type Tab = 'approval' | 'active' | 'ready' | 'history'

export function Remediation() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const user = useAuthStore((s) => s.auth.user)
  const remediations = useQuery(cspmQueries.remediations())
  const findings = useQuery(cspmQueries.findings())
  const accounts = useQuery(cspmQueries.accounts())
  const settings = useQuery(cspmQueries.remediationSettings())

  const ready =
    remediations.data && findings.data && accounts.data && settings.data

  const tab: Tab = search.tab ?? 'approval'
  const setTab = (t: Tab) =>
    navigate({
      search: (prev) => ({ ...prev, tab: t === 'approval' ? undefined : t }),
    })

  if (!ready) {
    return (
      <>
        <AppHeader />
        <Main>
          <PageHeading title='Remediation' />
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className='h-24 rounded-xl' />
              ))}
            </div>
            <Skeleton className='h-80 rounded-xl' />
          </div>
        </Main>
      </>
    )
  }

  const all = remediations.data
  const accountNames = new Map(accounts.data.map((a) => [a.id, a.name]))
  const enabledAccounts = new Set(
    accounts.data.filter((a) => a.remediationRoleArn).map((a) => a.id)
  )
  const pending = all.filter((r) => r.status === 'pending_approval')
  const running = all.filter(isInFlight)
  const history = all.filter((r) => !isActiveRemediation(r))
  const monthAgo = subDays(new Date(), 30).toISOString()
  const fixedThisMonth = all.filter(
    (r) => r.status === 'completed' && (r.decidedAt ?? r.requestedAt) > monthAgo
  ).length
  const busyFindings = new Set(
    all.filter(isActiveRemediation).map((r) => r.findingId)
  )
  const readyToFix = findings.data
    .filter(
      (f) =>
        isOpenFinding(f) &&
        f.remediation.automatable &&
        enabledAccounts.has(f.accountId) &&
        !busyFindings.has(f.id)
    )
    .sort((a, b) => compareSeverity(a.severity, b.severity))
  const waitingOnMe = pending.filter((r) =>
    canApprove(r, user?.name, settings.data.requireSecondApprover)
  ).length

  const tiles: {
    id: Tab
    label: string
    value: number
    hint: string
    icon: React.ElementType
  }[] = [
    {
      id: 'approval',
      label: 'Needs approval',
      value: pending.length,
      hint: waitingOnMe
        ? `${waitingOnMe} waiting on you`
        : 'None waiting on you',
      icon: Clock,
    },
    {
      id: 'active',
      label: 'Running now',
      value: running.length,
      hint: 'Applying or verifying',
      icon: Loader2,
    },
    {
      id: 'ready',
      label: 'Ready to fix',
      value: readyToFix.length,
      hint: 'Open findings with a one-step fix',
      icon: Zap,
    },
    {
      id: 'history',
      label: 'Fixed in 30 days',
      value: fixedThisMonth,
      hint: 'Verified by a re-scan',
      icon: CheckCircle2,
    },
  ]

  const list: RemediationAction[] =
    tab === 'approval' ? pending : tab === 'active' ? running : history

  return (
    <>
      <AppHeader />
      <Main>
        <PageHeading
          title='Remediation'
          description='Fix findings automatically. Every change is shown up front, approved by a person, then confirmed by a re-scan.'
        />

        <div className='mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {tiles.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type='button'
                aria-pressed={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'bg-card hover:bg-muted/50 rounded-xl border p-4 text-start transition-colors',
                  'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
                  tab === t.id && 'border-primary ring-primary/20 ring-2'
                )}
              >
                <div className='text-muted-foreground flex items-center justify-between text-xs font-medium'>
                  {t.label}
                  <Icon
                    className={cn(
                      'size-4',
                      t.id === 'active' && t.value > 0 && 'animate-spin'
                    )}
                    aria-hidden
                  />
                </div>
                <div className='mt-2 text-2xl font-bold tabular-nums'>
                  {t.value}
                </div>
                <div className='text-muted-foreground mt-0.5 text-xs'>
                  {t.hint}
                </div>
              </button>
            )
          })}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className='mb-4'>
            <TabsTrigger value='approval'>Needs approval</TabsTrigger>
            <TabsTrigger value='active'>Running</TabsTrigger>
            <TabsTrigger value='ready'>Ready to fix</TabsTrigger>
            <TabsTrigger value='history'>History</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'ready' ? (
          <ReadyToFix
            findings={readyToFix}
            accountNames={accountNames}
            needsSecondApprover={settings.data.requireSecondApprover}
            disabledAccounts={accounts.data.filter(
              (a) => !a.remediationRoleArn
            )}
          />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Hammer}
            title={
              tab === 'approval'
                ? 'Nothing waiting for approval'
                : tab === 'active'
                  ? 'No fixes running'
                  : 'No fixes yet'
            }
            description='Request a fix from any finding marked as fixable, or from the Ready to fix tab.'
          />
        ) : (
          <Card className='gap-0 p-0'>
            <ul className='divide-y'>
              {list.map((r) => (
                <li key={r.id}>
                  <Link
                    to='/remediation/$actionId'
                    params={{ actionId: r.id }}
                    className='hover:bg-muted/50 flex items-center gap-3 p-4'
                  >
                    <div className='min-w-0 flex-1 space-y-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <RemediationStatusBadge status={r.status} />
                        <SeverityBadge severity={r.severity} />
                        {r.status === 'pending_approval' &&
                          canApprove(
                            r,
                            user?.name,
                            settings.data.requireSecondApprover
                          ) && (
                            <span className='text-severity-medium-ink text-xs font-medium'>
                              Your approval needed
                            </span>
                          )}
                      </div>
                      <p className='font-medium'>{r.findingTitle}</p>
                      <p className='text-muted-foreground text-xs'>
                        {r.resourceName} · {accountNames.get(r.accountId)} ·
                        requested by {r.requestedBy}{' '}
                        {formatDistanceToNow(new Date(r.requestedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <ChevronRight
                      className='text-muted-foreground size-4 shrink-0'
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <ApprovalPolicy
          requireSecondApprover={settings.data.requireSecondApprover}
        />
      </Main>
    </>
  )
}

function ReadyToFix({
  findings,
  accountNames,
  needsSecondApprover,
  disabledAccounts,
}: {
  findings: Finding[]
  accountNames: Map<string, string>
  needsSecondApprover: boolean
  disabledAccounts: { id: string; name: string }[]
}) {
  const [selected, setSelected] = useState<Finding | null>(null)
  return (
    <div className='space-y-3'>
      {findings.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title='Nothing ready to fix'
          description='Every open finding that can be fixed automatically already has a fix in progress.'
        />
      ) : (
        <Card className='gap-0 p-0'>
          <ul className='divide-y'>
            {findings.map((f) => (
              <li
                key={f.id}
                className='flex flex-wrap items-center gap-x-3 gap-y-2 p-4'
              >
                <div className='min-w-0 flex-1 space-y-1'>
                  <SeverityBadge severity={f.severity} />
                  <Link
                    to='/findings/$findingId'
                    params={{ findingId: f.id }}
                    className='block font-medium hover:underline'
                  >
                    {f.title}
                  </Link>
                  <p className='text-muted-foreground text-xs'>
                    {f.resourceName} · {accountNames.get(f.accountId)}
                  </p>
                </div>
                <Button size='sm' onClick={() => setSelected(f)}>
                  <Zap /> Fix
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {disabledAccounts.length > 0 && (
        <p className='text-muted-foreground text-sm'>
          Automatic fixes are off for{' '}
          {disabledAccounts.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ', '}
              <Link
                to='/accounts/$accountId'
                params={{ accountId: a.id }}
                className='text-foreground underline underline-offset-4'
              >
                {a.name}
              </Link>
            </span>
          ))}
          , so its findings aren't listed here.
        </p>
      )}
      {selected && (
        <RequestFixDialog
          finding={selected}
          open
          onOpenChange={(o) => !o && setSelected(null)}
          needsSecondApprover={needsSecondApprover}
        />
      )}
    </div>
  )
}

function ApprovalPolicy({
  requireSecondApprover,
}: {
  requireSecondApprover: boolean
}) {
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: (value: boolean) =>
      updateRemediationSettings({ requireSecondApprover: value }),
    onSuccess: (s) => {
      toast.success(
        s.requireSecondApprover
          ? 'Fixes now need a second person to approve'
          : 'Requesters can now approve their own fixes'
      )
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <Card className='mt-8'>
      <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
        <div className='space-y-1'>
          <CardTitle className='flex items-center gap-2'>
            <Users className='text-muted-foreground size-4' aria-hidden />
            <label htmlFor='second-approver'>
              Require a second person to approve
            </label>
          </CardTitle>
          <CardDescription>
            Recommended. The person who requests a fix can't approve it. Turn
            this off only if one person manages security on their own.
          </CardDescription>
        </div>
        <Switch
          id='second-approver'
          checked={requireSecondApprover}
          disabled={save.isPending}
          onCheckedChange={(v) => save.mutate(v)}
        />
      </CardHeader>
      {!requireSecondApprover && (
        <CardContent>
          <p className='text-severity-medium-ink text-sm'>
            Anyone can request and approve their own fixes. Every change is
            still shown in full first and recorded in the activity log.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
