import { type RemediationAction, type RemediationStatus } from '@/types/cspm'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

export const REMEDIATION_STATUS: Record<
  RemediationStatus,
  { label: string; tone: StatusTone }
> = {
  pending_approval: { label: 'Needs approval', tone: 'warning' },
  running: { label: 'Running', tone: 'info' },
  verifying: { label: 'Verifying', tone: 'info' },
  completed: { label: 'Fixed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  rejected: { label: 'Rejected', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  rolled_back: { label: 'Rolled back', tone: 'neutral' },
}

export const isActiveRemediation = (r: Pick<RemediationAction, 'status'>) =>
  r.status === 'pending_approval' ||
  r.status === 'running' ||
  r.status === 'verifying'

export const isInFlight = (r: Pick<RemediationAction, 'status'>) =>
  r.status === 'running' || r.status === 'verifying'

/**
 * Can this person approve? With the four-eyes rule on, never their own
 * request.
 */
export const canApprove = (
  r: Pick<RemediationAction, 'status' | 'requestedBy'>,
  userName: string | undefined,
  requireSecondApprover: boolean
) =>
  r.status === 'pending_approval' &&
  (!requireSecondApprover || r.requestedBy !== userName)
