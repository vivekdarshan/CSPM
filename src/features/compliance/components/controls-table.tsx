import { Fragment } from 'react'
import { type ComplianceControl, type ComplianceSection } from '@/types/cspm'
import { ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ControlStatusBadge } from './control-status'

type ControlsTableProps = {
  sections: ComplianceSection[]
  controls: ComplianceControl[]
  onOpen: (controlId: string) => void
}

/** Controls grouped under their CIS section headings. */
export function ControlsTable({
  sections,
  controls,
  onOpen,
}: ControlsTableProps) {
  if (controls.length === 0) {
    return (
      <p className='text-muted-foreground rounded-md border p-8 text-center text-sm'>
        No controls match these filters.
      </p>
    )
  }
  return (
    <div className='overflow-hidden rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-16 ps-4'>Control</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className='hidden sm:table-cell'>Level</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='hidden text-end md:table-cell'>
              Failing
            </TableHead>
            <TableHead className='w-8'>
              <span className='sr-only'>Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => {
            const rows = controls.filter((c) => c.sectionId === section.id)
            if (rows.length === 0) return null
            return (
              <Fragment key={section.id}>
                <TableRow className='bg-muted/40 hover:bg-muted/40'>
                  <TableCell
                    colSpan={6}
                    className='ps-4 text-xs font-semibold tracking-wide uppercase'
                  >
                    {section.id}. {section.title}
                  </TableCell>
                </TableRow>
                {rows.map((c) => (
                  <TableRow
                    key={c.controlId}
                    className='cursor-pointer'
                    onClick={() => onOpen(c.controlId)}
                  >
                    <TableCell className='ps-4 font-mono text-xs'>
                      {c.controlId}
                    </TableCell>
                    <TableCell className='min-w-56 whitespace-normal'>
                      <button
                        type='button'
                        className='text-start hover:underline'
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpen(c.controlId)
                        }}
                      >
                        {c.title}
                      </button>
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden sm:table-cell'>
                      L{c.level}
                    </TableCell>
                    <TableCell>
                      <ControlStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className='hidden text-end tabular-nums md:table-cell'>
                      {c.failingFindingIds.length || (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronRight
                        className='text-muted-foreground size-4'
                        aria-hidden
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
