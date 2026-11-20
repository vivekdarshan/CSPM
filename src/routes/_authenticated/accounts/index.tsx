import { createFileRoute } from '@tanstack/react-router'
import { Cloud } from 'lucide-react'
import { PhasePlaceholder } from '@/components/cspm/phase-placeholder'

export const Route = createFileRoute('/_authenticated/accounts/')({
  component: () => (
    <PhasePlaceholder
      title='Cloud accounts'
      description='Connect and manage the AWS, Azure and Google Cloud accounts you want to monitor.'
      phase={2}
      icon={Cloud}
      plannedFeatures={[
        'Guided AWS connection using a read-only IAM role',
        'Connection status and health checks',
        'Account details, regions and last scan time',
      ]}
    />
  ),
})
