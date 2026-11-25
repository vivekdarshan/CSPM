import { createFileRoute } from '@tanstack/react-router'
import { RemediationDetails } from '@/features/remediation/details'

export const Route = createFileRoute('/_authenticated/remediation/$actionId')({
  component: RemediationDetailsRoute,
})

function RemediationDetailsRoute() {
  const { actionId } = Route.useParams()
  return <RemediationDetails key={actionId} actionId={actionId} />
}
