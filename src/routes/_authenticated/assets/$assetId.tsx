import { createFileRoute } from '@tanstack/react-router'
import { AssetDetails } from '@/features/assets/details'

export const Route = createFileRoute('/_authenticated/assets/$assetId')({
  component: AssetDetailsRoute,
})

function AssetDetailsRoute() {
  const { assetId } = Route.useParams()
  return <AssetDetails key={assetId} assetId={assetId} />
}
