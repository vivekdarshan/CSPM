import { useEffect, useRef, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type RemediationEvent } from '@/types/cspm'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import {
  approveRemediation,
  cancelRemediation,
  rejectRemediation,
  rollbackRemediation,
} from '@/lib/api/cspm-api'
import { cspmQueries } from '@/lib/api/queries'
import { resourceTypeMeta } from '@/lib/assets'
import { canApprove, isInFlight } from '@/lib/remediation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/cspm/empty-state'
import { RemediationStatusBadge } from '@/components/cspm/remediation-status-badge'
import { SeverityBadge } from '@/components/cspm/severity-badge'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { ChangePlan } from '../components/change-plan'
import { Steps } from '../components/steps'

const EVENT_TEXT: Record<RemediationEvent['type'], string> = {
  requested: 'requested the fix',
  approved: 'approved it',
  rejected: 'rejected it',
  cancelled: 'cancelled the request',
  started: 'started applying the change',
  completed: 'finished applying the change',
  failed: 'could not apply the change',
  verified: 'confirmed the fix with a re-scan',
  rolled_back: 'rolled the change back',
}

const MIN_REASON = 10

export function RemediationDetails({ actionId }: { actionId: string }) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.auth.user)
  const action = useQuery(cspmQueries.remediation(actionId))
  const { data: accounts } = useQuery(cspmQueries.accounts())
  const { data: settings } = useQuery(cspmQueries.remediationSettings())
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmRollback, setConfirmRollback] = useState(false)

  const refreshEverything = () => {
    for (const key of [
      'remediations',
      'findings',
      'assets',
      'accounts',
      'posture',
      'compliance',
      'alerts',
    ]) {
      queryClient.invalidateQueries({ queryKey: [key] })
    }
  }

  // When a run finishes, everything it touched needs reloading
  const r = action.data
  const wasInFlight = useRef(false)
  useEffect(() => {
    if (!r) return
    const inFlight = isInFlight(r)
    if (wasInFlight.current && !inFlight) {
      refreshEverything()
      if (r.status === 'completed') toast.success('Fixed and verified')
      if (r.status === 'failed') toast.error('The fix failed')
    }
    wasInFlight.current = inFlight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r?.status])

  const onError = (e: Error) => toast.error(e.message)

  const approve = useMutation({
    mutationFn: () => approveRemediation(actionId),
    onSuccess: () => {
      toast.success('Approved. Applying the fix now.')
      refreshEverything()
    },
    onError,
  })
  const reject = useMutation({
    mutationFn: () => rejectRemediation(actionId, reason.trim()),
    onSuccess: () => {
      toast.success('Fix rejected')
      setRejecting(false)
      refreshEverything()
    },
    onError,
  })
  const cancel = useMutation({
    mutationFn: () => cancelRemediation(actionId),
    onSuccess: () => {
      toast.success('Request cancelled')
      refreshEverything()
    },
    onError,
  })
  const rollback = useMutation({
    mutationFn: () => rollbackRemediation(actionId),
    onSuccess: () => {
      toast.success('Change rolled back. The finding is open again.')
      setConfirmRollback(false)
      refreshEverything()
    },
    onError,
  })

  if (action.isError) {
    return (
      <>
        <AppHeader />
        <Main>
          <EmptyState
            icon={AlertTriangle}
            title='Fix not found'
            action={
              <Button asChild variant='outline'>
                <Link to='/remediation'>Back to remediation</Link>
              </Button>
            }
          />
        </Main>
      </>
    )
  }

  const account = accounts?.find((a) => a.id === r?.accountId)
  const mayApprove =
    r && canApprove(r, user?.name, settings?.requireSecondApprover ?? true)
  const isRequester = r && r.requestedBy === user?.name

  return (
    <>
      <AppHeader />
      <Main>
        <Button asChild variant='ghost' size='sm' className='-ms-2 mb-2'>
          <Link to='/remediation'>
            <ArrowLeft /> Remediation
          </Link>
        </Button>

        {!r ? (
          <div className='space-y-4'>
            <Skeleton className='h-8 w-96 max-w-full' />
            <Skeleton className='h-64 w-full' />
          </div>
        ) : (
          <>
            {/* Heading */}
            <div className='mb-6 space-y-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <RemediationStatusBadge status={r.status} />
                <SeverityBadge severity={r.severity} />
              </div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Fix: {r.findingTitle}
              </h1>
              <p className='text-muted-foreground text-sm'>
                <Link
                  to='/assets/$assetId'
                  params={{ assetId: r.assetId }}
                  className='hover:text-foreground underline underline-offset-4'
                >
                  {r.resourceName}
                </Link>{' '}
                ({resourceTypeMeta(r.resourceType).label}) ·{' '}
                {account?.name ?? 'Unknown account'} · {r.region} ·{' '}
                <Link
                  to='/findings/$findingId'
                  params={{ findingId: r.findingId }}
                  className='hover:text-foreground underline underline-offset-4'
                >
                  View finding
                </Link>
              </p>
            </div>

            {/* Approval */}
            {r.status === 'pending_approval' && (
              <Card className='border-severity-medium/50 mb-6'>
                <CardHeader>
                  <CardTitle>Waiting for approval</CardTitle>
                  <CardDescription>
                    Requested by {r.requestedBy}{' '}
                    {formatDistanceToNow(new Date(r.requestedAt), {
                      addSuffix: true,
                    })}
                    . Nothing has changed in AWS yet.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {r.note && (
                    <p className='bg-muted/50 rounded-md px-3 py-2 text-sm'>
                      “{r.note}”
                    </p>
                  )}
                  {mayApprove ? (
                    <div className='flex flex-wrap gap-2'>
                      <Button
                        onClick={() => approve.mutate()}
                        disabled={approve.isPending}
                      >
                        {approve.isPending ? (
                          <Loader2 className='animate-spin' />
                        ) : (
                          <ThumbsUp />
                        )}
                        Approve and run
                      </Button>
                      <Button
                        variant='outline'
                        onClick={() => setRejecting(true)}
                      >
                        <ThumbsDown /> Reject
                      </Button>
                      {isRequester && (
                        <Button
                          variant='ghost'
                          onClick={() => cancel.mutate()}
                          disabled={cancel.isPending}
                        >
                          Cancel request
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className='flex flex-wrap items-center gap-3'>
                      <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                        <Clock className='size-4' aria-hidden />
                        Another team member must approve this fix. They'll see
                        it in their alerts.
                      </p>
                      {isRequester && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => cancel.mutate()}
                          disabled={cancel.isPending}
                        >
                          Cancel request
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {r.status === 'rejected' && (
              <Alert className='mb-6'>
                <ThumbsDown />
                <AlertTitle>
                  Rejected by {r.decidedBy}
                  {r.decidedAt &&
                    ` ${formatDistanceToNow(new Date(r.decidedAt), { addSuffix: true })}`}
                </AlertTitle>
                <AlertDescription>
                  <p>{r.rejectionReason}</p>
                </AlertDescription>
              </Alert>
            )}

            {r.status === 'failed' && (
              <Alert variant='destructive' className='mb-6'>
                <XCircle />
                <AlertTitle>The fix could not be applied</AlertTitle>
                <AlertDescription>
                  <p>{r.error}</p>
                  <p className='text-foreground mt-1'>
                    Nothing was changed. Fix the cause, then request the fix
                    again from the{' '}
                    <Link
                      to='/findings/$findingId'
                      params={{ findingId: r.findingId }}
                      className='underline underline-offset-4'
                    >
                      finding
                    </Link>
                    .
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {r.status === 'completed' && r.verification && (
              <Alert className='border-success/40 bg-success/5 mb-6'>
                <ShieldCheck className='text-success' />
                <AlertTitle>Fixed and verified</AlertTitle>
                <AlertDescription>
                  <p>{r.verification.detail}</p>
                  {r.canRollBack && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='mt-2'
                      onClick={() => setConfirmRollback(true)}
                    >
                      <RotateCcw /> Roll back
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {r.status === 'rolled_back' && (
              <Alert className='mb-6'>
                <RotateCcw />
                <AlertTitle>Rolled back</AlertTitle>
                <AlertDescription>
                  The previous configuration was restored and the finding is
                  open again.
                </AlertDescription>
              </Alert>
            )}

            <div className='grid gap-4 *:min-w-0 lg:grid-cols-3'>
              <Card className='lg:col-span-2'>
                <CardHeader>
                  <CardTitle>The change</CardTitle>
                  <CardDescription>
                    Applied with the account's remediation role, which can only
                    make changes like these.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangePlan
                    changes={r.changes}
                    apiCalls={r.apiCalls}
                    warnings={r.warnings}
                    reversible={r.reversible}
                  />
                </CardContent>
              </Card>

              <div className='space-y-4 *:min-w-0'>
                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Steps steps={r.steps} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className='space-y-3'>
                      {[...r.events].reverse().map((e, i) => (
                        <li key={i} className='flex gap-2 text-sm'>
                          {e.type === 'verified' || e.type === 'completed' ? (
                            <CheckCircle2
                              className='text-success mt-0.5 size-4 shrink-0'
                              aria-hidden
                            />
                          ) : (
                            <span
                              aria-hidden
                              className='bg-muted-foreground/40 mt-1.5 size-2 shrink-0 rounded-full'
                            />
                          )}
                          <div className='min-w-0'>
                            <p>
                              <span className='font-medium'>{e.by}</span>{' '}
                              {EVENT_TEXT[e.type]}
                            </p>
                            {e.note && (
                              <p className='text-muted-foreground text-xs'>
                                “{e.note}”
                              </p>
                            )}
                            <time
                              dateTime={e.at}
                              title={format(
                                new Date(e.at),
                                'd MMM yyyy, HH:mm'
                              )}
                              className='text-muted-foreground text-xs'
                            >
                              {formatDistanceToNow(new Date(e.at), {
                                addSuffix: true,
                              })}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Dialog
              open={rejecting}
              onOpenChange={(o) => {
                if (!o) setReason('')
                setRejecting(o)
              }}
            >
              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle>Reject this fix?</DialogTitle>
                  <DialogDescription>
                    {r.requestedBy} will see your reason. The finding stays
                    open.
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-2'>
                  <Label htmlFor='reject-reason'>Reason (required)</Label>
                  <Textarea
                    id='reject-reason'
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder='e.g. This would break the nightly export; we will fix it by hand on Friday.'
                  />
                  <p className='text-muted-foreground text-xs'>
                    At least {MIN_REASON} characters.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant='outline' onClick={() => setRejecting(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={() => reject.mutate()}
                    disabled={
                      reason.trim().length < MIN_REASON || reject.isPending
                    }
                  >
                    {reject.isPending && <Loader2 className='animate-spin' />}
                    Reject fix
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <ConfirmDialog
              open={confirmRollback}
              onOpenChange={setConfirmRollback}
              title='Roll back this change?'
              desc={`${r.resourceName} goes back to its previous configuration and the finding reopens.`}
              confirmText='Roll back'
              destructive
              isLoading={rollback.isPending}
              handleConfirm={() => rollback.mutate()}
            />
          </>
        )}
      </Main>
    </>
  )
}
