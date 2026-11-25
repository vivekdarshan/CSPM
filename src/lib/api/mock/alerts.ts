/** Seeded alert inbox and notification settings for the mock backend. */
import { type Alert, type AlertSettings } from '@/types/cspm'
import { isOpenFinding } from '@/lib/findings'
import { mockAccounts, mockFindings } from './data'
import { DAY, daysAgo, hoursAgo, now } from './time'

const WEEK = 7 * DAY

const accountName = (id: string) =>
  mockAccounts.find((a) => a.id === id)?.name ?? 'an account'

export const mockAlerts: Alert[] = [
  // A "new finding" alert for every open critical or high finding
  ...mockFindings
    .filter(
      (f) =>
        isOpenFinding(f) && (f.severity === 'critical' || f.severity === 'high')
    )
    .map(
      (f): Alert => ({
        id: `alt-${f.id}`,
        type: 'new_finding',
        severity: f.severity,
        title: `New ${f.severity} finding: ${f.title}`,
        message: `${f.resourceName} in ${accountName(f.accountId)}`,
        createdAt: f.firstSeenAt,
        // Anything older than a week has been seen already
        read: now - new Date(f.firstSeenAt).getTime() > WEEK,
        findingId: f.id,
        accountId: f.accountId,
      })
    ),
  {
    id: 'alt-rem-001',
    type: 'remediation_pending',
    severity: null,
    title:
      'Fix waiting for approval: Security group allows SSH (22) from 0.0.0.0/0',
    message:
      'Priya Shah asked to fix sg-staging-ssh. Someone else must approve it.',
    createdAt: hoursAgo(2),
    read: false,
    remediationId: 'rem-001',
  },
  {
    id: 'alt-scan-shared',
    type: 'scan_failed',
    severity: null,
    title: 'Scan failed: Shared Services',
    message:
      'AssumeRole failed: the trust policy on VigilSecurityAudit does not allow this external ID.',
    createdAt: hoursAgo(6),
    read: false,
    accountId: 'acc-shared',
  },
  {
    id: 'alt-conn-shared',
    type: 'connection_failed',
    severity: null,
    title: 'Connection lost: Shared Services',
    message:
      'Vigil can no longer assume its role in account 295108437720. Results for this account are out of date.',
    createdAt: daysAgo(4),
    read: true,
    accountId: 'acc-shared',
  },
  {
    id: 'alt-resolved-017',
    type: 'finding_resolved',
    severity: 'high',
    title: 'Resolved: CloudTrail is not enabled in all regions',
    message: 'A scan of Production confirmed the fix.',
    createdAt: daysAgo(5),
    read: true,
    findingId: 'fnd-017',
    accountId: 'acc-prod',
  },
]
mockAlerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const mockAlertSettings: AlertSettings = {
  channels: [
    {
      id: 'ch-email',
      type: 'email',
      name: 'Security team',
      target: 'security@acme.test',
      enabled: true,
      lastTestedAt: daysAgo(20),
    },
    {
      id: 'ch-slack',
      type: 'slack',
      name: '#security-alerts',
      target: 'https://hooks.slack.com/services/T000/B000/EXAMPLE',
      enabled: true,
      lastTestedAt: daysAgo(20),
    },
  ],
  rules: [
    {
      id: 'rule-new-finding',
      trigger: 'new_finding',
      minSeverity: 'high',
      channelIds: ['ch-email', 'ch-slack'],
      enabled: true,
    },
    {
      id: 'rule-connection',
      trigger: 'connection_failed',
      channelIds: ['ch-email', 'ch-slack'],
      enabled: true,
    },
    {
      id: 'rule-scan-failed',
      trigger: 'scan_failed',
      channelIds: ['ch-email'],
      enabled: false,
    },
    {
      id: 'rule-digest',
      trigger: 'weekly_digest',
      channelIds: ['ch-email'],
      enabled: true,
    },
  ],
}
