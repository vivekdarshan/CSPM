import { Construction } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { EmptyState } from './empty-state'
import { PageHeading } from './page-heading'

type PhasePlaceholderProps = {
  title: string
  description: string
  phase: number
  icon?: React.ElementType
  /** What this screen will do once built */
  plannedFeatures: string[]
}

/** Stand-in for screens that arrive in a later build phase. */
export function PhasePlaceholder({
  title,
  description,
  phase,
  icon = Construction,
  plannedFeatures,
}: PhasePlaceholderProps) {
  return (
    <>
      <AppHeader />
      <Main>
        <PageHeading title={title} description={description} />
        <EmptyState
          icon={icon}
          title={`Coming in Phase ${phase}`}
          description={
            <ul className='mt-2 space-y-1 text-start'>
              {plannedFeatures.map((feature) => (
                <li key={feature} className='flex gap-2'>
                  <span aria-hidden>•</span>
                  {feature}
                </li>
              ))}
            </ul>
          }
        />
      </Main>
    </>
  )
}
