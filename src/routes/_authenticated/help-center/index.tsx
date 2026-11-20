import { createFileRoute } from '@tanstack/react-router'
import { HelpCircle } from 'lucide-react'
import { PhasePlaceholder } from '@/components/cspm/phase-placeholder'

export const Route = createFileRoute('/_authenticated/help-center/')({
  component: () => (
    <PhasePlaceholder
      title='Help Center'
      description='Guides for connecting accounts and fixing common issues.'
      phase={2}
      icon={HelpCircle}
      plannedFeatures={[
        'AWS connection guide',
        'What each finding means and why it matters',
      ]}
    />
  ),
})
