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
import { Search, X } from 'lucide-react'
import { resourceTypeMeta } from '@/lib/assets'
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
import { type AssetRow } from '../types'
import { RISK_OPTIONS, assetsColumns as columns } from './assets-columns'

const route = getRouteApi('/_authenticated/assets/')

export function AssetsTable({ data }: { data: AssetRow[] }) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'risk', desc: true },
  ])
  // Every asset was seen in the latest scan, so "Last seen" starts hidden
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    lastSeenAt: false,
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
      { columnId: 'type', searchKey: 'type', type: 'array' },
      { columnId: 'account', searchKey: 'account', type: 'array' },
      { columnId: 'region', searchKey: 'region', type: 'array' },
      { columnId: 'exposure', searchKey: 'exposure', type: 'array' },
      { columnId: 'risk', searchKey: 'risk', type: 'array' },
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
      const a = row.original
      return [
        a.name,
        a.resourceId,
        a.accountName,
        resourceTypeMeta(a.resourceType).label,
        ...Object.entries(a.tags).map(([k, v]) => `${k}:${v}`),
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

  const filterOptions = useMemo(() => {
    const unique = <T,>(values: T[]) => [...new Set(values)]
    return {
      type: unique(data.map((a) => a.resourceType))
        .map((t) => ({ value: t, label: resourceTypeMeta(t).label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      account: unique(data.map((a) => a.accountId)).map((id) => ({
        value: id,
        label: data.find((a) => a.accountId === id)!.accountName,
      })),
      region: unique(data.map((a) => a.region))
        .sort()
        .map((r) => ({ value: r, label: r })),
      exposure: [
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' },
      ],
      risk: RISK_OPTIONS,
    }
  }, [data])

  const isFiltered =
    table.getState().columnFilters.length > 0 || !!table.getState().globalFilter
  const shown = table.getFilteredRowModel().rows.length

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
            placeholder='Search name, ID or tag'
            aria-label='Search assets'
            value={table.getState().globalFilter ?? ''}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className='h-8 ps-8'
          />
        </div>
        <DataTableFacetedFilter
          column={table.getColumn('type')}
          title='Type'
          options={filterOptions.type}
        />
        <DataTableFacetedFilter
          column={table.getColumn('account')}
          title='Account'
          options={filterOptions.account}
        />
        <DataTableFacetedFilter
          column={table.getColumn('region')}
          title='Region'
          options={filterOptions.region}
        />
        <DataTableFacetedFilter
          column={table.getColumn('exposure')}
          title='Exposure'
          options={filterOptions.exposure}
        />
        <DataTableFacetedFilter
          column={table.getColumn('risk')}
          title='Findings'
          options={filterOptions.risk}
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
            {shown} of {data.length} assets
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
                      to: '/assets/$assetId',
                      params: { assetId: row.original.id },
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
                  No assets match these filters.
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
