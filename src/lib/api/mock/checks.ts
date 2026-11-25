import { type ConnectionCheck } from '@/types/cspm'

/** Connection-test results the mock API returns. */

const roleName = (roleArn: string) => roleArn.split('/').pop() ?? roleArn

export function passingChecks(
  accountId: string,
  roleArn: string,
  regions: string[]
): ConnectionCheck[] {
  return [
    {
      id: 'assume_role',
      label: 'Assume IAM role',
      status: 'pass',
      detail: `Assumed ${roleName(roleArn)} using the external ID.`,
    },
    {
      id: 'external_id',
      label: 'External ID required',
      status: 'pass',
      detail: 'The role refuses requests that omit the external ID.',
    },
    {
      id: 'identity',
      label: 'Account matches',
      status: 'pass',
      detail: `The role belongs to account ${accountId}.`,
    },
    {
      id: 'permissions',
      label: 'Read-only permissions',
      status: 'pass',
      detail: 'SecurityAudit and ViewOnlyAccess are attached.',
    },
    {
      id: 'regions',
      label: 'Regions reachable',
      status: 'pass',
      detail: `${regions.length} of ${regions.length} selected regions responded.`,
    },
  ]
}

export function assumeRoleFailedChecks(roleArn: string): ConnectionCheck[] {
  return [
    {
      id: 'assume_role',
      label: 'Assume IAM role',
      status: 'fail',
      detail: `AccessDenied: the trust policy on ${roleName(roleArn)} does not allow this external ID.`,
    },
    ...[
      'External ID required',
      'Account matches',
      'Read-only permissions',
      'Regions reachable',
    ].map(
      (label, i): ConnectionCheck => ({
        id: ['external_id', 'identity', 'permissions', 'regions'][i],
        label,
        status: 'skipped',
        detail: 'Skipped because the role could not be assumed.',
      })
    ),
  ]
}
