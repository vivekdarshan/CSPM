import { createFileRoute } from '@tanstack/react-router'
import { ShieldAlert } from 'lucide-react'
import { PhasePlaceholder } from '@/components/cspm/phase-placeholder'

export const Route = createFileRoute('/_authenticated/findings/')({
  component: () => (
    <PhasePlaceholder
      title='Findings'
      description='Misconfigurations and exposed resources, ranked by risk.'
      phase={4}
      icon={ShieldAlert}
      plannedFeatures={[
        'Findings table with severity, status and resource filters',
        'Plain-language risk explanation for each finding',
        'Step-by-step remediation guidance',
      ]}
    />
  ),
})
