/**
 * Automatic fixes, one per rule. Each playbook describes the change before
 * it is approved and, in the mock backend, applies it to the asset.
 * A real backend would run the same API calls with the remediation role.
 */
import {
  type Asset,
  type AssetConfiguration,
  type RemediationChange,
  type SecurityGroupRule,
} from '@/types/cspm'

export type Playbook = {
  apiCalls: string[]
  warnings: string[]
  reversible: boolean
  /** Shown when the change can't be undone */
  irreversibleReason?: string
  changes: (asset: Asset) => RemediationChange[]
  /** Returns the fixed configuration */
  apply: (config: AssetConfiguration) => AssetConfiguration
  /** Demo: make this playbook fail with a realistic error */
  failWith?: string
}

const OPEN = ['0.0.0.0/0', '::/0']
const ruleLabel = (r: SecurityGroupRule) =>
  `${r.protocol === 'all' ? 'All traffic' : `${r.protocol.toUpperCase()} ${r.ports}`} from ${r.source}`

export const PLAYBOOKS: Record<string, Playbook> = {
  'aws-s3-public-read': {
    apiCalls: ['s3:PutPublicAccessBlock', 's3:PutBucketPolicy'],
    warnings: [
      'Anyone downloading files through public URLs will get "Access Denied". Share files with pre-signed URLs or CloudFront instead.',
    ],
    reversible: true,
    changes: () => [
      {
        setting: 'Block public access',
        before: 'Off',
        after: 'On (all four settings)',
      },
      {
        setting: 'Bucket policy',
        before: 'Allows s3:GetObject for "*"',
        after: 'Public statement removed',
      },
    ],
    apply: (c) =>
      c.kind === 's3_bucket'
        ? { ...c, blockPublicAccess: true, publicPolicy: false }
        : c,
  },
  'aws-rds-public': {
    apiCalls: ['rds:ModifyDBInstance'],
    warnings: [
      'Connections from outside the VPC (for example a laptop or an external BI tool) will stop working.',
      'The change is applied immediately and may drop open connections for a few seconds.',
    ],
    reversible: true,
    changes: () => [
      { setting: 'Publicly accessible', before: 'Yes', after: 'No' },
    ],
    apply: (c) =>
      c.kind === 'rds_instance' ? { ...c, publiclyAccessible: false } : c,
  },
  'aws-sg-ssh-open': {
    apiCalls: ['ec2:RevokeSecurityGroupIngress'],
    warnings: [
      'SSH from the internet stops working. Use Systems Manager Session Manager or a VPN to reach these servers.',
    ],
    reversible: true,
    changes: (asset) =>
      asset.configuration.kind === 'security_group'
        ? asset.configuration.inboundRules
            .filter((r) => r.ports === '22' && OPEN.includes(r.source))
            .map((r) => ({
              setting: 'Inbound rule',
              before: ruleLabel(r),
              after: 'Removed',
            }))
        : [],
    apply: (c) =>
      c.kind === 'security_group'
        ? {
            ...c,
            inboundRules: c.inboundRules.filter(
              (r) => !(r.ports === '22' && OPEN.includes(r.source))
            ),
          }
        : c,
  },
  'aws-sg-all-traffic-open': {
    apiCalls: [
      'ec2:RevokeSecurityGroupIngress',
      'ec2:AuthorizeSecurityGroupIngress',
    ],
    warnings: [
      'Anything on these servers reached from the internet on ports other than 80 and 443 stops working.',
    ],
    reversible: true,
    changes: () => [
      {
        setting: 'Inbound rule',
        before: 'All traffic from 0.0.0.0/0',
        after: 'Removed',
      },
      { setting: 'Inbound rule', before: '—', after: 'TCP 80 from 0.0.0.0/0' },
      { setting: 'Inbound rule', before: '—', after: 'TCP 443 from 0.0.0.0/0' },
    ],
    apply: (c) =>
      c.kind === 'security_group'
        ? {
            ...c,
            inboundRules: [
              ...c.inboundRules.filter(
                (r) => !(r.protocol === 'all' && OPEN.includes(r.source))
              ),
              { protocol: 'tcp', ports: '80', source: '0.0.0.0/0' },
              { protocol: 'tcp', ports: '443', source: '0.0.0.0/0' },
            ],
          }
        : c,
  },
  'aws-ec2-imdsv1': {
    apiCalls: ['ec2:ModifyInstanceMetadataOptions'],
    warnings: [
      'Software using AWS SDKs older than 2019 may fail to get credentials. The instance is not restarted.',
    ],
    reversible: true,
    changes: () => [{ setting: 'IMDSv2 required', before: 'No', after: 'Yes' }],
    apply: (c) =>
      c.kind === 'ec2_instance' ? { ...c, imdsV2Required: true } : c,
  },
  'aws-vpc-flow-logs': {
    apiCalls: ['logs:CreateLogGroup', 'ec2:CreateFlowLogs', 'iam:PassRole'],
    warnings: [
      'CloudWatch Logs charges apply, usually a few dollars a month for rejected traffic only.',
    ],
    reversible: true,
    changes: () => [
      {
        setting: 'Flow logs',
        before: 'Disabled',
        after: 'Rejected traffic → CloudWatch Logs (vpc-flow-logs, 90 days)',
      },
    ],
    apply: (c) => (c.kind === 'vpc' ? { ...c, flowLogsEnabled: true } : c),
    failWith:
      'InvalidParameter: the IAM role VigilFlowLogsDelivery does not exist in this account, so flow logs cannot be delivered. Update the remediation role stack with "EnableFlowLogDelivery=true" and try again.',
  },
  'aws-iam-password-policy': {
    apiCalls: ['iam:UpdateAccountPasswordPolicy'],
    warnings: [
      'Existing passwords keep working. People must meet the new rules the next time they change their password.',
    ],
    reversible: true,
    changes: (asset) =>
      asset.configuration.kind === 'password_policy'
        ? [
            {
              setting: 'Minimum length',
              before: `${asset.configuration.minimumLength}`,
              after: '14',
            },
            {
              setting: 'Prevent reuse',
              before: asset.configuration.reusePrevention
                ? `Last ${asset.configuration.reusePrevention}`
                : 'Off',
              after: 'Last 24 passwords',
            },
            {
              setting: 'Require symbols',
              before: asset.configuration.requireSymbols ? 'Yes' : 'No',
              after: 'Yes',
            },
          ]
        : [],
    apply: (c) =>
      c.kind === 'password_policy'
        ? { ...c, minimumLength: 14, reusePrevention: 24, requireSymbols: true }
        : c,
  },
  'aws-s3-versioning': {
    apiCalls: ['s3:PutBucketVersioning'],
    warnings: [
      'Storage costs rise as old versions are kept. Add a lifecycle rule to expire them after 30–90 days.',
    ],
    reversible: false,
    irreversibleReason:
      'S3 versioning can be suspended later but never turned fully off.',
    changes: () => [
      { setting: 'Versioning', before: 'Disabled', after: 'Enabled' },
    ],
    apply: (c) => (c.kind === 's3_bucket' ? { ...c, versioning: true } : c),
  },
  'aws-s3-access-logging': {
    apiCalls: ['s3:PutBucketLogging'],
    warnings: [
      'Log files are written to acme-app-logs and add a small storage cost.',
    ],
    reversible: true,
    changes: (asset) => [
      {
        setting: 'Server access logging',
        before: 'Disabled',
        after: `Enabled → acme-app-logs/${asset.name}/`,
      },
    ],
    apply: (c) => (c.kind === 's3_bucket' ? { ...c, accessLogging: true } : c),
  },
  'aws-cloudtrail-enabled': {
    apiCalls: ['cloudtrail:UpdateTrail'],
    warnings: ['CloudTrail charges apply for the additional regions.'],
    reversible: true,
    changes: () => [
      { setting: 'Multi-region trail', before: 'No', after: 'Yes' },
    ],
    apply: (c) => c,
  },
}

/** Recompute exposure after a fix changes the configuration. */
export function isPubliclyExposed(c: AssetConfiguration, current: boolean) {
  switch (c.kind) {
    case 's3_bucket':
      return !c.blockPublicAccess && c.publicPolicy
    case 'rds_instance':
      return c.publiclyAccessible
    case 'security_group':
      return c.inboundRules.some((r) => OPEN.includes(r.source))
    case 'ec2_instance':
      return c.publicIp !== null
    default:
      return current
  }
}
