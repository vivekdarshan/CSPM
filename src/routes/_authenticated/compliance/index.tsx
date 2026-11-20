import { createFileRoute } from '@tanstack/react-router'
import { ClipboardCheck } from 'lucide-react'
import { PhasePlaceholder } from '@/components/cspm/phase-placeholder'

export const Route = createFileRoute('/_authenticated/compliance/')({
  component: () => (
    <PhasePlaceholder
      title='Compliance'
      description='How your accounts measure up against security benchmarks.'
      phase={5}
      icon={ClipboardCheck}
      plannedFeatures={[
        'CIS AWS Foundations Benchmark controls',
        'Pass/fail status per control and account',
        'Exportable compliance reports',
      ]}
    />
  ),
})
