import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { APP_CONFIG } from '@/config/app'
import { type CloudAccount } from '@/types/cspm'
import { Download, Loader2, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { getAwsOnboardingSetup, setRemediationRole } from '@/lib/api/cspm-api'
import { AWS_ROLE_ARN_PATTERN, accountIdFromRoleArn } from '@/lib/aws'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CopyField } from '@/components/cspm/copy-button'

/** Opt-in write role for approved automatic fixes. */
export function AutoFixCard({ account }: { account: CloudAccount }) {
  const queryClient = useQueryClient()
  const [arn, setArn] = useState('')
  const [touched, setTouched] = useState(false)
  const [confirmOff, setConfirmOff] = useState(false)
  const enabled = !!account.remediationRoleArn

  // Only the platform's account ID is needed here, not a new external ID
  const { data: principal } = useQuery({
    queryKey: ['onboarding', 'aws', 'principal'],
    queryFn: getAwsOnboardingSetup,
    select: (s) => s.principalAccountId,
    staleTime: Infinity,
    enabled: !enabled,
  })

  const save = useMutation({
    mutationFn: (roleArn: string | null) =>
      setRemediationRole(account.id, roleArn),
    onSuccess: (a) => {
      toast.success(
        a.remediationRoleArn
          ? 'Automatic fixes turned on'
          : 'Automatic fixes turned off'
      )
      setArn('')
      setTouched(false)
      setConfirmOff(false)
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: (e) => toast.error(e.message),
  })

  const trimmed = arn.trim()
  const error = !trimmed
    ? 'Paste the RoleArn output from the stack.'
    : !AWS_ROLE_ARN_PATTERN.test(trimmed)
      ? 'Enter a role ARN, e.g. arn:aws:iam::123456789012:role/VigilRemediation.'
      : accountIdFromRoleArn(trimmed) !== account.externalId
        ? `The role must belong to account ${account.externalId}.`
        : null

  return (
    <Card className='lg:col-span-2'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Wrench className='text-muted-foreground size-4' aria-hidden />
          Automatic fixes
          <span
            className={
              enabled
                ? 'text-success text-sm font-medium'
                : 'text-muted-foreground text-sm font-normal'
            }
          >
            {enabled ? 'On' : 'Off'}
          </span>
        </CardTitle>
        <CardDescription>
          {enabled
            ? `${APP_CONFIG.name} can apply fixes in this account after a person approves them. It uses a separate role limited to those changes.`
            : `Off by default: the connection role is read-only. Add a second, tightly scoped role to let ${APP_CONFIG.name} apply fixes you approve.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {enabled ? (
          <div className='flex flex-wrap items-end gap-3'>
            <div className='min-w-0 flex-1'>
              <CopyField
                label='Remediation role ARN'
                value={account.remediationRoleArn!}
              />
            </div>
            <Button variant='outline' onClick={() => setConfirmOff(true)}>
              Turn off
            </Button>
          </div>
        ) : (
          <ol className='space-y-4 text-sm'>
            <li className='space-y-2'>
              <p>
                <span className='font-medium'>1.</span> Create the role with
                this template in account{' '}
                <span className='font-mono'>{account.externalId}</span>. It can
                only call the specific APIs fixes need, and can't read your
                data.
              </p>
              <Button asChild variant='outline' size='sm'>
                <a href='/aws/vigil-remediation-role.yaml' download>
                  <Download /> vigil-remediation-role.yaml
                </a>
              </Button>
            </li>
            <li className='space-y-2'>
              <p>
                <span className='font-medium'>2.</span> Use these parameters:
              </p>
              <div className='grid gap-3 sm:grid-cols-2'>
                <CopyField
                  label='TrustedAccountId'
                  value={principal ?? 'Loading…'}
                />
                <CopyField
                  label='ExternalId'
                  value={account.connection?.trustExternalId ?? '—'}
                />
              </div>
            </li>
            <li className='space-y-2'>
              <form
                className='space-y-2'
                onSubmit={(e) => {
                  e.preventDefault()
                  setTouched(true)
                  if (!error) save.mutate(trimmed)
                }}
              >
                <Label htmlFor={`remediation-arn-${account.id}`}>
                  <span className='font-medium'>3.</span> Paste the RoleArn
                  output
                </Label>
                <div className='flex flex-wrap gap-2'>
                  <Input
                    id={`remediation-arn-${account.id}`}
                    value={arn}
                    onChange={(e) => setArn(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder={`arn:aws:iam::${account.externalId}:role/VigilRemediation`}
                    className='min-w-0 flex-1 font-mono'
                    aria-invalid={touched && !!error}
                    aria-describedby={`remediation-arn-error-${account.id}`}
                    autoComplete='off'
                    spellCheck={false}
                  />
                  <Button type='submit' disabled={save.isPending}>
                    {save.isPending && <Loader2 className='animate-spin' />}
                    Turn on
                  </Button>
                </div>
                {touched && error && (
                  <p
                    id={`remediation-arn-error-${account.id}`}
                    className='text-destructive text-sm'
                  >
                    {error}
                  </p>
                )}
              </form>
            </li>
          </ol>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmOff}
        onOpenChange={setConfirmOff}
        title='Turn off automatic fixes?'
        desc={`Fixes waiting for approval in ${account.name} won't be able to run. To remove ${APP_CONFIG.name}'s write access completely, also delete the remediation role stack in AWS.`}
        confirmText='Turn off'
        destructive
        isLoading={save.isPending}
        handleConfirm={() => save.mutate(null)}
      />
    </Card>
  )
}
