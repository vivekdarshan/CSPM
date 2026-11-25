import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type AlertRule, type Severity } from '@/types/cspm'
import { toast } from 'sonner'
import { CHANNEL_META, TRIGGER_META } from '@/lib/alerts'
import { updateAlertRule } from '@/lib/api/cspm-api'
import { cspmQueries } from '@/lib/api/queries'
import { CHARTED_SEVERITIES, SEVERITY_META } from '@/lib/severity'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

type RulePatch = Partial<
  Pick<AlertRule, 'enabled' | 'minSeverity' | 'channelIds'>
>

export function Rules() {
  const queryClient = useQueryClient()
  const { data: settings, isPending } = useQuery(cspmQueries.alertSettings())

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: RulePatch }) =>
      updateAlertRule(id, patch),
    onSuccess: () => {
      toast.success('Alert rule saved')
      queryClient.invalidateQueries({ queryKey: ['alerts', 'settings'] })
    },
  })

  if (isPending || !settings) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className='h-32 rounded-xl' />
        ))}
      </div>
    )
  }

  const { rules, channels } = settings

  return (
    <div className='space-y-4'>
      {rules.map((rule) => {
        const meta = TRIGGER_META[rule.trigger]
        const switchId = `rule-${rule.id}`
        return (
          <Card key={rule.id} className={cn(!rule.enabled && 'opacity-75')}>
            <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
              <div className='space-y-1'>
                <CardTitle>
                  <label htmlFor={switchId}>{meta.title}</label>
                </CardTitle>
                <CardDescription>{meta.description}</CardDescription>
              </div>
              <Switch
                id={switchId}
                checked={rule.enabled}
                onCheckedChange={(enabled) =>
                  update.mutate({ id: rule.id, patch: { enabled } })
                }
              />
            </CardHeader>
            <CardContent className='flex flex-wrap items-start gap-x-8 gap-y-4'>
              {rule.trigger === 'new_finding' && (
                <div className='space-y-1.5'>
                  <p className='text-muted-foreground text-xs font-medium'>
                    Minimum severity
                  </p>
                  <Select
                    value={rule.minSeverity ?? 'high'}
                    onValueChange={(v) =>
                      update.mutate({
                        id: rule.id,
                        patch: {
                          minSeverity: v as Exclude<Severity, 'informational'>,
                        },
                      })
                    }
                    disabled={!rule.enabled}
                  >
                    <SelectTrigger
                      className='w-44'
                      aria-label='Minimum severity'
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHARTED_SEVERITIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SEVERITY_META[s].label}
                          {s !== 'critical' && ' and above'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <fieldset className='space-y-1.5' disabled={!rule.enabled}>
                <legend className='text-muted-foreground mb-1.5 text-xs font-medium'>
                  Send to
                </legend>
                {channels.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>
                    No channels yet.{' '}
                    <Link
                      to='/alerts'
                      search={{ tab: 'channels' }}
                      className='text-foreground underline underline-offset-4'
                    >
                      Add one
                    </Link>
                  </p>
                ) : (
                  <div className='flex flex-wrap gap-x-5 gap-y-2'>
                    {channels.map((ch) => {
                      const Icon = CHANNEL_META[ch.type].icon
                      const checked = rule.channelIds.includes(ch.id)
                      return (
                        <label
                          key={ch.id}
                          className='flex items-center gap-2 text-sm'
                        >
                          <Checkbox
                            checked={checked}
                            disabled={!rule.enabled}
                            onCheckedChange={(on) =>
                              update.mutate({
                                id: rule.id,
                                patch: {
                                  channelIds: on
                                    ? [...rule.channelIds, ch.id]
                                    : rule.channelIds.filter(
                                        (c) => c !== ch.id
                                      ),
                                },
                              })
                            }
                          />
                          <Icon
                            className='text-muted-foreground size-4'
                            aria-hidden
                          />
                          {ch.name}
                          {!ch.enabled && (
                            <span className='text-muted-foreground text-xs'>
                              (paused)
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
                {rule.enabled && rule.channelIds.length === 0 && (
                  <p className='text-severity-high-ink text-xs'>
                    No channel selected, so this rule only shows in the inbox.
                  </p>
                )}
              </fieldset>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
