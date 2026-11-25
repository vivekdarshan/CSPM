import { createFileRoute } from '@tanstack/react-router'
import { ConnectAccount } from '@/features/accounts/connect'

export const Route = createFileRoute('/_authenticated/accounts/connect')({
  component: ConnectAccount,
})
