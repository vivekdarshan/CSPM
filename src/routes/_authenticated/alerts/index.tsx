import { createFileRoute } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { PhasePlaceholder } from '@/components/cspm/phase-placeholder'

export const Route = createFileRoute('/_authenticated/alerts/')({
  component: () => (
    <PhasePlaceholder
      title='Alerts'
      description='Get notified when new risks appear in your cloud.'
      phase={5}
      icon={Bell}
      plannedFeatures={[
        'Alert rules by severity, account and category',
        'Email and Slack notifications',
        'Alert history',
      ]}
    />
  ),
})
