import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { APP_CONFIG } from '@/config/app'
import { type CloudAccount } from '@/types/cspm'
import { toast } from 'sonner'
import { disconnectAccount } from '@/lib/api/cspm-api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'

type DisconnectDialogProps = {
  account: CloudAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DisconnectDialog({
  account,
  open,
  onOpenChange,
}: DisconnectDialogProps) {
  const [typed, setTyped] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const disconnect = useMutation({
    mutationFn: () => disconnectAccount(account.id),
    onSuccess: () => {
      toast.success(`${account.name} disconnected`, {
        description: 'Remember to delete the IAM role in AWS.',
      })
      queryClient.removeQueries({ queryKey: ['accounts', account.id] })
      queryClient.invalidateQueries()
      navigate({ to: '/accounts' })
    },
  })

  const roleName = account.connection?.roleArn.split('/').pop()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setTyped('')
        onOpenChange(o)
      }}
      destructive
      title={`Disconnect ${account.name}?`}
      desc={
        <div className='space-y-2'>
          <p>
            {APP_CONFIG.name} will stop scanning this account and delete its
            assets, findings and scan history. This can't be undone.
          </p>
          <p>
            The IAM role
            {roleName && (
              <>
                {' '}
                <span className='font-mono'>{roleName}</span>
              </>
            )}{' '}
            stays in AWS. Delete its CloudFormation stack (or the role) to fully
            revoke access.
          </p>
        </div>
      }
      confirmText='Disconnect'
      disabled={typed.trim() !== account.name}
      isLoading={disconnect.isPending}
      handleConfirm={() => disconnect.mutate()}
    >
      <div className='space-y-2'>
        <Label htmlFor='confirm-account-name'>
          Type <span className='font-semibold'>{account.name}</span> to confirm
        </Label>
        <Input
          id='confirm-account-name'
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete='off'
        />
      </div>
    </ConfirmDialog>
  )
}
