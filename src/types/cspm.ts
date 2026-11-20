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

export interface CloudAccount {
  id: string
  provider: CloudProvider
  name: string
  /** AWS account ID, Azure subscription ID or GCP project ID */
  externalId: string
  environment: 'production' | 'staging' | 'development' | 'shared'
  regions: string[]
  status: ConnectionStatus
  statusMessage?: string
  connectedAt: string
  lastScanAt: string | null
  assetCount: number
  openFindingCount: number
}

export interface Asset {
  id: string
  accountId: string
  provider: CloudProvider
  category: AssetCategory
  /** Provider-native type, e.g. "AWS::S3::Bucket" */
  resourceType: string
  name: string
  region: string
  tags: Record<string, string>
  publiclyExposed: boolean
  openFindingCount: number
  lastSeenAt: string
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
