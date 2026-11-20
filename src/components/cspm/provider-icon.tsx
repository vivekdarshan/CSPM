import { type CloudProvider } from '@/types/cspm'
import { PROVIDER_META } from '@/lib/providers'
import { cn } from '@/lib/utils'

type ProviderIconProps = {
  provider: CloudProvider
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Compact provider mark. Swap for official logos once brand assets are added. */
export function ProviderIcon({
  provider,
  size = 'md',
  className,
}: ProviderIconProps) {
  const meta = PROVIDER_META[provider]
  return (
    <span
      role='img'
      aria-label={meta.label}
      title={meta.label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-bold tracking-tight',
        size === 'sm' && 'h-5 w-7 text-[9px]',
        size === 'md' && 'h-7 w-9 text-[11px]',
        size === 'lg' && 'h-10 w-12 text-sm',
        meta.className,
        className
      )}
    >
      {meta.short}
    </span>
  )
}
