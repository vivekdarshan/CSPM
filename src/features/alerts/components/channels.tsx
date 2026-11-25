import { useState } from 'react'
import { z } from 'zod'
import { formatDistanceToNow } from 'date-fns'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ChannelType, type NotificationChannel } from '@/types/cspm'
import { Loader2, Plus, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CHANNEL_META, maskTarget } from '@/lib/alerts'
import {
  addNotificationChannel,
  removeNotificationChannel,
  testNotificationChannel,
  updateNotificationChannel,
} from '@/lib/api/cspm-api'
import { cspmQueries } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/cspm/empty-state'

export function Channels() {
  const queryClient = useQueryClient()
  const { data: settings, isPending } = useQuery(cspmQueries.alertSettings())
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<NotificationChannel | null>(null)

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['alerts', 'settings'] })

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateNotificationChannel(id, { enabled }),
    onSuccess: (ch) => {
      toast.success(ch.enabled ? `${ch.name} resumed` : `${ch.name} paused`)
      refresh()
    },
  })

  const test = useMutation({
    mutationFn: testNotificationChannel,
    onSuccess: (ch) => {
      toast.success(`Test message sent to ${ch.name}`)
      refresh()
    },
  })

  const remove = useMutation({
    mutationFn: removeNotificationChannel,
    onSuccess: () => {
      toast.success('Channel removed')
      setRemoving(null)
      refresh()
    },
  })

  if (isPending || !settings) return <Skeleton className='h-64 rounded-xl' />

  const { channels, rules } = settings

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setAdding(true)}>
          <Plus /> Add channel
        </Button>
      </div>

      {channels.length === 0 ? (
        <EmptyState
          icon={Send}
          title='No channels yet'
          description='Add an email address, Slack or Teams webhook to receive alerts outside the app.'
        />
      ) : (
        <Card className='gap-0 p-0'>
          <ul className='divide-y'>
            {channels.map((ch) => {
              const meta = CHANNEL_META[ch.type]
              const Icon = meta.icon
              const usedBy = rules.filter((r) =>
                r.channelIds.includes(ch.id)
              ).length
              const testing = test.isPending && test.variables === ch.id
              return (
                <li
                  key={ch.id}
                  className='flex flex-wrap items-center gap-x-4 gap-y-3 p-4'
                >
                  <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-md'>
                    <Icon
                      className='text-muted-foreground size-4'
                      aria-hidden
                    />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='font-medium'>
                      {ch.name}{' '}
                      <span className='text-muted-foreground text-xs font-normal'>
                        {meta.label}
                      </span>
                    </p>
                    <p className='text-muted-foreground truncate font-mono text-xs'>
                      {maskTarget(ch.type, ch.target)}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      Used by {usedBy} rule{usedBy === 1 ? '' : 's'} · last
                      tested{' '}
                      {ch.lastTestedAt
                        ? formatDistanceToNow(new Date(ch.lastTestedAt), {
                            addSuffix: true,
                          })
                        : 'never'}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={ch.enabled}
                      onCheckedChange={(enabled) =>
                        toggle.mutate({ id: ch.id, enabled })
                      }
                      aria-label={`Send alerts to ${ch.name}`}
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => test.mutate(ch.id)}
                      disabled={testing || !ch.enabled}
                    >
                      {testing ? (
                        <Loader2 className='animate-spin' />
                      ) : (
                        <Send />
                      )}
                      Send test
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8'
                      aria-label={`Remove ${ch.name}`}
                      onClick={() => setRemoving(ch)}
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <AddChannelDialog
        open={adding}
        onOpenChange={setAdding}
        onAdded={refresh}
      />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        destructive
        title={`Remove ${removing?.name}?`}
        desc='Alert rules stop sending to this channel. You can add it again later.'
        confirmText='Remove'
        isLoading={remove.isPending}
        handleConfirm={() => removing && remove.mutate(removing.id)}
      />
    </div>
  )
}

const channelSchema = z
  .object({
    type: z.enum(['email', 'slack', 'teams']),
    name: z.string().trim().min(2, 'Give the channel a name.').max(40),
    target: z.string().trim().min(1, 'Required.'),
  })
  .superRefine((v, ctx) => {
    const fail = (message: string) =>
      ctx.addIssue({ code: 'custom', path: ['target'], message })
    if (v.type === 'email') {
      if (!z.email().safeParse(v.target).success)
        fail('Enter a valid email address.')
      return
    }
    let url: URL
    try {
      url = new URL(v.target)
    } catch {
      return fail('Enter the full webhook URL, starting with https://')
    }
    if (url.protocol !== 'https:') return fail('Webhook URLs must use https.')
    if (v.type === 'slack' && url.hostname !== 'hooks.slack.com')
      fail('Slack webhook URLs start with https://hooks.slack.com/')
  })

type ChannelValues = z.infer<typeof channelSchema>

function AddChannelDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}) {
  const form = useForm<ChannelValues>({
    resolver: zodResolver(channelSchema),
    defaultValues: { type: 'email', name: '', target: '' },
  })
  const type = useWatch({ control: form.control, name: 'type' }) as ChannelType
  const meta = CHANNEL_META[type]

  const add = useMutation({
    mutationFn: addNotificationChannel,
    onSuccess: (ch) => {
      toast.success(`${ch.name} added`, {
        description: 'Choose which rules send to it under Rules.',
      })
      onAdded()
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add a channel</DialogTitle>
          <DialogDescription>
            Where alerts are delivered outside the app.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='add-channel'
            className='space-y-4'
            onSubmit={form.handleSubmit((v) =>
              add.mutate({ ...v, name: v.name.trim(), target: v.target.trim() })
            )}
          >
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      form.clearErrors('target')
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(CHANNEL_META) as ChannelType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {CHANNEL_META[t].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        type === 'email' ? 'Security team' : '#security-alerts'
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='target'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{meta.targetLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={meta.placeholder}
                      autoComplete='off'
                      spellCheck={false}
                      type={type === 'email' ? 'email' : 'url'}
                      {...field}
                    />
                  </FormControl>
                  {type !== 'email' && (
                    <FormDescription>
                      Treat this URL like a password: anyone with it can post to
                      your channel.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='add-channel' disabled={add.isPending}>
            {add.isPending && <Loader2 className='animate-spin' />}
            Add channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
