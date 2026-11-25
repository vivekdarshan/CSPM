import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type Alert } from '@/types/cspm'
import { Bell } from 'lucide-react'
import { markAlertsRead } from '@/lib/api/cspm-api'
import { cspmQueries } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AlertItem } from '@/components/cspm/alert-item'

const SHOWN = 6

/** Header bell with the unread count and the latest alerts. */
export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: alerts = [] } = useQuery(cspmQueries.alerts())
  const unread = alerts.filter((a) => !a.read).length

  const markRead = useMutation({
    mutationFn: markAlertsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const openAlert = (alert: Alert) => {
    if (!alert.read) markRead.mutate([alert.id])
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative rounded-full'
          aria-label={
            unread ? `Notifications, ${unread} unread` : 'Notifications'
          }
        >
          <Bell className='size-[1.2rem]' />
          {unread > 0 && (
            <span className='bg-destructive absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold text-white tabular-nums'>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-[min(24rem,calc(100vw-2rem))] p-0'
      >
        <div className='flex items-center justify-between border-b px-3 py-2'>
          <p className='text-sm font-semibold'>Notifications</p>
          {unread > 0 && (
            <Button
              variant='link'
              size='sm'
              className='h-auto p-0 text-xs'
              onClick={() => markRead.mutate('all')}
            >
              Mark all as read
            </Button>
          )}
        </div>
        {alerts.length === 0 ? (
          <p className='text-muted-foreground p-6 text-center text-sm'>
            No notifications yet.
          </p>
        ) : (
          <ul className='max-h-96 overflow-y-auto p-1'>
            {alerts.slice(0, SHOWN).map((a) => (
              <li key={a.id}>
                <AlertItem alert={a} onOpen={openAlert} compact />
              </li>
            ))}
          </ul>
        )}
        <div className='border-t p-1'>
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='w-full'
            onClick={() => setOpen(false)}
          >
            <Link to='/alerts'>View all alerts</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
