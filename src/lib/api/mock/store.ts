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
} from '@/types/cspm'
import { accountIdFromRoleArn } from '@/lib/aws'
import { assumeRoleFailedChecks, passingChecks } from './checks'
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
