import { createFileRoute } from '@tanstack/react-router'
import { Hammer } from 'lucide-react'
import { PhasePlaceholder } from '@/components/cspm/phase-placeholder'

export const Route = createFileRoute('/_authenticated/remediation/')({
  component: () => (
    <PhasePlaceholder
      title='Remediation'
      description='Review, approve and track fixes for security findings.'
      phase={6}
      icon={Hammer}
      plannedFeatures={[
        'Approval workflow before any change is made',
        'Execution status for each fix',
        'Verification that the issue is resolved',
      ]}
    />
  ),
})
