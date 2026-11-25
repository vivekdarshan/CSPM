/**
 * Core domain types for the CSPM platform.
 *
 * Every cloud-scoped entity carries a `provider` so AWS, Azure and GCP can
 * share the same screens. Phase 1-3 only populate AWS data.
 */

export type CloudProvider = 'aws' | 'azure' | 'gcp'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational'

export type ConnectionStatus =
  | 'connected'
  | 'pending'
  | 'error'
  | 'disconnected'

export type FindingStatus = 'open' | 'in_progress' | 'resolved' | 'suppressed'

export type FindingCategory =
  | 'misconfiguration'
  | 'exposure'
  | 'identity'
  | 'encryption'
  | 'logging'

export type AssetCategory =
  | 'compute'
  | 'storage'
  | 'database'
  | 'identity'
  | 'network'

export type AccountEnvironment =
  | 'production'
  | 'staging'
  | 'development'
  | 'shared'

export type ConnectionCheckStatus = 'pass' | 'fail' | 'warn' | 'skipped'

/** One step of a connection test, e.g. "Assume IAM role". */
export interface ConnectionCheck {
  id: string
  label: string
  status: ConnectionCheckStatus
  detail: string
}

/** How the platform reaches an AWS account: a cross-account read-only role. */
export interface AwsConnection {
  roleArn: string
  /** Secret shared with the role's trust policy (confused-deputy protection) */
  trustExternalId: string
  lastCheckedAt: string
  checks: ConnectionCheck[]
}

export interface CloudAccount {
  id: string
  provider: CloudProvider
  name: string
  /** AWS account ID, Azure subscription ID or GCP project ID */
  externalId: string
  environment: AccountEnvironment
  regions: string[]
  status: ConnectionStatus
  statusMessage?: string
  connectedAt: string
  /** Last successful scan */
  lastScanAt: string | null
  assetCount: number
  openFindingCount: number
  connection?: AwsConnection
}

/** Values the platform issues for a new AWS connection. */
export interface AwsOnboardingSetup {
  /** AWS account the platform scans from (trusted principal) */
  principalAccountId: string
  trustExternalId: string
  roleName: string
  /** Downloadable CloudFormation template that creates the role */
  templatePath: string
}

export interface ConnectAwsAccountInput {
  name: string
  accountId: string
  environment: AccountEnvironment
  regions: string[]
  roleArn: string
  trustExternalId: string
}

export interface ConnectionTestResult {
  ok: boolean
  checkedAt: string
  checks: ConnectionCheck[]
}

export interface ConnectAwsAccountResult extends ConnectionTestResult {
  /** Set only when the test passed and the account was saved */
  account?: CloudAccount
}

export type UpdateAccountInput = Pick<
  CloudAccount,
  'name' | 'environment' | 'regions'
>

export type ScanStatus = 'running' | 'succeeded' | 'failed'

export interface ScanRun {
  id: string
  accountId: string
  trigger: 'scheduled' | 'manual'
  status: ScanStatus
  startedAt: string
  finishedAt: string | null
  assetsScanned: number | null
  findingsFound: number | null
  error?: string
}

export interface SecurityGroupRule {
  protocol: 'tcp' | 'udp' | 'icmp' | 'all'
  /** "22", "443", "0-65535" or "All" */
  ports: string
  /** CIDR or security group ID */
  source: string
  description?: string
}

export interface IamAccessKey {
  id: string
  active: boolean
  createdAt: string
  lastUsedAt: string | null
}

/** Security-relevant settings, shaped per resource type. */
export type AssetConfiguration =
  | {
      kind: 'ec2_instance'
      instanceType: string
      state: 'running' | 'stopped'
      publicIp: string | null
      privateIp: string
      vpcId: string
      securityGroupIds: string[]
      iamRole: string | null
      imdsV2Required: boolean
      launchedAt: string
    }
  | {
      kind: 's3_bucket'
      blockPublicAccess: boolean
      publicPolicy: boolean
      encryption: 'SSE-S3' | 'SSE-KMS' | 'none'
      versioning: boolean
      accessLogging: boolean
      sizeGb: number
    }
  | {
      kind: 'rds_instance'
      engine: string
      instanceClass: string
      publiclyAccessible: boolean
      storageEncrypted: boolean
      multiAz: boolean
      backupRetentionDays: number
      deletionProtection: boolean
    }
  | {
      kind: 'iam_user'
      consoleAccess: boolean
      mfaEnabled: boolean
      accessKeys: IamAccessKey[]
      lastActivityAt: string | null
      policies: string[]
    }
  | {
      kind: 'iam_role'
      trustedEntities: string[]
      policies: string[]
      lastUsedAt: string | null
    }
  | {
      kind: 'security_group'
      vpcId: string
      description: string
      inboundRules: SecurityGroupRule[]
      attachedResources: number
    }
  | {
      kind: 'vpc'
      cidrBlock: string
      flowLogsEnabled: boolean
      isDefault: boolean
    }
  | {
      kind: 'ebs_volume'
      sizeGb: number
      volumeType: string
      encrypted: boolean
      attachedTo: string | null
    }
  | {
      kind: 'password_policy'
      minimumLength: number
      requireSymbols: boolean
      requireNumbers: boolean
      requireUppercase: boolean
      maxAgeDays: number | null
      reusePrevention: number | null
    }

export interface Asset {
  id: string
  accountId: string
  provider: CloudProvider
  category: AssetCategory
  /** Provider-native type, e.g. "AWS::S3::Bucket" */
  resourceType: string
  name: string
  /** Provider identifier, e.g. an instance ID or ARN */
  resourceId: string
  region: string
  tags: Record<string, string>
  publiclyExposed: boolean
  openFindingCount: number
  lastSeenAt: string
  configuration: AssetConfiguration
}

export interface Remediation {
  summary: string
  steps: string[]
  /** Whether Phase 6 can apply this fix automatically */
  automatable: boolean
}

export interface Finding {
  id: string
  ruleId: string
  title: string
  description: string
  severity: Severity
  status: FindingStatus
  category: FindingCategory
  provider: CloudProvider
  accountId: string
  assetId: string
  resourceName: string
  resourceType: string
  region: string
  /** e.g. "CIS AWS 2.1.1" */
  complianceRefs: string[]
  firstSeenAt: string
  lastSeenAt: string
  remediation: Remediation
}

export type SeverityCounts = Record<Severity, number>

export interface PostureSummary {
  /** 0-100, higher is better */
  score: number
  /** Change in score over the last 30 days */
  scoreDelta: number
  openFindings: SeverityCounts
  totalAssets: number
  exposedAssets: number
  connectedAccounts: number
  totalAccounts: number
  lastScanAt: string | null
}

export interface FindingsTrendPoint {
  /** ISO date (yyyy-mm-dd) */
  date: string
  critical: number
  high: number
  medium: number
  low: number
}

/* ----- Shapes reserved for later phases ----- */

export interface ComplianceControl {
  id: string
  framework: 'CIS AWS Foundations' | 'CIS Azure' | 'CIS GCP'
  controlId: string
  title: string
  status: 'pass' | 'fail' | 'not_applicable'
  failingFindingIds: string[]
}

export type RemediationStatus =
  | 'pending_approval'
  | 'approved'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'rejected'

export interface RemediationAction {
  id: string
  findingId: string
  requestedBy: string
  approvedBy?: string
  status: RemediationStatus
  createdAt: string
  updatedAt: string
  verified?: boolean
}
