import { type UseFormReturn } from 'react-hook-form'
import { APP_CONFIG } from '@/config/app'
import { type AwsOnboardingSetup } from '@/types/cspm'
import { Download, ExternalLink, ShieldCheck } from 'lucide-react'
import {
  AWS_READ_ONLY_POLICIES,
  CLOUDFORMATION_CONSOLE_URL,
  buildTrustPolicy,
} from '@/lib/aws'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyButton, CopyField } from '@/components/cspm/copy-button'
import { type ConnectFormValues } from './schema'

type AccessStepProps = {
  form: UseFormReturn<ConnectFormValues>
  setup: AwsOnboardingSetup
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className='flex gap-3'>
      <span
        aria-hidden
        className='bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold'
      >
        {n}
      </span>
      <div className='min-w-0 flex-1 space-y-2 pt-0.5 text-sm'>{children}</div>
    </li>
  )
}

export function AccessStep({ form, setup }: AccessStepProps) {
  const accountId = form.watch('accountId')
  const trustPolicy = buildTrustPolicy(
    setup.principalAccountId,
    setup.trustExternalId
  )

  return (
    <div className='space-y-6'>
      <div className='bg-muted/40 flex gap-3 rounded-lg border p-4 text-sm'>
        <ShieldCheck className='text-success mt-0.5 size-5 shrink-0' />
        <p>
          Create an IAM role in account{' '}
          <span className='font-mono font-medium'>{accountId}</span> that{' '}
          {APP_CONFIG.name} can assume. It uses AWS-managed read-only policies,
          so {APP_CONFIG.name} can read configuration but can't change anything.
          The external ID stops anyone else from using the role.
        </p>
      </div>

      <Tabs defaultValue='cloudformation'>
        <TabsList className='w-full sm:w-auto'>
          <TabsTrigger value='cloudformation'>
            CloudFormation (recommended)
          </TabsTrigger>
          <TabsTrigger value='manual'>Manual setup</TabsTrigger>
        </TabsList>

        <TabsContent value='cloudformation' className='pt-4'>
          <ol className='space-y-5'>
            <Step n={1}>
              <p>Download the role template.</p>
              <Button asChild variant='outline' size='sm'>
                <a href={setup.templatePath} download>
                  <Download /> vigil-read-only-role.yaml
                </a>
              </Button>
            </Step>
            <Step n={2}>
              <p>
                Sign in to AWS account{' '}
                <span className='font-mono'>{accountId}</span> and open
                CloudFormation. Choose{' '}
                <strong>Create stack → With new resources</strong>, then upload
                the template.
              </p>
              <Button asChild variant='outline' size='sm'>
                <a
                  href={CLOUDFORMATION_CONSOLE_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Open CloudFormation <ExternalLink />
                </a>
              </Button>
            </Step>
            <Step n={3}>
              <p>Enter these stack parameters exactly as shown.</p>
              <div className='grid gap-3 sm:grid-cols-2'>
                <CopyField
                  label='TrustedAccountId'
                  value={setup.principalAccountId}
                />
                <CopyField label='ExternalId' value={setup.trustExternalId} />
                <CopyField label='RoleName' value={setup.roleName} />
              </div>
            </Step>
            <Step n={4}>
              <p>
                Tick the IAM acknowledgement and create the stack. When it shows{' '}
                <strong>CREATE_COMPLETE</strong>, copy <strong>RoleArn</strong>{' '}
                from the <strong>Outputs</strong> tab.
              </p>
            </Step>
          </ol>
        </TabsContent>

        <TabsContent value='manual' className='pt-4'>
          <ol className='space-y-5'>
            <Step n={1}>
              <p>
                In the IAM console, choose{' '}
                <strong>Roles → Create role → AWS account</strong>. Select{' '}
                <strong>Another AWS account</strong> and tick{' '}
                <strong>Require external ID</strong>.
              </p>
              <div className='grid gap-3 sm:grid-cols-2'>
                <CopyField
                  label='Account ID'
                  value={setup.principalAccountId}
                />
                <CopyField label='External ID' value={setup.trustExternalId} />
              </div>
            </Step>
            <Step n={2}>
              <p>Attach these AWS-managed policies:</p>
              <ul className='space-y-1'>
                {AWS_READ_ONLY_POLICIES.map((p) => (
                  <li key={p.name}>
                    <span className='font-mono font-medium'>{p.name}</span>
                    <span className='text-muted-foreground'>
                      {' '}
                      — {p.purpose}
                    </span>
                  </li>
                ))}
              </ul>
            </Step>
            <Step n={3}>
              <p>
                Name the role{' '}
                <span className='font-mono font-medium'>{setup.roleName}</span>{' '}
                and create it. Its trust policy should match:
              </p>
              <div className='relative'>
                <pre className='bg-muted/50 max-h-56 overflow-auto rounded-md border p-3 pe-10 font-mono text-xs'>
                  {trustPolicy}
                </pre>
                <CopyButton
                  value={trustPolicy}
                  label='Trust policy'
                  className='absolute end-1.5 top-1.5'
                />
              </div>
            </Step>
          </ol>
        </TabsContent>
      </Tabs>

      <FormField
        control={form.control}
        name='roleArn'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role ARN</FormLabel>
            <FormControl>
              <Input
                placeholder={`arn:aws:iam::${accountId || '123456789012'}:role/${setup.roleName}`}
                autoComplete='off'
                spellCheck={false}
                className='font-mono'
                {...field}
              />
            </FormControl>
            <FormDescription>
              Paste the ARN of the role you just created.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
