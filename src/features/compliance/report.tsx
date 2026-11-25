import { format } from 'date-fns'
import { Link, getRouteApi } from '@tanstack/react-router'
import { APP_CONFIG } from '@/config/app'
import { type Finding } from '@/types/cspm'
import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { SUPPRESSION_REASONS } from '@/lib/findings'
import { SEVERITY_META } from '@/lib/severity'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/cspm/empty-state'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { useCompliance } from './use-compliance'

const route = getRouteApi('/_authenticated/compliance/report')

/** The most recent suppression on a finding, for the exceptions table. */
const lastSuppression = (f: Finding) =>
  [...f.history].reverse().find((e) => e.status === 'suppressed')

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className='mt-8 mb-3 break-after-avoid border-b border-zinc-300 pb-1 text-base font-semibold'>
      {children}
    </h2>
  )
}

const th = 'border-b border-zinc-300 py-1.5 pe-3 text-start font-semibold'
const td = 'border-b border-zinc-200 py-1.5 pe-3 align-top'

/**
 * Printable compliance report. Always renders as a white page so it prints
 * (or saves to PDF) the same way in light and dark mode.
 */
export function ComplianceReport() {
  const { account: accountId } = route.useSearch()
  const data = useCompliance(accountId)
  const user = useAuthStore((s) => s.auth.user)

  const toolbar = (
    <div className='mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden'>
      <Button asChild variant='ghost' size='sm' className='-ms-2'>
        <Link to='/compliance' search={{ account: accountId }}>
          <ArrowLeft /> Compliance
        </Link>
      </Button>
      <Button onClick={() => window.print()} disabled={data.status !== 'ready'}>
        <Printer /> Print or save as PDF
      </Button>
    </div>
  )

  if (data.status !== 'ready') {
    return (
      <>
        <div className='print:hidden'>
          <AppHeader />
        </div>
        <Main>
          {toolbar}
          {data.status === 'error' ? (
            <EmptyState
              icon={AlertTriangle}
              title='Could not build the report'
              action={
                <Button variant='outline' onClick={data.retry}>
                  Retry
                </Button>
              }
            />
          ) : (
            <Skeleton className='mx-auto h-[60vh] max-w-4xl' />
          )}
        </Main>
      </>
    )
  }

  const { framework, controls, sections, summary, findingsById, accountNames } =
    data
  const scopeAccounts = data.account ? [data.account] : data.accounts
  const failing = controls.filter((c) => c.status === 'fail')
  const manual = controls.filter((c) => c.status === 'manual')
  const passing = controls.filter((c) => c.status === 'pass')
  const exceptions = [
    ...new Set(controls.flatMap((c) => c.exceptionFindingIds)),
  ]
    .map((id) => findingsById.get(id))
    .filter((f): f is Finding => !!f)
  const unreachable = scopeAccounts.filter((a) => a.status !== 'connected')

  return (
    <>
      <div className='print:hidden'>
        <AppHeader />
      </div>
      <Main className='print:p-0'>
        {toolbar}

        <article className='mx-auto max-w-4xl rounded-lg bg-white p-8 text-sm text-zinc-900 shadow-sm ring-1 ring-zinc-200 sm:p-12 print:max-w-none print:p-0 print:shadow-none print:ring-0'>
          {/* Title block */}
          <header className='space-y-1'>
            <p className='text-xs font-medium tracking-wide text-zinc-500 uppercase'>
              {APP_CONFIG.name} compliance report
            </p>
            <h1 className='text-2xl font-bold'>
              {framework.name} v{framework.version}
            </h1>
            <p className='text-zinc-600'>
              {user?.organization ?? 'Your organisation'} ·{' '}
              {data.account ? data.account.name : 'All accounts'}
            </p>
          </header>

          <dl className='mt-6 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4'>
            <div>
              <dt className='text-xs text-zinc-500'>Generated</dt>
              <dd>{format(new Date(), 'd MMM yyyy, HH:mm')}</dd>
            </div>
            <div>
              <dt className='text-xs text-zinc-500'>Last evaluated</dt>
              <dd>
                {format(new Date(framework.evaluatedAt), 'd MMM yyyy, HH:mm')}
              </dd>
            </div>
            <div>
              <dt className='text-xs text-zinc-500'>Prepared by</dt>
              <dd>{user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className='text-xs text-zinc-500'>Accounts</dt>
              <dd>{scopeAccounts.length}</dd>
            </div>
          </dl>

          {/* Summary */}
          <H2>Summary</H2>
          <div className='grid gap-4 sm:grid-cols-4'>
            <div className='rounded-md border border-zinc-200 p-3'>
              <p className='text-3xl font-bold tabular-nums'>
                {summary.percent}%
              </p>
              <p className='text-xs text-zinc-500'>
                Automated controls passing
              </p>
            </div>
            {(
              [
                ['Failing', summary.fail, 'text-red-700'],
                ['Passing', summary.pass, 'text-green-700'],
                ['Manual check', summary.manual, 'text-zinc-700'],
              ] as const
            ).map(([label, count, tone]) => (
              <div
                key={label}
                className='rounded-md border border-zinc-200 p-3'
              >
                <p className={cn('text-3xl font-bold tabular-nums', tone)}>
                  {count}
                </p>
                <p className='text-xs text-zinc-500'>{label}</p>
              </div>
            ))}
          </div>
          {unreachable.length > 0 && (
            <p className='mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900'>
              <strong>Note:</strong> {unreachable.map((a) => a.name).join(', ')}{' '}
              {unreachable.length === 1 ? 'was' : 'were'} unreachable at the
              last scan, so results for{' '}
              {unreachable.length === 1 ? 'it' : 'them'} may be out of date.
            </p>
          )}

          <H2>Scope</H2>
          <table className='w-full border-collapse'>
            <thead>
              <tr>
                <th className={th}>Account</th>
                <th className={th}>AWS account ID</th>
                <th className={th}>Regions</th>
                <th className={th}>Last successful scan</th>
              </tr>
            </thead>
            <tbody>
              {scopeAccounts.map((a) => (
                <tr key={a.id}>
                  <td className={td}>{a.name}</td>
                  <td className={cn(td, 'font-mono text-xs')}>
                    {a.externalId}
                  </td>
                  <td className={td}>{a.regions.join(', ')}</td>
                  <td className={td}>
                    {a.lastScanAt
                      ? format(new Date(a.lastScanAt), 'd MMM yyyy')
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <H2>Results by section</H2>
          <table className='w-full border-collapse'>
            <thead>
              <tr>
                <th className={th}>Section</th>
                <th className={cn(th, 'text-end')}>Passing</th>
                <th className={cn(th, 'text-end')}>Failing</th>
                <th className={cn(th, 'text-end')}>Manual</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <tr key={s.id}>
                  <td className={td}>
                    {s.id}. {s.title}
                  </td>
                  <td className={cn(td, 'text-end tabular-nums')}>{s.pass}</td>
                  <td
                    className={cn(
                      td,
                      'text-end tabular-nums',
                      s.fail > 0 && 'font-semibold text-red-700'
                    )}
                  >
                    {s.fail}
                  </td>
                  <td className={cn(td, 'text-end tabular-nums')}>
                    {s.manual}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <H2>Failing controls ({failing.length})</H2>
          {failing.length === 0 ? (
            <p className='text-zinc-600'>No automated controls are failing.</p>
          ) : (
            <table className='w-full border-collapse'>
              <thead>
                <tr>
                  <th className={cn(th, 'w-14')}>Control</th>
                  <th className={th}>Title and affected resources</th>
                </tr>
              </thead>
              <tbody>
                {failing.map((c) => (
                  <tr key={c.controlId} className='break-inside-avoid'>
                    <td className={cn(td, 'font-mono text-xs')}>
                      {c.controlId}
                    </td>
                    <td className={td}>
                      <p className='font-medium'>{c.title}</p>
                      <ul className='mt-1 space-y-0.5 text-zinc-700'>
                        {c.failingFindingIds.map((id) => {
                          const f = findingsById.get(id)
                          if (!f) return null
                          return (
                            <li key={id}>
                              <span className='font-medium'>
                                [{SEVERITY_META[f.severity].label}]
                              </span>{' '}
                              {f.resourceName} ({accountNames.get(f.accountId)}
                              ): {f.title}
                            </li>
                          )
                        })}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <H2>Exceptions ({exceptions.length})</H2>
          {exceptions.length === 0 ? (
            <p className='text-zinc-600'>No findings have been suppressed.</p>
          ) : (
            <table className='w-full border-collapse'>
              <thead>
                <tr>
                  <th className={th}>Finding</th>
                  <th className={th}>Reason</th>
                  <th className={th}>Approved by</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((f) => {
                  const s = lastSuppression(f)
                  return (
                    <tr key={f.id} className='break-inside-avoid'>
                      <td className={td}>
                        <p className='font-medium'>{f.title}</p>
                        <p className='text-zinc-600'>
                          {f.resourceName} · {f.complianceRefs.join(', ')}
                        </p>
                      </td>
                      <td className={td}>
                        {s?.reason ? SUPPRESSION_REASONS[s.reason].label : '—'}
                        {s?.note && <p className='text-zinc-600'>“{s.note}”</p>}
                      </td>
                      <td className={td}>
                        {s ? (
                          <>
                            {s.by}
                            <p className='text-zinc-600'>
                              {format(new Date(s.at), 'd MMM yyyy')}
                            </p>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          <H2>Manual checks ({manual.length})</H2>
          <p className='mb-2 text-zinc-600'>
            These controls can't be checked through the AWS API. Record your
            evidence for each one.
          </p>
          <table className='w-full border-collapse'>
            <thead>
              <tr>
                <th className={cn(th, 'w-14')}>Control</th>
                <th className={th}>Title</th>
                <th className={cn(th, 'w-40')}>Reviewed by / date</th>
              </tr>
            </thead>
            <tbody>
              {manual.map((c) => (
                <tr key={c.controlId} className='break-inside-avoid'>
                  <td className={cn(td, 'font-mono text-xs')}>{c.controlId}</td>
                  <td className={td}>{c.title}</td>
                  <td className={td} />
                </tr>
              ))}
            </tbody>
          </table>

          <H2>Passing controls ({passing.length})</H2>
          <ul className='grid gap-x-6 gap-y-1 text-zinc-700 sm:grid-cols-2'>
            {passing.map((c) => (
              <li key={c.controlId} className='flex break-inside-avoid gap-2'>
                <span className='w-10 shrink-0 font-mono text-xs leading-5'>
                  {c.controlId}
                </span>
                <span>{c.title}</span>
              </li>
            ))}
          </ul>

          <footer className='mt-10 border-t border-zinc-300 pt-3 text-xs text-zinc-500'>
            Generated by {APP_CONFIG.name}. Automated results reflect the most
            recent scan of each account. This report measures configuration
            against CIS recommendations; it is not a certification.
          </footer>
        </article>
      </Main>
    </>
  )
}
