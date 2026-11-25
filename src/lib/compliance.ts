import {
  type ComplianceControl,
  type ControlStatus,
  type Finding,
} from '@/types/cspm'

export const CONTROL_STATUS_LABELS: Record<ControlStatus, string> = {
  pass: 'Pass',
  fail: 'Fail',
  manual: 'Manual check',
}

/**
 * Re-evaluate controls for one account. The framework is evaluated across
 * all accounts; a control fails for an account only if that account has
 * one of its failing findings.
 */
export function controlsForAccount(
  controls: ComplianceControl[],
  findings: Finding[],
  accountId: string | undefined
): ComplianceControl[] {
  if (!accountId) return controls
  const inAccount = new Set(
    findings.filter((f) => f.accountId === accountId).map((f) => f.id)
  )
  return controls.map((c) => {
    const failing = c.failingFindingIds.filter((id) => inAccount.has(id))
    return {
      ...c,
      failingFindingIds: failing,
      exceptionFindingIds: c.exceptionFindingIds.filter((id) =>
        inAccount.has(id)
      ),
      status:
        c.assessment === 'manual' ? 'manual' : failing.length ? 'fail' : 'pass',
    }
  })
}

export function summarize(controls: ComplianceControl[]) {
  const pass = controls.filter((c) => c.status === 'pass').length
  const fail = controls.filter((c) => c.status === 'fail').length
  const manual = controls.filter((c) => c.status === 'manual').length
  const automated = pass + fail
  return {
    pass,
    fail,
    manual,
    total: controls.length,
    /** Share of automated controls passing, 0-100 */
    percent: automated ? Math.round((pass / automated) * 100) : 100,
  }
}

const csvCell = (value: string | number) => {
  let text = String(value)
  // Resource names come from the cloud account; stop spreadsheet apps
  // treating a name like "=HYPERLINK(...)" as a formula
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** One row per control, ready for Excel or Google Sheets. */
export function controlsToCsv(
  controls: ComplianceControl[],
  sectionTitles: Record<string, string>,
  findings: Map<string, Finding>
) {
  const header = [
    'Control',
    'Title',
    'Section',
    'Level',
    'Assessment',
    'Status',
    'Failing resources',
    'Exceptions',
  ]
  const rows = controls.map((c) => [
    c.controlId,
    c.title,
    sectionTitles[c.sectionId] ?? c.sectionId,
    `Level ${c.level}`,
    c.assessment === 'manual' ? 'Manual' : 'Automated',
    CONTROL_STATUS_LABELS[c.status],
    c.failingFindingIds
      .map((id) => findings.get(id)?.resourceName ?? id)
      .join('; '),
    c.exceptionFindingIds
      .map((id) => findings.get(id)?.resourceName ?? id)
      .join('; '),
  ])
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
}

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Revoking straight away can cancel the download in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
