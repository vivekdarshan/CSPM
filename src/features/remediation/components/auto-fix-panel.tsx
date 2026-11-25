import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { type Finding } from '@/types/cspm'
import { ArrowRight, Loader2, ShieldCheck, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { previewRemediation, requestRemediation } from '@/lib/api/cspm-api'
import { cspmQueries } from '@/lib/api/queries'
import { isOpenFinding } from '@/lib/findings'
import { isActiveRemediation } from '@/lib/remediation'
import { Button } from '@/components/ui/button'
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
import { RemediationStatusBadge } from '@/components/cspm/remediation-status-badge'
import { ChangePlan } from './change-plan'

/**
 * Shown in a finding's "How to fix" card: request an automatic fix, follow
 * one that is already under way, or learn how to turn fixes on.
 */
export function AutoFixPanel({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false)
  const { data: accounts } = useQuery(cspmQueries.accounts())
  const { data: remediations } = useQuery(cspmQueries.remediations())
  const { data: settings } = useQuery(cspmQueries.remediationSettings())

  if (!finding.remediation.automatable || !isOpenFinding(finding)) return null

  const account = accounts?.find((a) => a.id === finding.accountId)
  const active = remediations?.find(
    (r) => r.findingId === finding.id && isActiveRemediation(r)
  )

  return (
    <div className='bg-muted/40 flex flex-wrap items-center gap-3 rounded-lg border p-4'>
      <Zap className='text-muted-foreground size-5 shrink-0' aria-hidden />
      <div className='min-w-0 flex-1 text-sm'>
        {active ? (
          <>
            <p className='flex flex-wrap items-center gap-2 font-medium'>
              An automatic fix is under way
              <RemediationStatusBadge status={active.status} />
            </p>
            <p className='text-muted-foreground'>
              Requested by {active.requestedBy}.
            </p>
          </>
        ) : account?.remediationRoleArn ? (
          <>
            <p className='font-medium'>This can be fixed automatically</p>
            <p className='text-muted-foreground'>
              You'll see exactly what changes first.{' '}
              {settings?.requireSecondApprover
                ? 'Someone else approves it before it runs.'
                : 'It runs once approved.'}
            </p>
          </>
        ) : (
          <>
            <p className='font-medium'>
              Automatic fixes are off for {account?.name ?? 'this account'}
            </p>
            <p className='text-muted-foreground'>
              Turn them on from the account page to fix this in one step.
            </p>
          </>
        )}
      </div>
      {active ? (
        <Button asChild variant='outline' size='sm'>
          <Link to='/remediation/$actionId' params={{ actionId: active.id }}>
            View fix <ArrowRight />
          </Link>
        </Button>
      ) : account?.remediationRoleArn ? (
        <Button size='sm' onClick={() => setOpen(true)}>
          <Zap /> Fix automatically
        </Button>
      ) : account ? (
        <Button asChild variant='outline' size='sm'>
          <Link to='/accounts/$accountId' params={{ accountId: account.id }}>
            Account settings <ArrowRight />
          </Link>
        </Button>
      ) : null}

      <RequestFixDialog
        finding={finding}
        open={open}
        onOpenChange={setOpen}
        needsSecondApprover={settings?.requireSecondApprover ?? true}
      />
    </div>
  )
}

export function RequestFixDialog({
  finding,
  open,
  onOpenChange,
  needsSecondApprover,
}: {
  finding: Finding
  open: boolean
  onOpenChange: (open: boolean) => void
  needsSecondApprover: boolean
}) {
  const [note, setNote] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const preview = useQuery({
    queryKey: ['remediations', 'preview', finding.id],
    queryFn: () => previewRemediation(finding.id),
    enabled: open,
  })

  const request = useMutation({
    mutationFn: () => requestRemediation({ findingId: finding.id, note }),
    onSuccess: (action) => {
      toast.success(
        needsSecondApprover
          ? 'Fix requested. It needs approval from someone else.'
          : 'Fix requested'
      )
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      onOpenChange(false)
      navigate({
        to: '/remediation/$actionId',
        params: { actionId: action.id },
      })
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setNote('')
        onOpenChange(o)
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Fix automatically?</DialogTitle>
          <DialogDescription>
            {finding.title} on{' '}
            <span className='text-foreground font-medium'>
              {finding.resourceName}
            </span>
          </DialogDescription>
        </DialogHeader>

        {preview.data ? (
          <ChangePlan {...preview.data} />
        ) : preview.isError ? (
          <p className='text-destructive text-sm'>{preview.error.message}</p>
        ) : (
          <Skeleton className='h-40 w-full' />
        )}

        <div className='space-y-2'>
          <Label htmlFor='fix-note'>Note for the approver (optional)</Label>
          <Textarea
            id='fix-note'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='e.g. Checked with the web team: nothing uses the public URLs.'
          />
        </div>

        <p className='text-muted-foreground flex gap-2 text-xs'>
          <ShieldCheck className='size-4 shrink-0' aria-hidden />
          Nothing changes yet.{' '}
          {needsSecondApprover
            ? 'Another team member must approve the fix before it runs.'
            : 'You can approve it on the next screen.'}{' '}
          A re-scan confirms the result afterwards.
        </p>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => request.mutate()}
            disabled={!preview.data || request.isPending}
          >
            {request.isPending && <Loader2 className='animate-spin' />}
            Request fix
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
