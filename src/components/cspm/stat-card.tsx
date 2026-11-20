import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type StatCardProps = {
  title: string
  value: React.ReactNode
  icon?: React.ElementType
  description?: React.ReactNode
  loading?: boolean
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: StatCardProps) {
  return (
    <Card className='gap-2'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>
          {title}
        </CardTitle>
        {Icon && <Icon className='text-muted-foreground size-4' aria-hidden />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className='h-8 w-16' />
            <Skeleton className='mt-2 h-3 w-28' />
          </>
        ) : (
          <>
            <div className='text-3xl font-bold tabular-nums'>{value}</div>
            {description && (
              <div className='text-muted-foreground mt-1 text-xs'>
                {description}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
