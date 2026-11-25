/**
 * Mock remediation engine: approval, step-by-step execution, verification
 * by re-scan, and rollback. State lives until the page reloads.
 */
import {
  type AssetConfiguration,
  type RemediationAction,
  type RemediationSettings,
  type RemediationStep,
  type RequestRemediationInput,
} from '@/types/cspm'
import { useAuthStore } from '@/stores/auth-store'
import { isOpenFinding } from '@/lib/findings'
import { mockAccounts, mockAssets, mockFindings } from './data'
import { PLAYBOOKS, isPubliclyExposed } from './playbooks'
import { recountFor, raiseAlert } from './store'
import { daysAgo, hoursAgo } from './time'

const STEP_MS = { snapshot: 1200, apply: 2000, propagate: 1500, verify: 2000 }

export const remediationSettings: RemediationSettings = {
  requireSecondApprover: true,
}

/** Configuration before each fix, for rollback. */
const snapshots = new Map<
  string,
  { configuration: AssetConfiguration; publiclyExposed: boolean }
>()

const currentUser = () =>
  useAuthStore.getState().auth.user?.name ?? 'Unknown user'

function newSteps(): RemediationStep[] {
  return [
    {
      id: 'snapshot',
      label: 'Record current configuration',
      status: 'pending',
    },
    { id: 'apply', label: 'Apply the change', status: 'pending' },
    { id: 'propagate', label: 'Wait for AWS to apply it', status: 'pending' },
    { id: 'verify', label: 'Re-scan the resource', status: 'pending' },
  ]
}

function build(
  id: string,
  findingId: string,
  requestedBy: string,
  requestedAt: string,
  note?: string
): RemediationAction {
  const finding = mockFindings.find((f) => f.id === findingId)
  if (!finding) throw new Error('Finding not found')
  const asset = mockAssets.find((a) => a.id === finding.assetId)
  const playbook = PLAYBOOKS[finding.ruleId]
  if (!asset || !playbook) {
    throw new Error('This finding cannot be fixed automatically.')
  }
  return {
    id,
    findingId,
    findingTitle: finding.title,
    severity: finding.severity,
    ruleId: finding.ruleId,
    assetId: asset.id,
    resourceName: asset.name,
    resourceType: asset.resourceType,
    accountId: asset.accountId,
    region: asset.region,
    status: 'pending_approval',
    requestedBy,
    requestedAt,
    note,
    changes: playbook.changes(asset),
    apiCalls: playbook.apiCalls,
    warnings: playbook.irreversibleReason
      ? [...playbook.warnings, playbook.irreversibleReason]
      : playbook.warnings,
    reversible: playbook.reversible,
    steps: newSteps(),
    events: [{ at: requestedAt, by: requestedBy, type: 'requested', note }],
  }
}

/* ----- Seeded history ----- */

function seed(): RemediationAction[] {
  const pending = build(
    'rem-001',
    'fnd-004',
    'Priya Shah',
    hoursAgo(2),
    'Nobody should SSH into staging from the internet; we use Session Manager now.'
  )

  // CloudTrail fix that a scan confirmed (finding fnd-017 is resolved)
  const completed = build('rem-002', 'fnd-017', 'Priya Shah', daysAgo(5))
  Object.assign(completed, {
    status: 'completed',
    decidedBy: 'Jane Doe',
    decidedAt: daysAgo(5),
    steps: newSteps().map((s) => ({
      ...s,
      status: 'done' as const,
      finishedAt: daysAgo(5),
    })),
    verification: {
      status: 'passed',
      checkedAt: daysAgo(5),
      detail: 'The finding no longer appears. It has been marked resolved.',
    },
    events: [
      { at: daysAgo(5), by: 'Priya Shah', type: 'requested' },
      { at: daysAgo(5), by: 'Jane Doe', type: 'approved' },
      { at: daysAgo(5), by: 'Vigil', type: 'completed' },
      { at: daysAgo(5), by: 'Vigil', type: 'verified' },
    ],
  } satisfies Partial<RemediationAction>)

  const failed = build('rem-003', 'fnd-010', 'Jane Doe', daysAgo(2))
  Object.assign(failed, {
    status: 'failed',
    decidedBy: 'Priya Shah',
    decidedAt: daysAgo(2),
    error: PLAYBOOKS['aws-vpc-flow-logs'].failWith,
    steps: failed.steps.map((s) =>
      s.id === 'snapshot'
        ? { ...s, status: 'done' as const, finishedAt: daysAgo(2) }
        : s.id === 'apply'
          ? {
              ...s,
              status: 'failed' as const,
              detail: PLAYBOOKS['aws-vpc-flow-logs'].failWith,
              finishedAt: daysAgo(2),
            }
          : { ...s, status: 'skipped' as const }
    ),
    events: [
      ...failed.events,
      { at: daysAgo(2), by: 'Priya Shah', type: 'approved' },
      { at: daysAgo(2), by: 'Vigil', type: 'failed' },
    ],
  } satisfies Partial<RemediationAction>)

  const rejected = build('rem-004', 'fnd-003', 'Priya Shah', daysAgo(4))
  const reason =
    'Changing this now would cut off the reporting tool. We are moving orders-db to private subnets by hand this sprint.'
  Object.assign(rejected, {
    status: 'rejected',
    decidedBy: 'Jane Doe',
    decidedAt: daysAgo(3),
    rejectionReason: reason,
    steps: rejected.steps.map((s) => ({ ...s, status: 'skipped' as const })),
    events: [
      ...rejected.events,
      { at: daysAgo(3), by: 'Jane Doe', type: 'rejected', note: reason },
    ],
  } satisfies Partial<RemediationAction>)

  return [pending, completed, failed, rejected]
}

export const mockRemediations: RemediationAction[] = seed()

/* ----- Queries ----- */

const ACTIVE = new Set(['pending_approval', 'running', 'verifying'])

const withRollback = (r: RemediationAction): RemediationAction => ({
  ...r,
  canRollBack: r.status === 'completed' && r.reversible && snapshots.has(r.id),
})

export const getRemediations = () =>
  [...mockRemediations]
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    .map(withRollback)

function findRemediation(id: string) {
  const action = mockRemediations.find((r) => r.id === id)
  if (!action) throw new Error('Fix not found')
  return action
}

export const getRemediation = (id: string) => withRollback(findRemediation(id))

/* ----- Commands ----- */

export function requestRemediation(
  input: RequestRemediationInput
): RemediationAction {
  const finding = mockFindings.find((f) => f.id === input.findingId)
  if (!finding) throw new Error('Finding not found')
  if (!isOpenFinding(finding)) {
    throw new Error('Only open findings can be fixed.')
  }
  const existing = mockRemediations.find(
    (r) => r.findingId === finding.id && ACTIVE.has(r.status)
  )
  if (existing)
    throw new Error('A fix for this finding is already in progress.')
  const account = mockAccounts.find((a) => a.id === finding.accountId)
  if (!account?.remediationRoleArn) {
    throw new Error(
      `Automatic fixes are not enabled for ${account?.name ?? 'this account'}.`
    )
  }

  const by = currentUser()
  const action = build(
    `rem-${Math.random().toString(16).slice(2, 8)}`,
    finding.id,
    by,
    new Date().toISOString(),
    input.note?.trim() || undefined
  )
  mockRemediations.unshift(action)
  if (remediationSettings.requireSecondApprover) {
    raiseAlert({
      type: 'remediation_pending',
      title: `Fix waiting for approval: ${finding.title}`,
      message: `${by} asked to fix ${action.resourceName}. Someone else must approve it.`,
      remediationId: action.id,
    })
  }
  return action
}

export function approveRemediation(id: string): RemediationAction {
  const action = findRemediation(id)
  if (action.status !== 'pending_approval') {
    throw new Error('This fix is no longer waiting for approval.')
  }
  const by = currentUser()
  if (remediationSettings.requireSecondApprover && by === action.requestedBy) {
    throw new Error('Someone other than the requester must approve this fix.')
  }
  const now = new Date().toISOString()
  action.decidedBy = by
  action.decidedAt = now
  action.events.push({ at: now, by, type: 'approved' })
  execute(action)
  return action
}

export function rejectRemediation(id: string, reason: string) {
  const action = findRemediation(id)
  if (action.status !== 'pending_approval') {
    throw new Error('This fix is no longer waiting for approval.')
  }
  const now = new Date().toISOString()
  const by = currentUser()
  Object.assign(action, {
    status: 'rejected',
    decidedBy: by,
    decidedAt: now,
    rejectionReason: reason,
  })
  action.steps = action.steps.map((s) => ({ ...s, status: 'skipped' }))
  action.events.push({ at: now, by, type: 'rejected', note: reason })
  return action
}

export function cancelRemediation(id: string) {
  const action = findRemediation(id)
  if (action.status !== 'pending_approval') {
    throw new Error('Only fixes waiting for approval can be cancelled.')
  }
  action.status = 'cancelled'
  action.steps = action.steps.map((s) => ({ ...s, status: 'skipped' }))
  action.events.push({
    at: new Date().toISOString(),
    by: currentUser(),
    type: 'cancelled',
  })
  return action
}

export function rollbackRemediation(id: string) {
  const action = findRemediation(id)
  const snapshot = snapshots.get(id)
  if (action.status !== 'completed' || !action.reversible || !snapshot) {
    throw new Error('This fix cannot be rolled back.')
  }
  const asset = mockAssets.find((a) => a.id === action.assetId)
  const finding = mockFindings.find((f) => f.id === action.findingId)
  const now = new Date().toISOString()
  const by = currentUser()
  if (asset) Object.assign(asset, snapshot)
  if (finding) {
    finding.status = 'open'
    finding.lastSeenAt = now
    finding.history.push({
      at: now,
      by,
      type: 'status_changed',
      status: 'open',
      note: 'Reopened because the automatic fix was rolled back.',
    })
    recountFor(finding)
  }
  action.status = 'rolled_back'
  action.events.push({ at: now, by, type: 'rolled_back' })
  return action
}

export function updateRemediationSettings(patch: Partial<RemediationSettings>) {
  Object.assign(remediationSettings, patch)
  return remediationSettings
}

/* ----- Execution ----- */

function setStep(
  action: RemediationAction,
  id: string,
  patch: Partial<RemediationStep>
) {
  action.steps = action.steps.map((s) => (s.id === id ? { ...s, ...patch } : s))
}

function execute(action: RemediationAction) {
  const playbook = PLAYBOOKS[action.ruleId]
  const done = () => ({
    status: 'done' as const,
    finishedAt: new Date().toISOString(),
  })
  action.status = 'running'
  action.events.push({
    at: new Date().toISOString(),
    by: 'Vigil',
    type: 'started',
  })
  setStep(action, 'snapshot', { status: 'running' })

  setTimeout(() => {
    const asset = mockAssets.find((a) => a.id === action.assetId)
    if (asset) {
      snapshots.set(action.id, {
        configuration: structuredClone(asset.configuration),
        publiclyExposed: asset.publiclyExposed,
      })
    }
    setStep(action, 'snapshot', done())
    setStep(action, 'apply', {
      status: 'running',
      detail: `Calling ${action.apiCalls.join(', ')}`,
    })

    setTimeout(() => {
      if (playbook?.failWith) return fail(action, playbook.failWith)
      if (asset && playbook) {
        asset.configuration = playbook.apply(asset.configuration)
        asset.publiclyExposed = isPubliclyExposed(
          asset.configuration,
          asset.publiclyExposed
        )
      }
      setStep(action, 'apply', done())
      setStep(action, 'propagate', { status: 'running' })

      setTimeout(() => {
        setStep(action, 'propagate', done())
        setStep(action, 'verify', { status: 'running' })
        action.status = 'verifying'
        setTimeout(() => verify(action), STEP_MS.verify)
      }, STEP_MS.propagate)
    }, STEP_MS.apply)
  }, STEP_MS.snapshot)
}

function fail(action: RemediationAction, error: string) {
  const now = new Date().toISOString()
  setStep(action, 'apply', { status: 'failed', detail: error, finishedAt: now })
  action.steps = action.steps.map((s) =>
    s.status === 'pending' ? { ...s, status: 'skipped' } : s
  )
  action.status = 'failed'
  action.error = error
  action.events.push({ at: now, by: 'Vigil', type: 'failed' })
  raiseAlert({
    type: 'remediation_failed',
    title: `Fix failed: ${action.findingTitle}`,
    message: error,
    remediationId: action.id,
  })
}

/** The re-scan sees the fixed configuration and resolves the finding. */
function verify(action: RemediationAction) {
  const now = new Date().toISOString()
  const finding = mockFindings.find((f) => f.id === action.findingId)
  if (finding) {
    finding.status = 'resolved'
    finding.lastSeenAt = now
    finding.history.push({
      at: now,
      by: 'Vigil',
      type: 'resolved_by_scan',
      status: 'resolved',
      note: 'Fixed automatically and confirmed by a re-scan.',
    })
    recountFor(finding)
  }
  setStep(action, 'verify', { status: 'done', finishedAt: now })
  action.status = 'completed'
  action.verification = {
    status: 'passed',
    checkedAt: now,
    detail: 'The re-scan no longer finds the problem. The finding is resolved.',
  }
  action.events.push(
    { at: now, by: 'Vigil', type: 'completed' },
    { at: now, by: 'Vigil', type: 'verified' }
  )
  raiseAlert({
    type: 'finding_resolved',
    title: `Resolved: ${action.findingTitle}`,
    message: `Fixed automatically on ${action.resourceName}.`,
    findingId: action.findingId,
  })
}

/** What a fix would change, shown before anyone requests it. */
export function previewRemediation(findingId: string) {
  const plan = build(
    'preview',
    findingId,
    currentUser(),
    new Date().toISOString()
  )
  return {
    changes: plan.changes,
    apiCalls: plan.apiCalls,
    warnings: plan.warnings,
    reversible: plan.reversible,
  }
}
