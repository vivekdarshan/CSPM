import { type Severity } from '@/types/cspm'
import { SEVERITY_META } from '@/lib/severity'
import { cn } from '@/lib/utils'

type SeverityBadgeProps = {
  severity: Severity
  className?: string
}

/** Severity pill: colored dot + text label, so meaning never relies on color alone. */
export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const meta = SEVERITY_META[severity]
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        meta.badgeClass,
        className
      )}
    >
      <SeverityDot severity={severity} />
      {meta.label}
    </span>
  )
}

export function SeverityDot({
  severity,
  className,
}: {
  severity: Severity
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        SEVERITY_META[severity].bgClass,
        className
      )}
    />
  )
}
