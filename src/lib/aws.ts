import { type AccountEnvironment } from '@/types/cspm'

export const AWS_REGIONS = [
  { code: 'us-east-1', name: 'US East (N. Virginia)' },
  { code: 'us-east-2', name: 'US East (Ohio)' },
  { code: 'us-west-1', name: 'US West (N. California)' },
  { code: 'us-west-2', name: 'US West (Oregon)' },
  { code: 'ca-central-1', name: 'Canada (Central)' },
  { code: 'eu-west-1', name: 'Europe (Ireland)' },
  { code: 'eu-west-2', name: 'Europe (London)' },
  { code: 'eu-west-3', name: 'Europe (Paris)' },
  { code: 'eu-central-1', name: 'Europe (Frankfurt)' },
  { code: 'eu-north-1', name: 'Europe (Stockholm)' },
  { code: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
  { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { code: 'ap-southeast-2', name: 'Asia Pacific (Sydney)' },
  { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
  { code: 'sa-east-1', name: 'South America (São Paulo)' },
] as const

const REGION_NAMES: Record<string, string> = Object.fromEntries(
  AWS_REGIONS.map((r) => [r.code, r.name])
)

export const regionName = (code: string) => REGION_NAMES[code] ?? code

export const ENVIRONMENT_LABELS: Record<AccountEnvironment, string> = {
  production: 'Production',
  staging: 'Staging',
  development: 'Development',
  shared: 'Shared services',
}

export const AWS_ACCOUNT_ID_PATTERN = /^\d{12}$/

/** arn:aws:iam::123456789012:role/path/RoleName (any AWS partition) */
export const AWS_ROLE_ARN_PATTERN =
  /^arn:aws(?:-[a-z]+)*:iam::(\d{12}):role\/[\w+=,.@/-]{1,512}$/

export const accountIdFromRoleArn = (arn: string) =>
  AWS_ROLE_ARN_PATTERN.exec(arn.trim())?.[1]

/** Managed policies the read-only role needs. Both are AWS-maintained. */
export const AWS_READ_ONLY_POLICIES = [
  {
    name: 'SecurityAudit',
    arn: 'arn:aws:iam::aws:policy/SecurityAudit',
    purpose: 'Read security configuration across services',
  },
  {
    name: 'ViewOnlyAccess',
    arn: 'arn:aws:iam::aws:policy/job-function/ViewOnlyAccess',
    purpose: 'List resources and read their metadata',
  },
] as const

export function buildTrustPolicy(
  principalAccountId: string,
  trustExternalId: string
) {
  return JSON.stringify(
    {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: `arn:aws:iam::${principalAccountId}:root` },
          Action: 'sts:AssumeRole',
          Condition: { StringEquals: { 'sts:ExternalId': trustExternalId } },
        },
      ],
    },
    null,
    2
  )
}

export const CLOUDFORMATION_CONSOLE_URL =
  'https://console.aws.amazon.com/cloudformation/home#/stacks/create'
