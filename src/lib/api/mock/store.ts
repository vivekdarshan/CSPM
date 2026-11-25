/**
 * In-memory mock backend for account onboarding and scans. State lives
 * until the page reloads, which is enough to demo every flow.
 */
import {
  type Asset,
  type AwsOnboardingSetup,
  type CloudAccount,
  type ConnectAwsAccountInput,
  type ConnectAwsAccountResult,
  type ConnectionCheck,
  type ConnectionTestResult,
  type Finding,
  type ScanRun,
  type UpdateAccountInput,
  type UpdateFindingStatusInput,
  type Alert,
  type AlertRule,
  type ComplianceFramework,
  type NewChannelInput,
  type NotificationChannel,
} from '@/types/cspm'
import { useAuthStore } from '@/stores/auth-store'
import { accountIdFromRoleArn } from '@/lib/aws'
import { mockAlertSettings, mockAlerts } from './alerts'
import { assumeRoleFailedChecks, passingChecks } from './checks'
import {
  CIS_AWS_CONTROLS,
  CIS_AWS_FRAMEWORK,
  CIS_AWS_SECTIONS,
} from './cis-aws'
import { mockAccounts, mockAssets, mockFindings, mockScanRuns } from './data'

/** Example account ID from the AWS docs; a real backend returns its own. */
const MOCK_PRINCIPAL_ACCOUNT_ID = '111122223333'
const SCAN_DURATION_MS = 5000

const isOpen = (f: Finding) => f.status === 'open' || f.status === 'in_progress'

function randomHex(bytes: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')
}

function removeWhere<T>(list: T[], predicate: (item: T) => boolean) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (predicate(list[i])) list.splice(i, 1)
  }
}

function findAccount(id: string) {
  const account = mockAccounts.find((a) => a.id === id)
  if (!account) throw new Error('Account not found')
  return account
}

function recount(account: CloudAccount) {
  account.assetCount = mockAssets.filter(
    (a) => a.accountId === account.id
  ).length
  account.openFindingCount = mockFindings.filter(
    (f) => f.accountId === account.id && isOpen(f)
  ).length
}

export function getAccount(id: string): CloudAccount {
  return findAccount(id)
}

export function getOnboardingSetup(): AwsOnboardingSetup {
  return {
    principalAccountId: MOCK_PRINCIPAL_ACCOUNT_ID,
    trustExternalId: `vigil-${randomHex(12)}`,
    roleName: 'VigilSecurityAudit',
    templatePath: '/aws/vigil-read-only-role.yaml',
  }
}

function precheck(input: ConnectAwsAccountInput): ConnectionCheck | null {
  const existing = mockAccounts.find((a) => a.externalId === input.accountId)
  if (existing) {
    return {
      id: 'identity',
      label: 'Account not already connected',
      status: 'fail',
      detail: `AWS account ${input.accountId} is already connected as "${existing.name}".`,
    }
  }
  const roleAccount = accountIdFromRoleArn(input.roleArn)
  if (roleAccount !== input.accountId) {
    return {
      id: 'identity',
      label: 'Account matches',
      status: 'fail',
      detail: `The role belongs to account ${roleAccount ?? 'unknown'}, not ${input.accountId}.`,
    }
  }
  return null
}

export function connectAwsAccount(
  input: ConnectAwsAccountInput
): ConnectAwsAccountResult {
  const checkedAt = new Date().toISOString()
  const failure = precheck(input)
  if (failure) return { ok: false, checkedAt, checks: [failure] }

  const checks = passingChecks(input.accountId, input.roleArn, input.regions)
  const account: CloudAccount = {
    id: `acc-${randomHex(4)}`,
    provider: 'aws',
    name: input.name,
    externalId: input.accountId,
    environment: input.environment,
    regions: input.regions,
    status: 'connected',
    connectedAt: checkedAt,
    lastScanAt: null,
    assetCount: 0,
    openFindingCount: 0,
    connection: {
      roleArn: input.roleArn,
      trustExternalId: input.trustExternalId,
      lastCheckedAt: checkedAt,
      checks,
    },
  }
  mockAccounts.push(account)
  return { ok: true, checkedAt, checks, account }
}

/**
 * Shared Services keeps failing so the error state can be demoed; every
 * other account passes.
 */
export function testConnection(id: string): ConnectionTestResult {
  const account = findAccount(id)
  const roleArn =
    account.connection?.roleArn ??
    `arn:aws:iam::${account.externalId}:role/VigilSecurityAudit`
  const ok = account.id !== 'acc-shared'
  const checks = ok
    ? passingChecks(account.externalId, roleArn, account.regions)
    : assumeRoleFailedChecks(roleArn)
  const checkedAt = new Date().toISOString()

  if (!ok && account.status !== 'error') {
    raiseAlert({
      type: 'connection_failed',
      title: `Connection lost: ${account.name}`,
      message: checks[0].detail,
      accountId: account.id,
    })
  }
  account.status = ok ? 'connected' : 'error'
  account.statusMessage = ok ? undefined : checks[0].detail
  account.connection = {
    roleArn,
    trustExternalId: account.connection?.trustExternalId ?? '',
    lastCheckedAt: checkedAt,
    checks,
  }
  return { ok, checkedAt, checks }
}

export function updateAccount(
  id: string,
  input: UpdateAccountInput
): CloudAccount {
  const account = findAccount(id)
  Object.assign(account, input)
  return account
}

export function disconnectAccount(id: string) {
  findAccount(id)
  removeWhere(mockAccounts, (a) => a.id === id)
  removeWhere(mockAssets, (a) => a.accountId === id)
  removeWhere(mockFindings, (f) => f.accountId === id)
  removeWhere(mockScanRuns, (s) => s.accountId === id)
}

export function getScanRuns(accountId: string): ScanRun[] {
  return mockScanRuns
    .filter((s) => s.accountId === accountId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

/** A first scan of a new account discovers a few starter resources. */
function discoverStarterAssets(account: CloudAccount) {
  const slug = account.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const region = account.regions[0] ?? 'us-east-1'
  const seen = new Date().toISOString()
  const base = {
    accountId: account.id,
    provider: 'aws' as const,
    tags: { environment: account.environment },
    publiclyExposed: false,
    openFindingCount: 0,
    lastSeenAt: seen,
  }
  const assets: Asset[] = [
    {
      ...base,
      id: `${account.id}-s3`,
      category: 'storage',
      resourceType: 'AWS::S3::Bucket',
      name: `${slug}-logs`,
      resourceId: `arn:aws:s3:::${slug}-logs`,
      region,
      configuration: {
        kind: 's3_bucket',
        blockPublicAccess: true,
        publicPolicy: false,
        encryption: 'SSE-S3',
        versioning: true,
        accessLogging: true,
        sizeGb: 3,
      },
    },
    {
      ...base,
      id: `${account.id}-ec2`,
      category: 'compute',
      resourceType: 'AWS::EC2::Instance',
      name: `${slug}-app-01`,
      resourceId: `i-0${randomHex(8).slice(0, 16)}`,
      region,
      configuration: {
        kind: 'ec2_instance',
        instanceType: 't3.small',
        state: 'running',
        publicIp: null,
        privateIp: '10.0.1.10',
        vpcId: `vpc-0${randomHex(8).slice(0, 16)}`,
        securityGroupIds: [],
        iamRole: null,
        imdsV2Required: true,
        launchedAt: seen,
      },
    },
    {
      ...base,
      id: `${account.id}-iam`,
      category: 'identity',
      resourceType: 'AWS::IAM::Role',
      name: `${slug}-deploy`,
      resourceId: `arn:aws:iam::${account.externalId}:role/${slug}-deploy`,
      region: 'global',
      configuration: {
        kind: 'iam_role',
        trustedEntities: ['codebuild.amazonaws.com'],
        policies: [`${slug}-deploy`],
        lastUsedAt: null,
      },
    },
  ]
  mockAssets.push(...assets)
}

function finishScan(run: ScanRun) {
  const account = mockAccounts.find((a) => a.id === run.accountId)
  if (!account) return // disconnected mid-scan
  run.finishedAt = new Date().toISOString()
  if (account.status !== 'connected') {
    run.status = 'failed'
    run.error = account.statusMessage ?? 'Could not reach the account.'
    raiseAlert({
      type: 'scan_failed',
      title: `Scan failed: ${account.name}`,
      message: run.error,
      accountId: account.id,
    })
    return
  }
  if (account.lastScanAt === null && account.assetCount === 0) {
    discoverStarterAssets(account)
  }
  recount(account)
  run.status = 'succeeded'
  run.assetsScanned = account.assetCount
  run.findingsFound = account.openFindingCount
  account.lastScanAt = run.finishedAt
}

export function startAccountScan(
  accountId: string,
  trigger: ScanRun['trigger'] = 'manual'
): ScanRun {
  findAccount(accountId)
  const running = mockScanRuns.find(
    (s) => s.accountId === accountId && s.status === 'running'
  )
  if (running) return running

  const run: ScanRun = {
    id: `scan-${randomHex(6)}`,
    accountId,
    trigger,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    assetsScanned: null,
    findingsFound: null,
  }
  mockScanRuns.push(run)
  setTimeout(() => finishScan(run), SCAN_DURATION_MS)
  return run
}

export function startAllScans(): ScanRun[] {
  return mockAccounts
    .filter((a) => a.status === 'connected')
    .map((a) => startAccountScan(a.id))
}

/* ----- Findings (Phase 4) ----- */

export function getFinding(id: string): Finding {
  const finding = mockFindings.find((f) => f.id === id)
  if (!finding) throw new Error('Finding not found')
  return finding
}

/** Keep asset and account counts in step with finding status changes. */
function recountFor(finding: Finding) {
  const asset = mockAssets.find((a) => a.id === finding.assetId)
  if (asset) {
    asset.openFindingCount = mockFindings.filter(
      (f) => f.assetId === asset.id && isOpen(f)
    ).length
  }
  const account = mockAccounts.find((a) => a.id === finding.accountId)
  if (account) recount(account)
}

export function updateFindingStatus(
  id: string,
  input: UpdateFindingStatusInput
): Finding {
  const finding = getFinding(id)
  if (finding.status === 'resolved') {
    throw new Error(
      'Resolved findings reopen automatically if a scan sees them again.'
    )
  }
  finding.status = input.status
  finding.history.push({
    at: new Date().toISOString(),
    by: useAuthStore.getState().auth.user?.name ?? 'Unknown user',
    type: 'status_changed',
    status: input.status,
    reason: input.status === 'suppressed' ? input.reason : undefined,
    note: input.note?.trim() || undefined,
  })
  recountFor(finding)
  return finding
}

/* ----- Compliance (Phase 5) ----- */

/** Evaluate every CIS control against the current findings. */
export function getComplianceFramework(): ComplianceFramework {
  const byControl = new Map<string, Finding[]>()
  for (const f of mockFindings) {
    for (const ref of f.complianceRefs) {
      const id = ref.replace('CIS AWS ', '')
      byControl.set(id, [...(byControl.get(id) ?? []), f])
    }
  }
  const lastScan = mockAccounts
    .map((a) => a.lastScanAt)
    .filter((d): d is string => d !== null)
    .sort()
  return {
    ...CIS_AWS_FRAMEWORK,
    sections: CIS_AWS_SECTIONS,
    evaluatedAt: lastScan[lastScan.length - 1] ?? new Date().toISOString(),
    controls: CIS_AWS_CONTROLS.map((c) => {
      const related = byControl.get(c.controlId) ?? []
      const failing = related.filter(isOpen).map((f) => f.id)
      return {
        ...c,
        sectionId: c.controlId.split('.')[0],
        status:
          c.assessment === 'manual'
            ? 'manual'
            : failing.length > 0
              ? 'fail'
              : 'pass',
        failingFindingIds: failing,
        exceptionFindingIds: related
          .filter((f) => f.status === 'suppressed')
          .map((f) => f.id),
      }
    }),
  }
}

/* ----- Alerts (Phase 5) ----- */

function raiseAlert(
  input: Omit<Alert, 'id' | 'createdAt' | 'read' | 'severity'>
) {
  mockAlerts.unshift({
    ...input,
    id: `alt-${randomHex(6)}`,
    severity: null,
    createdAt: new Date().toISOString(),
    read: false,
  })
}

export function getAlerts(): Alert[] {
  return mockAlerts
}

export function markAlertsRead(ids: string[] | 'all') {
  for (const alert of mockAlerts) {
    if (ids === 'all' || ids.includes(alert.id)) alert.read = true
  }
}

export function getAlertSettings() {
  return mockAlertSettings
}

export function updateAlertRule(
  id: string,
  patch: Partial<Pick<AlertRule, 'enabled' | 'minSeverity' | 'channelIds'>>
): AlertRule {
  const rule = mockAlertSettings.rules.find((r) => r.id === id)
  if (!rule) throw new Error('Rule not found')
  Object.assign(rule, patch)
  return rule
}

export function addChannel(input: NewChannelInput): NotificationChannel {
  const channel: NotificationChannel = {
    ...input,
    id: `ch-${randomHex(4)}`,
    enabled: true,
    lastTestedAt: null,
  }
  mockAlertSettings.channels.push(channel)
  return channel
}

export function updateChannel(
  id: string,
  patch: Partial<Pick<NotificationChannel, 'enabled'>>
): NotificationChannel {
  const channel = mockAlertSettings.channels.find((c) => c.id === id)
  if (!channel) throw new Error('Channel not found')
  Object.assign(channel, patch)
  return channel
}

export function removeChannel(id: string) {
  removeWhere(mockAlertSettings.channels, (c) => c.id === id)
  for (const rule of mockAlertSettings.rules) {
    rule.channelIds = rule.channelIds.filter((c) => c !== id)
  }
}

/** Pretends to deliver a test message; always succeeds in demo mode. */
export function testChannel(id: string): NotificationChannel {
  const channel = mockAlertSettings.channels.find((c) => c.id === id)
  if (!channel) throw new Error('Channel not found')
  channel.lastTestedAt = new Date().toISOString()
  return channel
}
