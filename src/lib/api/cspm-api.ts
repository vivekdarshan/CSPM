/**
 * The single place the UI fetches data from. Each function either returns
 * mock data or calls the backend; screens never know the difference.
 */
import {
  type Asset,
  type AwsOnboardingSetup,
  type CloudAccount,
  type ConnectAwsAccountInput,
  type ConnectAwsAccountResult,
  type ConnectionTestResult,
  type Finding,
  type FindingsTrendPoint,
  type PostureSummary,
  type ScanRun,
  type SeverityCounts,
  type UpdateAccountInput,
} from '@/types/cspm'
import { SEVERITY_META, SEVERITY_ORDER } from '@/lib/severity'
import { USE_MOCK_API, http, mockDelay } from './client'
import {
  mockAccounts,
  mockAssets,
  mockFindings,
  mockFindingsTrend,
} from './mock/data'
import * as mockStore from './mock/store'

const isOpen = (f: Finding) => f.status === 'open' || f.status === 'in_progress'

export function countBySeverity(findings: Finding[]): SeverityCounts {
  const counts = Object.fromEntries(
    SEVERITY_ORDER.map((s) => [s, 0])
  ) as SeverityCounts
  for (const f of findings) counts[f.severity]++
  return counts
}

/**
 * 100 with no open findings, falling towards 0 as weighted risk grows.
 * The curve keeps the score meaningful for both small and large estates.
 */
const SCORE_HALF_POINT = 60 // weighted penalty at which the score is 50

export function computePostureScore(counts: SeverityCounts) {
  const penalty = SEVERITY_ORDER.reduce(
    (sum, s) => sum + counts[s] * SEVERITY_META[s].weight,
    0
  )
  return Math.round((100 * SCORE_HALF_POINT) / (SCORE_HALF_POINT + penalty))
}

export async function getAccounts(): Promise<CloudAccount[]> {
  if (USE_MOCK_API) return mockDelay(mockAccounts)
  return (await http.get<CloudAccount[]>('/accounts')).data
}

export async function getAssets(): Promise<Asset[]> {
  if (USE_MOCK_API) return mockDelay(mockAssets)
  return (await http.get<Asset[]>('/assets')).data
}

export async function getFindings(): Promise<Finding[]> {
  if (USE_MOCK_API) return mockDelay(mockFindings)
  return (await http.get<Finding[]>('/findings')).data
}

export async function getFindingsTrend(): Promise<FindingsTrendPoint[]> {
  if (USE_MOCK_API) {
    // Make "today" match the live finding counts
    const counts = countBySeverity(mockFindings.filter(isOpen))
    const trend = [...mockFindingsTrend]
    const last = trend[trend.length - 1]
    trend[trend.length - 1] = {
      date: last.date,
      critical: counts.critical,
      high: counts.high,
      medium: counts.medium,
      low: counts.low,
    }
    return mockDelay(trend)
  }
  return (await http.get<FindingsTrendPoint[]>('/findings/trend')).data
}

export async function getPostureSummary(): Promise<PostureSummary> {
  if (USE_MOCK_API) {
    const open = mockFindings.filter(isOpen)
    const counts = countBySeverity(open)
    const score = computePostureScore(counts)
    const first = mockFindingsTrend[0]
    const scoreThen = computePostureScore({ ...first, informational: 0 })
    const scans = mockAccounts
      .map((a) => a.lastScanAt)
      .filter((d): d is string => d !== null)
      .sort()
    return mockDelay({
      score,
      scoreDelta: score - scoreThen,
      openFindings: counts,
      totalAssets: mockAssets.length,
      exposedAssets: mockAssets.filter((a) => a.publiclyExposed).length,
      connectedAccounts: mockAccounts.filter((a) => a.status === 'connected')
        .length,
      totalAccounts: mockAccounts.length,
      lastScanAt: scans[scans.length - 1] ?? null,
    })
  }
  return (await http.get<PostureSummary>('/posture/summary')).data
}

/** Kicks off a scan of every connected account. */
export async function startScan(): Promise<ScanRun[]> {
  if (USE_MOCK_API) return mockDelay(mockStore.startAllScans(), 800)
  return (await http.post<ScanRun[]>('/scans')).data
}

/* ----- Account onboarding (Phase 2) ----- */

export async function getAccount(id: string): Promise<CloudAccount> {
  if (USE_MOCK_API) {
    return mockDelay(null).then(() => structuredClone(mockStore.getAccount(id)))
  }
  return (await http.get<CloudAccount>(`/accounts/${id}`)).data
}

/** Issues the external ID and role details for a new AWS connection. */
export async function getAwsOnboardingSetup(): Promise<AwsOnboardingSetup> {
  if (USE_MOCK_API) return mockDelay(mockStore.getOnboardingSetup())
  return (await http.post<AwsOnboardingSetup>('/accounts/aws/setup')).data
}

/** Tests the role and, if every check passes, saves the account. */
export async function connectAwsAccount(
  input: ConnectAwsAccountInput
): Promise<ConnectAwsAccountResult> {
  if (USE_MOCK_API) return mockDelay(mockStore.connectAwsAccount(input), 2200)
  return (await http.post<ConnectAwsAccountResult>('/accounts/aws', input)).data
}

export async function testAccountConnection(
  id: string
): Promise<ConnectionTestResult> {
  if (USE_MOCK_API) return mockDelay(mockStore.testConnection(id), 1800)
  return (
    await http.post<ConnectionTestResult>(`/accounts/${id}/test-connection`)
  ).data
}

export async function updateAccount(
  id: string,
  input: UpdateAccountInput
): Promise<CloudAccount> {
  if (USE_MOCK_API) return mockDelay(mockStore.updateAccount(id, input))
  return (await http.patch<CloudAccount>(`/accounts/${id}`, input)).data
}

export async function disconnectAccount(id: string): Promise<void> {
  if (USE_MOCK_API) {
    mockStore.disconnectAccount(id)
    return mockDelay(undefined, 600)
  }
  await http.delete(`/accounts/${id}`)
}

export async function getAccountScans(accountId: string): Promise<ScanRun[]> {
  if (USE_MOCK_API) return mockDelay(mockStore.getScanRuns(accountId))
  return (await http.get<ScanRun[]>(`/accounts/${accountId}/scans`)).data
}

export async function startAccountScan(accountId: string): Promise<ScanRun> {
  if (USE_MOCK_API) return mockDelay(mockStore.startAccountScan(accountId))
  return (await http.post<ScanRun>(`/accounts/${accountId}/scans`)).data
}
