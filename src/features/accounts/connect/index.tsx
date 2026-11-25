import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { APP_CONFIG } from '@/config/app'
import { type CloudProvider } from '@/types/cspm'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Radar,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  connectAwsAccount,
  getAwsOnboardingSetup,
  startAccountScan,
} from '@/lib/api/cspm-api'
import { ENVIRONMENT_LABELS } from '@/lib/aws'
import { PROVIDER_META } from '@/lib/providers'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeading } from '@/components/cspm/page-heading'
import { ProviderIcon } from '@/components/cspm/provider-icon'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { ConnectionChecks } from '../components/connection-checks'
import { RegionPicker } from '../components/region-picker'
import { AccessStep } from './access-step'
import { type ConnectFormValues, STEPS, connectSchema } from './schema'

const PROVIDERS: { id: CloudProvider; available: boolean; blurb: string }[] = [
  {
    id: 'aws',
    available: true,
    blurb: 'Connect with a read-only IAM role.',
  },
  { id: 'azure', available: false, blurb: 'Coming soon.' },
  { id: 'gcp', available: false, blurb: 'Coming soon.' },
]

export function ConnectAccount() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)

  const setup = useQuery({
    queryKey: ['onboarding', 'aws', 'setup'],
    queryFn: getAwsOnboardingSetup,
    staleTime: Infinity,
    gcTime: 0, // a fresh external ID for every visit
  })

  const form = useForm<ConnectFormValues>({
    resolver: zodResolver(connectSchema),
    defaultValues: {
      provider: 'aws',
      name: '',
      accountId: '',
      environment: 'production',
      regions: ['us-east-1'],
      roleArn: '',
    },
    mode: 'onTouched',
  })

  const connect = useMutation({
    mutationFn: connectAwsAccount,
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ['accounts'] })
        queryClient.invalidateQueries({ queryKey: ['posture'] })
      }
    },
  })

  const firstScan = useMutation({
    mutationFn: startAccountScan,
    onSuccess: (run) => {
      toast.success('First scan started', {
        description: 'Results usually take a few minutes.',
      })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      navigate({
        to: '/accounts/$accountId',
        params: { accountId: run.accountId },
      })
    },
  })

  function runConnect() {
    const v = form.getValues()
    connect.mutate({
      name: v.name.trim(),
      accountId: v.accountId.trim(),
      environment: v.environment,
      regions: v.regions,
      roleArn: v.roleArn.trim(),
      trustExternalId: setup.data!.trustExternalId,
    })
  }

  async function next() {
    const valid = await form.trigger([...STEPS[step].fields])
    if (!valid) return
    if (STEPS[step].id === 'access') runConnect()
    setStep((s) => s + 1)
  }

  const current = STEPS[step]
  const connected = connect.data?.ok ? connect.data.account : undefined

  return (
    <>
      <AppHeader />
      <Main>
        <div className='mx-auto max-w-3xl'>
          <Button asChild variant='ghost' size='sm' className='-ms-2 mb-2'>
            <Link to='/accounts'>
              <ArrowLeft /> Cloud accounts
            </Link>
          </Button>
          <PageHeading
            title='Connect a cloud account'
            description={`${APP_CONFIG.name} only ever gets read-only access.`}
          />

          <Stepper current={step} />

          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                next()
              }}
              noValidate
            >
              <Card>
                <CardHeader>
                  <p className='text-muted-foreground text-xs font-medium sm:hidden'>
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <CardTitle>{current.title}</CardTitle>
                  <CardDescription>
                    {current.id === 'provider' &&
                      'Choose where the account lives.'}
                    {current.id === 'details' &&
                      'Tell us which account to scan and where.'}
                    {current.id === 'access' &&
                      'Create a read-only role, then paste its ARN.'}
                    {current.id === 'verify' &&
                      'Checking that the role works and is read-only.'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {current.id === 'provider' && (
                    <FormField
                      control={form.control}
                      name='provider'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='sr-only'>
                            Cloud provider
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className='grid gap-3 sm:grid-cols-3'
                            >
                              {PROVIDERS.map((p) => (
                                <label
                                  key={p.id}
                                  className={cn(
                                    'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                                    field.value === p.id &&
                                      'border-primary ring-primary/20 ring-2',
                                    !p.available &&
                                      'cursor-not-allowed opacity-60'
                                  )}
                                >
                                  <RadioGroupItem
                                    value={p.id}
                                    disabled={!p.available}
                                    className='mt-1'
                                  />
                                  <div className='min-w-0 space-y-1'>
                                    <div className='flex items-center gap-2'>
                                      <ProviderIcon provider={p.id} size='sm' />
                                      <span className='font-medium'>
                                        {PROVIDER_META[p.id].label}
                                      </span>
                                    </div>
                                    <p className='text-muted-foreground text-xs'>
                                      {p.blurb}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {current.id === 'details' && (
                    <div className='space-y-5'>
                      <div className='grid items-start gap-5 sm:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name='name'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='e.g. Production'
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='accountId'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>AWS account ID</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='123456789012'
                                  inputMode='numeric'
                                  autoComplete='off'
                                  maxLength={12}
                                  className='font-mono'
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                12 digits, shown in the AWS console's account
                                menu.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name='environment'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Environment</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className='w-full sm:w-60'>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(ENVIRONMENT_LABELS).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Used to prioritise findings: production issues
                              rank higher.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='regions'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Regions to scan</FormLabel>
                            <FormDescription>
                              Global services such as IAM and S3 are always
                              scanned.
                            </FormDescription>
                            <FormControl>
                              <RegionPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {current.id === 'access' &&
                    (setup.data ? (
                      <AccessStep form={form} setup={setup.data} />
                    ) : setup.isError ? (
                      <Alert variant='destructive'>
                        <AlertTriangle />
                        <AlertTitle>
                          Could not prepare the connection
                        </AlertTitle>
                        <AlertDescription>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setup.refetch()}
                          >
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className='space-y-3'>
                        <Skeleton className='h-16 w-full' />
                        <Skeleton className='h-40 w-full' />
                      </div>
                    ))}

                  {current.id === 'verify' && (
                    <div className='space-y-6'>
                      <ConnectionChecks
                        running={connect.isPending}
                        checks={connect.data?.checks}
                      />
                      {connected && (
                        <Alert className='border-success/40 bg-success/5'>
                          <CheckCircle2 className='text-success' />
                          <AlertTitle>{connected.name} is connected</AlertTitle>
                          <AlertDescription>
                            Run the first scan now to see this account's
                            findings. After that, {APP_CONFIG.name} scans it
                            every day.
                          </AlertDescription>
                        </Alert>
                      )}
                      {connect.data && !connect.data.ok && (
                        <Alert variant='destructive'>
                          <AlertTriangle />
                          <AlertTitle>Connection failed</AlertTitle>
                          <AlertDescription>
                            Fix the failed check above, then try again. Nothing
                            has been saved yet.
                          </AlertDescription>
                        </Alert>
                      )}
                      {connect.isError && (
                        <Alert variant='destructive'>
                          <AlertTriangle />
                          <AlertTitle>Could not run the test</AlertTitle>
                          <AlertDescription>
                            Something went wrong on our side. Try again.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className='flex flex-wrap justify-between gap-2 border-t pt-6'>
                  {current.id !== 'verify' ? (
                    <>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setStep((s) => s - 1)}
                        disabled={step === 0}
                      >
                        <ArrowLeft /> Back
                      </Button>
                      <Button
                        type='submit'
                        disabled={current.id === 'access' && !setup.data}
                      >
                        {current.id === 'access'
                          ? 'Test connection'
                          : 'Continue'}
                        <ArrowRight />
                      </Button>
                    </>
                  ) : connected ? (
                    <>
                      <Button asChild type='button' variant='outline'>
                        <Link
                          to='/accounts/$accountId'
                          params={{ accountId: connected.id }}
                        >
                          View account
                        </Link>
                      </Button>
                      <Button
                        type='button'
                        onClick={() => firstScan.mutate(connected.id)}
                        disabled={firstScan.isPending}
                      >
                        {firstScan.isPending ? (
                          <Loader2 className='animate-spin' />
                        ) : (
                          <Radar />
                        )}
                        Start first scan
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setStep((s) => s - 1)}
                        disabled={connect.isPending}
                      >
                        <ArrowLeft /> Back to setup
                      </Button>
                      <Button
                        type='button'
                        onClick={runConnect}
                        disabled={connect.isPending}
                      >
                        {connect.isPending && (
                          <Loader2 className='animate-spin' />
                        )}
                        {connect.isPending ? 'Testing…' : 'Try again'}
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </Main>
    </>
  )
}

function Stepper({ current }: { current: number }) {
  return (
    <ol
      className='mb-6 hidden items-center gap-2 sm:flex'
      aria-label='Progress'
    >
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li
            key={s.id}
            className='flex flex-1 items-center gap-2 last:flex-none'
            aria-current={active ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                done && 'bg-primary border-primary text-primary-foreground',
                active && 'border-primary text-primary',
                !done && !active && 'text-muted-foreground'
              )}
            >
              {done ? <Check className='size-3.5' aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                'text-sm whitespace-nowrap',
                active ? 'font-medium' : 'text-muted-foreground'
              )}
            >
              {s.title}
              {done && <span className='sr-only'> (done)</span>}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden className='bg-border h-px flex-1' />
            )}
          </li>
        )
      })}
    </ol>
  )
}
