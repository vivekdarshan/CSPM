type PageHeadingProps = {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeading({ title, description, actions }: PageHeadingProps) {
  return (
    <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
        {description && (
          <div className='text-muted-foreground text-sm'>{description}</div>
        )}
      </div>
      {actions && <div className='flex items-center gap-2'>{actions}</div>}
    </div>
  )
}
