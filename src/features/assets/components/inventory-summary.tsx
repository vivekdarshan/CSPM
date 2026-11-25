import { getRouteApi } from '@tanstack/react-router'
import { Globe } from 'lucide-react'
import { INVENTORY_GROUPS } from '@/lib/assets'
import { cn } from '@/lib/utils'
import { type AssetRow } from '../types'

const route = getRouteApi('/_authenticated/assets/')

const sameSet = (a: readonly string[] = [], b: readonly string[] = []) =>
  a.length === b.length && a.every((v) => b.includes(v))

/** Count tiles per resource group; clicking one filters the table. */
export function InventorySummary({ data }: { data: AssetRow[] }) {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const tiles = [
    ...INVENTORY_GROUPS.map((g) => {
      const items = data.filter((a) =>
        (g.types as readonly string[]).includes(a.resourceType)
      )
      return {
        id: g.id,
        label: g.label,
        icon: g.icon,
        count: items.length,
        atRisk: items.filter((a) => a.openFindingCount > 0).length,
        active: sameSet(search.type, g.types),
        apply: (active: boolean) =>
          navigate({
            search: (prev) => ({
              ...prev,
              type: active ? undefined : [...g.types],
              exposure: undefined,
              page: undefined,
            }),
          }),
      }
    }),
    (() => {
      const items = data.filter((a) => a.publiclyExposed)
      const active =
        sameSet(search.exposure, ['public']) && !search.type?.length
      return {
        id: 'public',
        label: 'Internet-facing',
        icon: Globe,
        count: items.length,
        atRisk: items.filter((a) => a.openFindingCount > 0).length,
        active,
        apply: (isActive: boolean) =>
          navigate({
            search: (prev) => ({
              ...prev,
              type: undefined,
              exposure: isActive ? undefined : ['public' as const],
              page: undefined,
            }),
          }),
      }
    })(),
  ]

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6'>
      {tiles.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type='button'
            aria-pressed={t.active}
            onClick={() => t.apply(t.active)}
            className={cn(
              'bg-card hover:bg-muted/50 rounded-xl border p-4 text-start transition-colors',
              'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
              t.active && 'border-primary ring-primary/20 ring-2'
            )}
          >
            <div className='text-muted-foreground flex items-center justify-between text-xs font-medium'>
              {t.label}
              <Icon className='size-4' aria-hidden />
            </div>
            <div className='mt-2 text-2xl font-bold tabular-nums'>
              {t.count}
            </div>
            <div
              className={cn(
                'mt-0.5 text-xs',
                t.atRisk > 0
                  ? 'text-severity-high-ink'
                  : 'text-muted-foreground'
              )}
            >
              {t.atRisk > 0
                ? `${t.atRisk} with open findings`
                : 'No open findings'}
            </div>
          </button>
        )
      })}
    </div>
  )
}
