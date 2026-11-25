import {
  type Finding,
  type FindingCategory,
  type FindingRisk,
  type Remediation,
  type RiskImpact,
  type SuppressionReason,
} from '@/types/cspm'

export const isOpenFinding = (f: Pick<Finding, 'status'>) =>
  f.status === 'open' || f.status === 'in_progress'

export const CATEGORY_LABELS: Record<FindingCategory, string> = {
  misconfiguration: 'Misconfiguration',
  exposure: 'Exposure',
  identity: 'Identity & access',
  encryption: 'Encryption',
  logging: 'Logging',
}

export const IMPACT_LABELS: Record<RiskImpact, string> = {
  data_exposure: 'Data exposure',
  account_takeover: 'Account takeover',
  service_disruption: 'Service disruption',
  data_loss: 'Data loss',
  lateral_movement: 'Lateral movement',
  audit_gap: 'Blind spot in audits',
}

export const EXPLOITABILITY_LABELS: Record<
  FindingRisk['exploitability'],
  { label: string; detail: string }
> = {
  easy: {
    label: 'Easy to exploit',
    detail: 'Automated tools find and abuse this without any prior access.',
  },
  moderate: {
    label: 'Moderately easy',
    detail: 'Needs a leaked credential or a second weakness to abuse.',
  },
  hard: {
    label: 'Hard to exploit directly',
    detail: 'Mostly makes other incidents worse or harder to investigate.',
  },
}

export const EFFORT_LABELS: Record<
  NonNullable<Remediation['effort']>,
  string
> = {
  minutes: 'Minutes',
  hours: 'An hour or two',
  days: 'A day or more',
}

export const SUPPRESSION_REASONS: Record<
  SuppressionReason,
  { label: string; hint: string }
> = {
  intentional: {
    label: 'Intentional',
    hint: 'The setting is deliberate, e.g. a public website bucket.',
  },
  accepted_risk: {
    label: 'Accepted risk',
    hint: 'We understand the risk and have decided not to fix it for now.',
  },
  false_positive: {
    label: 'False positive',
    hint: 'The finding is wrong for this resource.',
  },
}
