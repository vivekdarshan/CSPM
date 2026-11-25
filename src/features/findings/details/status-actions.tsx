import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  type Finding,
  type SuppressionReason,
  type UpdateFindingStatusInput,
} from '@/types/cspm'
import { BellOff, Loader2, PlayCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { updateFindingStatus } from '@/lib/api/cspm-api'
import { SUPPRESSION_REASONS } from '@/lib/findings'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

const SUCCESS: Record<UpdateFindingStatusInput['status'], string> = {
  in_progress: 'Marked as in progress',
  open: 'Finding reopened',
  suppressed: 'Finding suppressed',
}

export function StatusActions({ finding }: { finding: Finding }) {
  const queryClient = useQueryClient()
  const [suppressOpen, setSuppressOpen] = useState(false)

  const update = useMutation({
    mutationFn: (input: UpdateFindingStatusInput) =>
      updateFindingStatus(finding.id, input),
    onSuccess: (_, input) => {
      toast.success(SUCCESS[input.status])
      // Counts on the dashboard, assets and accounts all depend on status
      queryClient.invalidateQueries({ queryKey: ['findings'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['posture'] })
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
      setSuppressOpen(false)
    },
  })

  const pendingStatus = update.isPending ? update.variables?.status : undefined
  const spinner = <Loader2 className='animate-spin' />

  if (finding.status === 'resolved') return null

  return (
    <>
      {finding.status === 'open' && (
        <Button
          onClick={() => update.mutate({ status: 'in_progress' })}
          disabled={update.isPending}
        >
          {pendingStatus === 'in_progress' ? spinner : <PlayCircle />}
          Start fixing
        </Button>
      )}
      {(finding.status === 'in_progress' ||
        finding.status === 'suppressed') && (
        <Button
          variant='outline'
          onClick={() => update.mutate({ status: 'open' })}
          disabled={update.isPending}
        >
          {pendingStatus === 'open' ? spinner : <RotateCcw />}
          {finding.status === 'suppressed' ? 'Reopen' : 'Move back to open'}
        </Button>
      )}
      {finding.status !== 'suppressed' && (
        <Button
          variant='outline'
          onClick={() => setSuppressOpen(true)}
          disabled={update.isPending}
        >
          <BellOff /> Suppress
        </Button>
      )}

      <SuppressDialog
        open={suppressOpen}
        onOpenChange={setSuppressOpen}
        pending={pendingStatus === 'suppressed'}
        onConfirm={(reason, note) =>
          update.mutate({ status: 'suppressed', reason, note })
        }
      />
    </>
  )
}

type SuppressDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onConfirm: (reason: SuppressionReason, note: string) => void
}

const MIN_NOTE = 10

function SuppressDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: SuppressDialogProps) {
  const [reason, setReason] = useState<SuppressionReason>('intentional')
  const [note, setNote] = useState('')
  const noteOk = note.trim().length >= MIN_NOTE

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setNote('')
        onOpenChange(o)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Suppress this finding?</DialogTitle>
          <DialogDescription>
            It stops counting towards your posture score and alerts. Anyone can
            reopen it later, and the reason is kept in its activity log.
          </DialogDescription>
        </DialogHeader>
        <form
          id='suppress-finding'
          className='space-y-5'
          onSubmit={(e) => {
            e.preventDefault()
            if (noteOk) onConfirm(reason, note.trim())
          }}
        >
          <fieldset className='space-y-2'>
            <legend className='mb-2 text-sm font-medium'>Reason</legend>
            <RadioGroup
              value={reason}
              onValueChange={(v) => setReason(v as SuppressionReason)}
            >
              {(
                Object.entries(SUPPRESSION_REASONS) as [
                  SuppressionReason,
                  (typeof SUPPRESSION_REASONS)[SuppressionReason],
                ][]
              ).map(([value, meta]) => (
                <label
                  key={value}
                  className='hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md border p-3'
                >
                  <RadioGroupItem value={value} className='mt-0.5' />
                  <span className='space-y-0.5'>
                    <span className='block text-sm font-medium'>
                      {meta.label}
                    </span>
                    <span className='text-muted-foreground block text-xs'>
                      {meta.hint}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>
          <div className='space-y-2'>
            <Label htmlFor='suppress-note'>Why? (required)</Label>
            <Textarea
              id='suppress-note'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='e.g. This bucket only hosts the public marketing site.'
              aria-describedby='suppress-note-hint'
            />
            <p
              id='suppress-note-hint'
              className='text-muted-foreground text-xs'
            >
              At least {MIN_NOTE} characters, so reviewers understand the
              decision.
            </p>
          </div>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type='submit'
            form='suppress-finding'
            disabled={!noteOk || pending}
          >
            {pending && <Loader2 className='animate-spin' />}
            Suppress finding
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
