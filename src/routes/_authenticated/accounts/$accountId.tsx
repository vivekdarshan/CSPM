import { createFileRoute } from '@tanstack/react-router'
import { AccountDetails } from '@/features/accounts/details'

export const Route = createFileRoute('/_authenticated/accounts/$accountId')({
  component: AccountDetailsRoute,
})

function AccountDetailsRoute() {
  const { accountId } = Route.useParams()
  // Remount per account so dialogs and test results don't carry over
  return <AccountDetails key={accountId} accountId={accountId} />
}
