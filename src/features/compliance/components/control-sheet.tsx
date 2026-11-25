import { Link } from '@tanstack/react-router'
import { APP_CONFIG } from '@/config/app'
import {
  type ComplianceControl,
  type ComplianceSection,
  type Finding,
} from '@/types/cspm'
import { ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SeverityBadge } from '@/components/cspm/severity-badge'
import { ControlStatusBadge } from './control-status'

type ControlSheetProps = {
  control: ComplianceControl | undefined
  section: ComplianceSection | undefined
  findings: Map<string, Finding>
  accountNames: Map<string, string>
  onClose: () => void
}

function FindingList({
  ids,
  findings,
  accountNames,
}: {
  ids: string[]
  findings: Map<string, Finding>
  accountNames: Map<string, string>
}) {
  return (
    <ul className='divide-y rounded-md border'>
      {ids.map((id) => {
        const f = findings.get(id)
        if (!f) return null
        return (
          <li key={id} className='space-y-1 p-3'>
            <div className='flex items-center gap-2'>
              <SeverityBadge severity={f.severity} />
              <span className='text-muted-foreground truncate text-xs'>
                {f.resourceName} · {accountNames.get(f.accountId)}
              </span>
            </div>
            <Link
              to='/findings/$findingId'
              params={{ findingId: f.id }}
              className='block text-sm font-medium hover:underline'
            >
              {f.title}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function ControlSheet({
  control,
  section,
  findings,
  accountNames,
  onClose,
}: ControlSheetProps) {
  return (
    <Sheet open={!!control} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-lg'>
        {control && (
          <>
            <SheetHeader>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='font-mono text-sm font-semibold'>
                  CIS {control.controlId}
                </span>
                <ControlStatusBadge status={control.status} />
                <Badge variant='outline' className='text-muted-foreground'>
                  Level {control.level}
                </Badge>
              </div>
              <SheetTitle className='text-lg leading-snug'>
                {control.title}
              </SheetTitle>
              <SheetDescription>
                {section?.title} ·{' '}
                {control.assessment === 'manual'
                  ? 'Manual check'
                  : `Checked automatically by ${APP_CONFIG.name}`}
              </SheetDescription>
            </SheetHeader>

            <div className='space-y-6 px-4 pb-6'>
              <p className='text-sm leading-relaxed'>{control.description}</p>

              {control.status === 'manual' && (
                <div className='bg-muted/40 flex gap-3 rounded-lg border p-4 text-sm'>
                  <ClipboardList
                    className='text-muted-foreground mt-0.5 size-4 shrink-0'
                    aria-hidden
                  />
                  <p>
                    This control can't be checked through the AWS API. Review it
                    yourself and keep evidence for your auditor; it isn't
                    counted in the pass rate.
                  </p>
                </div>
              )}

              {control.status === 'pass' && (
                <p className='text-muted-foreground text-sm'>
                  No open findings fail this control.
                </p>
              )}

              {control.failingFindingIds.length > 0 && (
                <section className='space-y-2'>
                  <h3 className='text-sm font-medium'>
                    Failing because of {control.failingFindingIds.length}{' '}
                    finding
                    {control.failingFindingIds.length === 1 ? '' : 's'}
                  </h3>
                  <FindingList
                    ids={control.failingFindingIds}
                    findings={findings}
                    accountNames={accountNames}
                  />
                  <p className='text-muted-foreground text-xs'>
                    Fix or suppress these findings to pass the control.
                  </p>
                </section>
              )}

              {control.exceptionFindingIds.length > 0 && (
                <section className='space-y-2'>
                  <h3 className='text-sm font-medium'>
                    Exceptions (suppressed)
                  </h3>
                  <FindingList
                    ids={control.exceptionFindingIds}
                    findings={findings}
                    accountNames={accountNames}
                  />
                  <p className='text-muted-foreground text-xs'>
                    Suppressed findings don't fail the control, but auditors may
                    ask why. The reasons are in each finding's activity log.
                  </p>
                </section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
