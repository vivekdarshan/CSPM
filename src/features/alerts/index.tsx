import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { cspmQueries } from '@/lib/api/queries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeading } from '@/components/cspm/page-heading'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { Channels } from './components/channels'
import { Inbox } from './components/inbox'
import { Rules } from './components/rules'

const route = getRouteApi('/_authenticated/alerts/')

type Tab = 'inbox' | 'rules' | 'channels'

export function Alerts() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const tab: Tab = search.tab ?? 'inbox'
  const { data: alerts } = useQuery(cspmQueries.alerts())
  const unread = alerts?.filter((a) => !a.read).length ?? 0

  return (
    <>
      <AppHeader />
      <Main>
        <PageHeading
          title='Alerts'
          description='Everything that needs your attention lands in the inbox. Rules decide what is also sent to email, Slack or Teams.'
        />
        <Tabs
          value={tab}
          onValueChange={(v) =>
            navigate({
              search: (prev) => ({
                ...prev,
                tab: v === 'inbox' ? undefined : (v as Tab),
              }),
            })
          }
        >
          <TabsList className='mb-4'>
            <TabsTrigger value='inbox'>
              Inbox
              {unread > 0 && (
                <span className='bg-primary text-primary-foreground ms-1.5 rounded-full px-1.5 text-xs tabular-nums'>
                  {unread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value='rules'>Rules</TabsTrigger>
            <TabsTrigger value='channels'>Channels</TabsTrigger>
          </TabsList>
          <TabsContent value='inbox'>
            <Inbox
              unreadOnly={!!search.unread}
              onUnreadOnlyChange={(value) =>
                navigate({
                  search: (prev) => ({ ...prev, unread: value || undefined }),
                  replace: true,
                })
              }
            />
          </TabsContent>
          <TabsContent value='rules'>
            <Rules />
          </TabsContent>
          <TabsContent value='channels'>
            <Channels />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
