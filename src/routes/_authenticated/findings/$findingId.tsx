import { createFileRoute } from '@tanstack/react-router'
import { FindingDetails } from '@/features/findings/details'

export const Route = createFileRoute('/_authenticated/findings/$findingId')({
  component: FindingDetailsRoute,
})

function FindingDetailsRoute() {
  const { findingId } = Route.useParams()
  return <FindingDetails key={findingId} findingId={findingId} />
}
