import { format, formatDistanceToNow } from 'date-fns'
import { Link, getRouteApi } from '@tanstack/react-router'
import { AlertTriangle, Download, FileText } from 'lucide-react'
import { controlsToCsv, downloadFile } from '@/lib/compliance'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/cspm/empty-state'
import { PageHeading } from '@/components/cspm/page-heading'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { ControlSheet } from './components/control-sheet'
import { PassBar } from './components/control-status'
import { ControlsTable } from './components/controls-table'
import { useCompliance } from './use-compliance'

const route = getRouteApi('/_authenticated/compliance/')

const ALL = '__all__'

export function Compliance() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const data = useCompliance(search.account)

  const setSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })

  if (data.status !== 'ready') {
    return (
      <>
        <AppHeader />
        <Main>
          <PageHeading
            title='Compliance'
            description='CIS AWS Foundations Benchmark'
          />
          {data.status === 'error' ? (
            <EmptyState
              icon={AlertTriangle}
              title='Could not load compliance results'
              description='Check your connection and try again.'
              action={
                <Button variant='outline' onClick={data.retry}>
                  Retry
                </Button>
              }
            />
          ) : (
            <div className='space-y-6'>
              <div className='grid gap-4 lg:grid-cols-3'>
                <Skeleton className='h-44 rounded-xl' />
                <Skeleton className='h-44 rounded-xl lg:col-span-2' />
              </div>
              <Skeleton className='h-96 rounded-md' />
            </div>
          )}
        </Main>
      </>
    )
  }

  const { framework, controls, sections, summary, account, findingsById } = data
  const visible = controls.filter(
    (c) =>
      (!search.status || c.status === search.status) &&
      (!search.section || c.sectionId === search.section)
  )
  const openControl = controls.find((c) => c.controlId === search.control)
  const scope = account?.name ?? 'all accounts'

  function exportCsv() {
    const csv = controlsToCsv(
      controls,
      Object.fromEntries(framework.sections.map((s) => [s.id, s.title])),
      findingsById
    )
    const slug = account
      ? `-${account.name.toLowerCase().replace(/\W+/g, '-')}`
      : ''
    downloadFile(
      `cis-aws-${framework.version}${slug}-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      csv,
      'text/csv;charset=utf-8'
    )
  }

  return (
    <>
      <AppHeader />
      <Main>
        <PageHeading
          title='Compliance'
          description={`${framework.name} v${framework.version} · evaluated ${formatDistanceToNow(new Date(framework.evaluatedAt), { addSuffix: true })}`}
          actions={
            <>
              <Button variant='outline' onClick={exportCsv}>
                <Download /> Export CSV
              </Button>
              <Button asChild>
                <Link
                  to='/compliance/report'
                  search={{ account: search.account }}
                >
                  <FileText /> View report
                </Link>
              </Button>
            </>
          }
        />

        <div className='mb-6 flex flex-wrap items-center gap-3'>
          <Select
            value={search.account ?? ALL}
            onValueChange={(v) =>
              setSearch({ account: v === ALL ? undefined : v })
            }
          >
            <SelectTrigger className='w-56' aria-label='Account'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All accounts</SelectItem>
              {data.accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data.account?.status === 'error' && (
            <p className='text-destructive flex items-center gap-1.5 text-sm'>
              <AlertTriangle className='size-4' aria-hidden />
              Results may be out of date: {data.account.name} can't be reached.
            </p>
          )}
        </div>

        <div className='mb-6 grid gap-4 *:min-w-0 lg:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle>Automated controls passing</CardTitle>
              <CardDescription>Across {scope}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-baseline gap-2'>
                <span className='text-4xl font-bold tabular-nums'>
                  {summary.percent}%
                </span>
                <span className='text-muted-foreground text-sm'>
                  {summary.pass} of {summary.pass + summary.fail}
                </span>
              </div>
              <PassBar pass={summary.pass} fail={summary.fail} />
              <dl className='grid grid-cols-3 gap-2 text-sm'>
                {(
                  [
                    ['fail', 'Failing', summary.fail, 'text-destructive'],
                    ['pass', 'Passing', summary.pass, 'text-success'],
                    ['manual', 'Manual', summary.manual, ''],
                  ] as const
                ).map(([status, label, count, tone]) => (
                  <button
                    key={status}
                    type='button'
                    aria-pressed={search.status === status}
                    onClick={() =>
                      setSearch({
                        status: search.status === status ? undefined : status,
                      })
                    }
                    className={cn(
                      'hover:bg-muted/50 rounded-md border p-2 text-start',
                      search.status === status &&
                        'border-primary ring-primary/20 ring-2'
                    )}
                  >
                    <dt className='text-muted-foreground text-xs'>{label}</dt>
                    <dd
                      className={cn('text-lg font-semibold tabular-nums', tone)}
                    >
                      {count}
                    </dd>
                  </button>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>By section</CardTitle>
              <CardDescription>
                Select a section to filter the controls below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-1'>
                {sections.map((s) => {
                  const active = search.section === s.id
                  return (
                    <li key={s.id}>
                      <button
                        type='button'
                        aria-pressed={active}
                        onClick={() =>
                          setSearch({ section: active ? undefined : s.id })
                        }
                        className={cn(
                          'hover:bg-muted/50 grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-md px-2 py-2 text-start sm:grid-cols-[14rem_1fr_auto]',
                          active && 'bg-muted'
                        )}
                      >
                        <span className='col-start-1 row-start-1 truncate text-sm font-medium'>
                          {s.id}. {s.title}
                        </span>
                        <PassBar
                          pass={s.pass}
                          fail={s.fail}
                          className='col-span-2 col-start-1 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1'
                        />
                        <span className='col-start-2 row-start-1 text-end text-xs whitespace-nowrap sm:col-start-3'>
                          {s.fail > 0 ? (
                            <span className='text-destructive font-medium'>
                              {s.fail} failing
                            </span>
                          ) : (
                            <span className='text-muted-foreground'>
                              {s.pass}/{s.pass + s.fail} pass
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-4'>
          <Tabs
            value={search.status ?? 'all'}
            onValueChange={(v) =>
              setSearch({
                status:
                  v === 'all' ? undefined : (v as 'fail' | 'pass' | 'manual'),
              })
            }
          >
            <TabsList>
              <TabsTrigger value='all'>All {summary.total}</TabsTrigger>
              <TabsTrigger value='fail'>Failing {summary.fail}</TabsTrigger>
              <TabsTrigger value='pass'>Passing {summary.pass}</TabsTrigger>
              <TabsTrigger value='manual'>Manual {summary.manual}</TabsTrigger>
            </TabsList>
          </Tabs>
          {search.section && (
            <p className='text-muted-foreground text-sm'>
              Showing section{' '}
              {framework.sections.find((s) => s.id === search.section)?.title}.{' '}
              <button
                type='button'
                className='text-foreground underline underline-offset-4'
                onClick={() => setSearch({ section: undefined })}
              >
                Show all sections
              </button>
            </p>
          )}
          <ControlsTable
            sections={framework.sections}
            controls={visible}
            onOpen={(id) => setSearch({ control: id })}
          />
        </div>

        <ControlSheet
          control={openControl}
          section={framework.sections.find(
            (s) => s.id === openControl?.sectionId
          )}
          findings={data.findingsById}
          accountNames={data.accountNames}
          onClose={() => setSearch({ control: undefined })}
        />
      </Main>
    </>
  )
}
