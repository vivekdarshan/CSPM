import { useEffect, useMemo, useState } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { type FindingCategory } from '@/types/cspm'
import { Search, X } from 'lucide-react'
import { resourceTypeMeta } from '@/lib/assets'
import { CATEGORY_LABELS } from '@/lib/findings'
import { SEVERITY_META, SEVERITY_ORDER } from '@/lib/severity'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableViewOptions,
} from '@/components/data-table'
import { type FindingRow, findingsColumns as columns } from './findings-columns'

const route = getRouteApi('/_authenticated/findings/')

export function FindingsTable({ data }: { data: FindingRow[] }) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'severity', desc: true },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    type: false,
  })

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'severity', searchKey: 'severity', type: 'array' },
      { columnId: 'category', searchKey: 'category', type: 'array' },
      { columnId: 'account', searchKey: 'account', type: 'array' },
      { columnId: 'type', searchKey: 'type', type: 'array' },
    ],
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).trim().toLowerCase()
      if (!q) return true
      const f = row.original
      return [
        f.title,
        f.resourceName,
        f.ruleId,
        f.accountName,
        ...f.complianceRefs,
      ].some((text) => text.toLowerCase().includes(q))
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange])

  const options = useMemo(() => {
    const unique = <T,>(values: T[]) => [...new Set(values)]
    return {
      severity: SEVERITY_ORDER.map((s) => ({
        value: s,
        label: SEVERITY_META[s].label,
      })),
      category: (Object.keys(CATEGORY_LABELS) as FindingCategory[]).map(
        (c) => ({ value: c, label: CATEGORY_LABELS[c] })
      ),
      account: unique(data.map((f) => f.accountId)).map((id) => ({
        value: id,
        label: data.find((f) => f.accountId === id)!.accountName,
      })),
      type: unique(data.map((f) => f.resourceType))
        .map((t) => ({ value: t, label: resourceTypeMeta(t).label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }
  }, [data])

  const isFiltered =
    table.getState().columnFilters.length > 0 || !!table.getState().globalFilter

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative w-full sm:w-64'>
          <Search
            className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2'
            aria-hidden
          />
          <Input
            type='search'
            placeholder='Search title, resource or CIS ref'
            aria-label='Search findings'
            value={table.getState().globalFilter ?? ''}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className='h-8 ps-8'
          />
        </div>
        <DataTableFacetedFilter
          column={table.getColumn('severity')}
          title='Severity'
          options={options.severity}
        />
        <DataTableFacetedFilter
          column={table.getColumn('category')}
          title='Category'
          options={options.category}
        />
        <DataTableFacetedFilter
          column={table.getColumn('account')}
          title='Account'
          options={options.account}
        />
        <DataTableFacetedFilter
          column={table.getColumn('type')}
          title='Resource'
          options={options.type}
        />
        {isFiltered && (
          <Button
            variant='ghost'
            size='sm'
            className='h-8 px-2'
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
            }}
          >
            Reset <X />
          </Button>
        )}
        <div className='ms-auto hidden items-center gap-3 sm:flex'>
          <span className='text-muted-foreground text-sm' aria-live='polite'>
            {table.getFilteredRowModel().rows.length} of {data.length}
          </span>
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className='first:ps-4'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className='cursor-pointer'
                  onClick={() =>
                    navigate({
                      to: '/findings/$findingId',
                      params: { findingId: row.original.id },
                    })
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='first:ps-4'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='text-muted-foreground h-24 text-center'
                >
                  No findings match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
