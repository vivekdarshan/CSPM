import { format, parseISO } from 'date-fns'
import { type FindingsTrendPoint } from '@/types/cspm'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import { CHARTED_SEVERITIES, SEVERITY_META } from '@/lib/severity'
import { cn } from '@/lib/utils'
import { SeverityDot } from '@/components/cspm/severity-badge'

// Stack the most severe at the bottom so it sits on the baseline
const STACK_ORDER = [...CHARTED_SEVERITIES]

function TrendTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload as FindingsTrendPoint
  const total = STACK_ORDER.reduce((sum, s) => sum + point[s], 0)
  return (
    <div className='bg-popover text-popover-foreground min-w-40 rounded-lg border px-3 py-2 text-xs shadow-md'>
      <div className='mb-1.5 font-medium'>
        {format(parseISO(String(label)), 'EEE d MMM')}
      </div>
      {STACK_ORDER.map((s) => (
        <div key={s} className='flex items-center justify-between gap-4 py-0.5'>
          <span className='flex items-center gap-1.5'>
            <SeverityDot severity={s} />
            {SEVERITY_META[s].label}
          </span>
          <span className='font-medium tabular-nums'>{point[s]}</span>
        </div>
      ))}
      <div className='mt-1 flex justify-between border-t pt-1 font-medium'>
        <span>Total open</span>
        <span className='tabular-nums'>{total}</span>
      </div>
    </div>
  )
}

export function FindingsTrendChart({ data }: { data: FindingsTrendPoint[] }) {
  return (
    <div>
      <ul className='mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs' aria-hidden>
        {STACK_ORDER.map((s) => (
          <li
            key={s}
            className='text-muted-foreground flex items-center gap-1.5'
          >
            <SeverityDot severity={s} />
            {SEVERITY_META[s].label}
          </li>
        ))}
      </ul>
      <ResponsiveContainer width='100%' height={260}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray='0'
            className='stroke-border'
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey='date'
            tickFormatter={(d: string) => format(parseISO(d), 'd MMM')}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            fontSize={12}
            className='fill-muted-foreground'
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={40}
            tick={{ fill: 'currentColor' }}
            className='text-muted-foreground'
          />
          <Tooltip
            content={TrendTooltip}
            cursor={{ stroke: 'currentColor', strokeWidth: 1 }}
            wrapperClassName='text-muted-foreground'
          />
          {STACK_ORDER.map((s) => (
            <Area
              key={s}
              type='monotone'
              dataKey={s}
              name={SEVERITY_META[s].label}
              stackId='open'
              stroke='currentColor'
              strokeWidth={2}
              fill='currentColor'
              fillOpacity={0.18}
              className={cn(SEVERITY_META[s].textClass)}
              activeDot={{ r: 4, strokeWidth: 2, className: 'stroke-card' }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Table view of the same data for screen readers */}
      <table className='sr-only'>
        <caption>Open findings by severity, last 30 days</caption>
        <thead>
          <tr>
            <th scope='col'>Date</th>
            {STACK_ORDER.map((s) => (
              <th key={s} scope='col'>
                {SEVERITY_META[s].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.date}>
              <th scope='row'>{p.date}</th>
              {STACK_ORDER.map((s) => (
                <td key={s}>{p[s]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
