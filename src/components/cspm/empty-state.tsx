import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: React.ElementType
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center',
        className
      )}
    >
      <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
        <Icon className='text-muted-foreground size-6' aria-hidden />
      </div>
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold'>{title}</h2>
        {description && (
          <p className='text-muted-foreground mx-auto max-w-md text-sm'>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
