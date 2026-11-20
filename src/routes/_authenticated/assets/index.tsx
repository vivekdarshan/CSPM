import { createFileRoute } from '@tanstack/react-router'
import { Boxes } from 'lucide-react'
import { PhasePlaceholder } from '@/components/cspm/phase-placeholder'

export const Route = createFileRoute('/_authenticated/assets/')({
  component: () => (
    <PhasePlaceholder
      title='Assets'
      description='Every resource discovered across your connected cloud accounts.'
      phase={3}
      icon={Boxes}
      plannedFeatures={[
        'EC2, S3, RDS, IAM and security group inventory',
        'Filter by account, region, type and exposure',
        'Search across resource names and tags',
      ]}
    />
  ),
})
