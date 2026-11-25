import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type Alert } from '@/types/cspm'
import { BellOff, Check, CheckCheck } from 'lucide-react'
import { markAlertsRead } from '@/lib/api/cspm-api'
import { cspmQueries } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { AlertItem } from '@/components/cspm/alert-item'
import { EmptyState } from '@/components/cspm/empty-state'

type InboxProps = {
  unreadOnly: boolean
  onUnreadOnlyChange: (value: boolean) => void
}

export function Inbox({ unreadOnly, onUnreadOnlyChange }: InboxProps) {
  const queryClient = useQueryClient()
  const { data: alerts, isPending } = useQuery(cspmQueries.alerts())

  const markRead = useMutation({
    mutationFn: markAlertsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  if (isPending) return <Skeleton className='h-96 rounded-xl' />

  const all = alerts ?? []
  const unread = all.filter((a) => !a.read).length
  const shown = unreadOnly ? all.filter((a) => !a.read) : all

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Switch
            id='unread-only'
            checked={unreadOnly}
            onCheckedChange={onUnreadOnlyChange}
          />
          <Label htmlFor='unread-only'>Unread only ({unread})</Label>
        </div>
        <Button
          variant='outline'
          size='sm'
          disabled={unread === 0 || markRead.isPending}
          onClick={() => markRead.mutate('all')}
        >
          <CheckCheck /> Mark all as read
        </Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={unreadOnly ? 'All caught up' : 'No alerts yet'}
          description={
            unreadOnly
              ? 'You have read every alert.'
              : 'Alerts appear here when a scan finds something or an account needs attention.'
          }
        />
      ) : (
        <Card className='gap-0 p-1'>
          <ul className='divide-y'>
            {shown.map((a: Alert) => (
              <li key={a.id}>
                <AlertItem
                  alert={a}
                  onOpen={(alert) => !alert.read && markRead.mutate([alert.id])}
                  actions={
                    !a.read && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7'
                        aria-label={`Mark "${a.title}" as read`}
                        onClick={() => markRead.mutate([a.id])}
                      >
                        <Check className='size-4' />
                      </Button>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
