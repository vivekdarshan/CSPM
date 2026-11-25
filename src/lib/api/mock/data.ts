/**
 * Realistic mock data used until the backend exists.
 * Timestamps are relative to page load so the UI always looks "live".
 */
import {
  type Asset,
  type CloudAccount,
  type Finding,
  type FindingsTrendPoint,
  type ScanRun,
} from '@/types/cspm'
import { assumeRoleFailedChecks, passingChecks } from './checks'

const now = Date.now()
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const hoursAgo = (h: number) => new Date(now - h * HOUR).toISOString()
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString()

export const mockAccounts: CloudAccount[] = [
  {
    id: 'acc-prod',
    provider: 'aws',
    name: 'Production',
    externalId: '418273650912',
    environment: 'production',
    regions: ['eu-west-2', 'eu-west-1'],
    status: 'connected',
    connectedAt: daysAgo(64),
    lastScanAt: hoursAgo(2),
    assetCount: 0,
    openFindingCount: 0,
    connection: {
      roleArn: 'arn:aws:iam::418273650912:role/VigilSecurityAudit',
      trustExternalId: 'vigil-7f3a9c2e41d8',
      lastCheckedAt: hoursAgo(2),
      checks: passingChecks(
        '418273650912',
        'arn:aws:iam::418273650912:role/VigilSecurityAudit',
        ['eu-west-2', 'eu-west-1']
      ),
    },
  },
  {
    id: 'acc-staging',
    provider: 'aws',
    name: 'Staging',
    externalId: '730591284466',
    environment: 'staging',
    regions: ['eu-west-2'],
    status: 'connected',
    connectedAt: daysAgo(41),
    lastScanAt: hoursAgo(3),
    assetCount: 0,
    openFindingCount: 0,
    connection: {
      roleArn: 'arn:aws:iam::730591284466:role/VigilSecurityAudit',
      trustExternalId: 'vigil-b81e04d7c95a',
      lastCheckedAt: hoursAgo(3),
      checks: passingChecks(
        '730591284466',
        'arn:aws:iam::730591284466:role/VigilSecurityAudit',
        ['eu-west-2']
      ),
    },
  },
  {
    id: 'acc-shared',
    provider: 'aws',
    name: 'Shared Services',
    externalId: '295108437720',
    environment: 'shared',
    regions: ['us-east-1'],
    status: 'error',
    statusMessage:
      'AssumeRole failed: the trust policy on VigilSecurityAudit does not allow this external ID.',
    connectedAt: daysAgo(12),
    lastScanAt: daysAgo(4),
    assetCount: 0,
    openFindingCount: 0,
    connection: {
      roleArn: 'arn:aws:iam::295108437720:role/VigilSecurityAudit',
      trustExternalId: 'vigil-2c6d58fa0b17',
      lastCheckedAt: hoursAgo(6),
      checks: assumeRoleFailedChecks(
        'arn:aws:iam::295108437720:role/VigilSecurityAudit'
      ),
    },
  },
]

type AssetSeed = Omit<Asset, 'openFindingCount' | 'provider' | 'lastSeenAt'>

const assetSeeds: AssetSeed[] = [
  // Production
  {
    id: 'ast-001',
    accountId: 'acc-prod',
    category: 'storage',
    resourceType: 'AWS::S3::Bucket',
    name: 'acme-customer-uploads',
    region: 'eu-west-2',
    tags: { team: 'web', data: 'customer' },
    publiclyExposed: true,
  },
  {
    id: 'ast-002',
    accountId: 'acc-prod',
    category: 'storage',
    resourceType: 'AWS::S3::Bucket',
    name: 'acme-app-logs',
    region: 'eu-west-2',
    tags: { team: 'platform' },
    publiclyExposed: false,
  },
  {
    id: 'ast-003',
    accountId: 'acc-prod',
    category: 'storage',
    resourceType: 'AWS::S3::Bucket',
    name: 'acme-static-site',
    region: 'eu-west-2',
    tags: { team: 'web' },
    publiclyExposed: true,
  },
  {
    id: 'ast-004',
    accountId: 'acc-prod',
    category: 'compute',
    resourceType: 'AWS::EC2::Instance',
    name: 'web-01 (i-0a83f2c91d4e7b210)',
    region: 'eu-west-2',
    tags: { role: 'web' },
    publiclyExposed: true,
  },
  {
    id: 'ast-005',
    accountId: 'acc-prod',
    category: 'compute',
    resourceType: 'AWS::EC2::Instance',
    name: 'web-02 (i-07c1d9e4a2f63b851)',
    region: 'eu-west-2',
    tags: { role: 'web' },
    publiclyExposed: true,
  },
  {
    id: 'ast-006',
    accountId: 'acc-prod',
    category: 'compute',
    resourceType: 'AWS::EC2::Instance',
    name: 'worker-01 (i-0f4b72e18c9d05a63)',
    region: 'eu-west-2',
    tags: { role: 'worker' },
    publiclyExposed: false,
  },
  {
    id: 'ast-007',
    accountId: 'acc-prod',
    category: 'database',
    resourceType: 'AWS::RDS::DBInstance',
    name: 'orders-db',
    region: 'eu-west-2',
    tags: { data: 'customer' },
    publiclyExposed: true,
  },
  {
    id: 'ast-008',
    accountId: 'acc-prod',
    category: 'database',
    resourceType: 'AWS::RDS::DBInstance',
    name: 'analytics-db',
    region: 'eu-west-1',
    tags: { team: 'data' },
    publiclyExposed: false,
  },
  {
    id: 'ast-009',
    accountId: 'acc-prod',
    category: 'network',
    resourceType: 'AWS::EC2::SecurityGroup',
    name: 'sg-web-public (sg-0c2e8a41f9b7d3a15)',
    region: 'eu-west-2',
    tags: {},
    publiclyExposed: true,
  },
  {
    id: 'ast-010',
    accountId: 'acc-prod',
    category: 'network',
    resourceType: 'AWS::EC2::SecurityGroup',
    name: 'sg-db (sg-03b9f6d27e1a8c4d0)',
    region: 'eu-west-2',
    tags: {},
    publiclyExposed: false,
  },
  {
    id: 'ast-011',
    accountId: 'acc-prod',
    category: 'identity',
    resourceType: 'AWS::IAM::User',
    name: 'root',
    region: 'global',
    tags: {},
    publiclyExposed: false,
  },
  {
    id: 'ast-012',
    accountId: 'acc-prod',
    category: 'identity',
    resourceType: 'AWS::IAM::User',
    name: 'ci-deploy',
    region: 'global',
    tags: { purpose: 'ci' },
    publiclyExposed: false,
  },
  {
    id: 'ast-013',
    accountId: 'acc-prod',
    category: 'identity',
    resourceType: 'AWS::IAM::Role',
    name: 'LegacyAdminRole',
    region: 'global',
    tags: {},
    publiclyExposed: false,
  },
  {
    id: 'ast-014',
    accountId: 'acc-prod',
    category: 'network',
    resourceType: 'AWS::EC2::VPC',
    name: 'vpc-main (vpc-0e71c3a9b5d2f8406)',
    region: 'eu-west-2',
    tags: {},
    publiclyExposed: false,
  },
  {
    id: 'ast-015',
    accountId: 'acc-prod',
    category: 'identity',
    resourceType: 'AWS::IAM::AccountPasswordPolicy',
    name: 'Account password policy',
    region: 'global',
    tags: {},
    publiclyExposed: false,
  },
  // Staging
  {
    id: 'ast-101',
    accountId: 'acc-staging',
    category: 'compute',
    resourceType: 'AWS::EC2::Instance',
    name: 'staging-app (i-0b5e1a7c3d9f24806)',
    region: 'eu-west-2',
    tags: { env: 'staging' },
    publiclyExposed: true,
  },
  {
    id: 'ast-102',
    accountId: 'acc-staging',
    category: 'network',
    resourceType: 'AWS::EC2::SecurityGroup',
    name: 'sg-staging-ssh (sg-0a4d7e2b9c61f3058)',
    region: 'eu-west-2',
    tags: {},
    publiclyExposed: true,
  },
  {
    id: 'ast-103',
    accountId: 'acc-staging',
    category: 'storage',
    resourceType: 'AWS::S3::Bucket',
    name: 'acme-staging-backups',
    region: 'eu-west-2',
    tags: {},
    publiclyExposed: false,
  },
  {
    id: 'ast-104',
    accountId: 'acc-staging',
    category: 'database',
    resourceType: 'AWS::RDS::DBInstance',
    name: 'staging-db',
    region: 'eu-west-2',
    tags: {},
    publiclyExposed: false,
  },
  {
    id: 'ast-105',
    accountId: 'acc-staging',
    category: 'storage',
    resourceType: 'AWS::EC2::Volume',
    name: 'vol-0d93a1f7e25c4b680',
    region: 'eu-west-2',
    tags: {},
    publiclyExposed: false,
  },
  // Shared services
  {
    id: 'ast-201',
    accountId: 'acc-shared',
    category: 'storage',
    resourceType: 'AWS::S3::Bucket',
    name: 'acme-terraform-state',
    region: 'us-east-1',
    tags: { team: 'platform' },
    publiclyExposed: false,
  },
  {
    id: 'ast-202',
    accountId: 'acc-shared',
    category: 'identity',
    resourceType: 'AWS::IAM::User',
    name: 'backup-agent',
    region: 'global',
    tags: {},
    publiclyExposed: false,
  },
]

type FindingSeed = Omit<
  Finding,
  'provider' | 'resourceName' | 'resourceType' | 'region' | 'accountId'
>

const findingSeeds: FindingSeed[] = [
  {
    id: 'fnd-001',
    ruleId: 'aws-s3-public-read',
    title: 'S3 bucket allows public read access',
    description:
      'The bucket policy grants s3:GetObject to "*", so anyone on the internet can download objects, including customer uploads.',
    severity: 'critical',
    status: 'open',
    category: 'exposure',
    assetId: 'ast-001',
    complianceRefs: ['CIS AWS 2.1.4'],
    firstSeenAt: daysAgo(9),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary:
        'Enable S3 Block Public Access and remove the public statement from the bucket policy.',
      steps: [
        'Open the bucket in the S3 console and choose Permissions.',
        'Turn on all four Block Public Access settings.',
        'Edit the bucket policy and delete any statement with "Principal": "*".',
        'If files must be shared, use pre-signed URLs or CloudFront with origin access control.',
      ],
      automatable: true,
    },
  },
  {
    id: 'fnd-002',
    ruleId: 'aws-iam-root-mfa',
    title: 'Root account does not have MFA enabled',
    description:
      'The root user has unrestricted access to every resource and billing. Without MFA, a leaked password gives an attacker full control of the account.',
    severity: 'critical',
    status: 'open',
    category: 'identity',
    assetId: 'ast-011',
    complianceRefs: ['CIS AWS 1.5'],
    firstSeenAt: daysAgo(64),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary: 'Sign in as root and register a hardware or virtual MFA device.',
      steps: [
        'Sign in to the AWS console as the root user.',
        'Open Security credentials from the account menu.',
        'Under Multi-factor authentication, choose Assign MFA device.',
        'Store the root credentials somewhere safe and stop using root for daily work.',
      ],
      automatable: false,
    },
  },
  {
    id: 'fnd-003',
    ruleId: 'aws-rds-public',
    title: 'RDS database is publicly accessible',
    description:
      'orders-db has PubliclyAccessible set to true and a public IP, so it can be reached from the internet if its security group allows it.',
    severity: 'critical',
    status: 'in_progress',
    category: 'exposure',
    assetId: 'ast-007',
    complianceRefs: ['CIS AWS 2.3.3'],
    firstSeenAt: daysAgo(21),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary:
        'Turn off public accessibility and connect through a private subnet or bastion.',
      steps: [
        'Modify the DB instance and set Public access to No.',
        'Make sure the DB subnet group only uses private subnets.',
        'Apply the change during the next maintenance window.',
      ],
      automatable: true,
    },
  },
  {
    id: 'fnd-004',
    ruleId: 'aws-sg-ssh-open',
    title: 'Security group allows SSH (22) from 0.0.0.0/0',
    description:
      'Anyone on the internet can attempt to log in to instances in this group over SSH. Exposed SSH ports are scanned constantly.',
    severity: 'high',
    status: 'open',
    category: 'exposure',
    assetId: 'ast-102',
    complianceRefs: ['CIS AWS 5.2'],
    firstSeenAt: daysAgo(15),
    lastSeenAt: hoursAgo(3),
    remediation: {
      summary:
        'Restrict port 22 to your office IP range, or replace SSH with Session Manager.',
      steps: [
        'Edit the inbound rules of the security group.',
        'Change the source for port 22 from 0.0.0.0/0 to a known CIDR.',
        'Better: remove the rule and use AWS Systems Manager Session Manager.',
      ],
      automatable: true,
    },
  },
  {
    id: 'fnd-005',
    ruleId: 'aws-sg-rdp-open',
    title: 'Security group allows all traffic from the internet',
    description:
      'sg-web-public has an inbound rule allowing all ports and protocols from 0.0.0.0/0, not just HTTP and HTTPS.',
    severity: 'high',
    status: 'open',
    category: 'exposure',
    assetId: 'ast-009',
    complianceRefs: ['CIS AWS 5.2', 'CIS AWS 5.3'],
    firstSeenAt: daysAgo(6),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary:
        'Replace the all-traffic rule with rules for ports 80 and 443 only.',
      steps: [
        'Edit the inbound rules of sg-web-public.',
        'Delete the "All traffic" rule.',
        'Add separate rules for TCP 80 and TCP 443.',
      ],
      automatable: true,
    },
  },
  {
    id: 'fnd-006',
    ruleId: 'aws-iam-admin-policy',
    title: 'IAM role has full administrator access ("*:*")',
    description:
      'LegacyAdminRole has an inline policy allowing every action on every resource. It has not been used in 97 days.',
    severity: 'high',
    status: 'open',
    category: 'identity',
    assetId: 'ast-013',
    complianceRefs: ['CIS AWS 1.16'],
    firstSeenAt: daysAgo(64),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary:
        'Delete the unused role, or replace the policy with least-privilege permissions.',
      steps: [
        'Check CloudTrail to confirm nothing still assumes the role.',
        'Delete the role if it is unused.',
        'Otherwise, replace the inline policy with a scoped managed policy.',
      ],
      automatable: false,
    },
  },
  {
    id: 'fnd-007',
    ruleId: 'aws-iam-key-rotation',
    title: 'IAM access key not rotated in 90+ days',
    description:
      'The access key for ci-deploy is 212 days old. Long-lived keys are a common source of leaks through old laptops, logs and repositories.',
    severity: 'high',
    status: 'open',
    category: 'identity',
    assetId: 'ast-012',
    complianceRefs: ['CIS AWS 1.14'],
    firstSeenAt: daysAgo(30),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary:
        'Rotate the key, or move CI to OIDC federation so no static keys are needed.',
      steps: [
        'Create a second access key for ci-deploy.',
        'Update your CI secrets to use the new key.',
        'Deactivate, then delete the old key.',
        'Consider GitHub/GitLab OIDC to remove static keys entirely.',
      ],
      automatable: false,
    },
  },
  {
    id: 'fnd-008',
    ruleId: 'aws-rds-encryption',
    title: 'RDS storage is not encrypted at rest',
    description:
      'analytics-db was created without storage encryption. Snapshots and backups are also unencrypted.',
    severity: 'medium',
    status: 'open',
    category: 'encryption',
    assetId: 'ast-008',
    complianceRefs: ['CIS AWS 2.3.1'],
    firstSeenAt: daysAgo(64),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary: 'Restore from an encrypted snapshot copy, then switch over.',
      steps: [
        'Take a snapshot of analytics-db.',
        'Copy the snapshot with encryption enabled.',
        'Restore a new instance from the encrypted copy and repoint applications.',
      ],
      automatable: false,
    },
  },
  {
    id: 'fnd-009',
    ruleId: 'aws-ec2-imdsv1',
    title: 'EC2 instance allows IMDSv1',
    description:
      'IMDSv1 can be abused through SSRF bugs to steal the instance role credentials. IMDSv2 requires a session token and blocks this.',
    severity: 'medium',
    status: 'open',
    category: 'misconfiguration',
    assetId: 'ast-004',
    complianceRefs: ['CIS AWS 5.6'],
    firstSeenAt: daysAgo(18),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary: 'Require IMDSv2 on the instance.',
      steps: [
        'Run: aws ec2 modify-instance-metadata-options --instance-id <id> --http-tokens required',
        'Test the application still reads instance metadata correctly.',
      ],
      automatable: true,
    },
  },
  {
    id: 'fnd-010',
    ruleId: 'aws-vpc-flow-logs',
    title: 'VPC flow logs are disabled',
    description:
      'Without flow logs you cannot investigate suspicious network traffic after an incident.',
    severity: 'medium',
    status: 'open',
    category: 'logging',
    assetId: 'ast-014',
    complianceRefs: ['CIS AWS 3.9'],
    firstSeenAt: daysAgo(64),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary:
        'Enable flow logs for the VPC and send them to CloudWatch Logs or S3.',
      steps: [
        'Open the VPC console and select vpc-main.',
        'Choose Actions, Create flow log.',
        'Capture rejected traffic at minimum and send it to a log group with a retention policy.',
      ],
      automatable: true,
    },
  },
  {
    id: 'fnd-011',
    ruleId: 'aws-iam-password-policy',
    title: 'Password policy does not require 14+ characters',
    description:
      'The account password policy allows 8-character passwords and does not prevent reuse.',
    severity: 'medium',
    status: 'open',
    category: 'identity',
    assetId: 'ast-015',
    complianceRefs: ['CIS AWS 1.8', 'CIS AWS 1.9'],
    firstSeenAt: daysAgo(64),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary:
        'Set a minimum length of 14 and prevent reuse of the last 24 passwords.',
      steps: [
        'Open IAM, Account settings, Password policy.',
        'Set minimum length to 14 and enable password reuse prevention (24).',
      ],
      automatable: true,
    },
  },
  {
    id: 'fnd-012',
    ruleId: 'aws-ebs-encryption',
    title: 'EBS volume is not encrypted',
    description:
      'vol-0d93a1f7e25c4b680 stores data unencrypted. EBS default encryption is also off in this region.',
    severity: 'medium',
    status: 'open',
    category: 'encryption',
    assetId: 'ast-105',
    complianceRefs: ['CIS AWS 2.2.1'],
    firstSeenAt: daysAgo(11),
    lastSeenAt: hoursAgo(3),
    remediation: {
      summary:
        'Turn on EBS default encryption and migrate the volume to an encrypted copy.',
      steps: [
        'In EC2 settings, enable "Always encrypt new EBS volumes".',
        'Snapshot the volume, copy it with encryption, and replace the volume.',
      ],
      automatable: false,
    },
  },
  {
    id: 'fnd-013',
    ruleId: 'aws-s3-versioning',
    title: 'S3 bucket versioning is disabled',
    description:
      'Deleted or overwritten backups cannot be recovered, which also weakens protection against ransomware.',
    severity: 'low',
    status: 'open',
    category: 'misconfiguration',
    assetId: 'ast-103',
    complianceRefs: [],
    firstSeenAt: daysAgo(41),
    lastSeenAt: hoursAgo(3),
    remediation: {
      summary:
        'Enable versioning and add a lifecycle rule to expire old versions.',
      steps: [
        'Open the bucket Properties tab and enable Bucket Versioning.',
        'Add a lifecycle rule to expire noncurrent versions after 30-90 days.',
      ],
      automatable: true,
    },
  },
  {
    id: 'fnd-014',
    ruleId: 'aws-s3-access-logging',
    title: 'S3 server access logging is disabled',
    description:
      'Requests to this bucket are not logged, so access to the public website cannot be audited.',
    severity: 'low',
    status: 'open',
    category: 'logging',
    assetId: 'ast-003',
    complianceRefs: ['CIS AWS 3.6'],
    firstSeenAt: daysAgo(30),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary: 'Enable server access logging to a separate log bucket.',
      steps: [
        'Open the bucket Properties tab.',
        'Edit Server access logging and choose acme-app-logs as the target.',
      ],
      automatable: true,
    },
  },
  {
    id: 'fnd-015',
    ruleId: 'aws-ec2-public-ip',
    title: 'Staging instance has a public IP address',
    description:
      'Non-production instances rarely need to be directly reachable from the internet.',
    severity: 'low',
    status: 'open',
    category: 'exposure',
    assetId: 'ast-101',
    complianceRefs: [],
    firstSeenAt: daysAgo(8),
    lastSeenAt: hoursAgo(3),
    remediation: {
      summary: 'Move the instance to a private subnet behind a load balancer.',
      steps: [
        'Launch a replacement in a private subnet, or remove the Elastic IP.',
        'Use a load balancer or Session Manager for access.',
      ],
      automatable: false,
    },
  },
  {
    id: 'fnd-016',
    ruleId: 'aws-s3-public-read',
    title: 'S3 bucket allows public read access',
    description:
      'acme-static-site is public. This is expected for a static website, so the finding has been suppressed.',
    severity: 'informational',
    status: 'suppressed',
    category: 'exposure',
    assetId: 'ast-003',
    complianceRefs: ['CIS AWS 2.1.4'],
    firstSeenAt: daysAgo(30),
    lastSeenAt: hoursAgo(2),
    remediation: {
      summary:
        'No action needed if the bucket only hosts public website files.',
      steps: [],
      automatable: false,
    },
  },
  {
    id: 'fnd-017',
    ruleId: 'aws-cloudtrail-enabled',
    title: 'CloudTrail is not enabled in all regions',
    description: 'API activity in regions outside eu-west-2 is not recorded.',
    severity: 'high',
    status: 'resolved',
    category: 'logging',
    assetId: 'ast-014',
    complianceRefs: ['CIS AWS 3.1'],
    firstSeenAt: daysAgo(64),
    lastSeenAt: daysAgo(5),
    remediation: {
      summary: 'Create a multi-region trail.',
      steps: ['Create a trail with "Apply trail to all regions" enabled.'],
      automatable: true,
    },
  },
]

const assetIndex = new Map(assetSeeds.map((a) => [a.id, a]))

export const mockFindings: Finding[] = findingSeeds.map((f) => {
  const asset = assetIndex.get(f.assetId)!
  return {
    ...f,
    provider: 'aws',
    accountId: asset.accountId,
    resourceName: asset.name,
    resourceType: asset.resourceType,
    region: asset.region,
  }
})

const isOpen = (f: Finding) => f.status === 'open' || f.status === 'in_progress'

export const mockAssets: Asset[] = assetSeeds.map((a) => ({
  ...a,
  provider: 'aws',
  lastSeenAt: a.accountId === 'acc-shared' ? daysAgo(4) : hoursAgo(2),
  openFindingCount: mockFindings.filter((f) => f.assetId === a.id && isOpen(f))
    .length,
}))

for (const account of mockAccounts) {
  account.assetCount = mockAssets.filter(
    (a) => a.accountId === account.id
  ).length
  account.openFindingCount = mockFindings.filter(
    (f) => f.accountId === account.id && isOpen(f)
  ).length
}

/**
 * 30 days of open-finding counts. Deterministic (no randomness) so charts
 * don't jump between reloads; trends down as issues get fixed.
 */
export const mockFindingsTrend: FindingsTrendPoint[] = Array.from(
  { length: 30 },
  (_, i) => {
    const day = 29 - i
    const date = new Date(now - day * DAY).toISOString().slice(0, 10)
    const wobble = (seed: number) => Math.round(Math.sin(i * 0.45 + seed) * 0.7)
    return {
      date,
      critical:
        Math.max(3, 5 - Math.floor(i / 12)) +
        (i > 20 ? -1 : 0) +
        (day === 9 ? 1 : 0),
      high: Math.max(4, 8 - Math.floor(i / 7)) + wobble(1),
      medium: Math.max(5, 9 - Math.floor(i / 8)) + wobble(2),
      low: 4 + wobble(3),
    }
  }
)

/**
 * Scan history: one scheduled scan a day per account. Shared Services has
 * been failing since its role's trust policy changed.
 */
export const mockScanRuns: ScanRun[] = mockAccounts.flatMap((account) =>
  Array.from({ length: 7 }, (_, day): ScanRun => {
    // Shared Services: four failed runs, then successes from 4 days ago
    const failing = account.status === 'error' && day < 4
    const hoursBack =
      account.status === 'error'
        ? failing
          ? 6 + day * 24
          : 96 + (day - 4) * 24
        : (account.id === 'acc-prod' ? 2 : 3) + day * 24
    const finished = new Date(now - hoursBack * HOUR)
    return {
      id: `scan-${account.id}-${day}`,
      accountId: account.id,
      trigger: 'scheduled',
      status: failing ? 'failed' : 'succeeded',
      startedAt: new Date(finished.getTime() - 4 * 60 * 1000).toISOString(),
      finishedAt: finished.toISOString(),
      assetsScanned: failing ? null : account.assetCount,
      findingsFound: failing
        ? null
        : account.openFindingCount + Math.floor(day / 2),
      error: failing ? account.statusMessage : undefined,
    }
  })
)
