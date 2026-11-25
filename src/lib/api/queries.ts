import { queryOptions } from '@tanstack/react-query'
import {
  getAccount,
  getAlertSettings,
  getAlerts,
  getCompliance,
  getAccountScans,
  getAccounts,
  getAsset,
  getAssets,
  getFinding,
  getFindings,
  getFindingsTrend,
  getPostureSummary,
  getRemediation,
  getRemediationSettings,
  getRemediations,
} from './cspm-api'

const IN_FLIGHT = new Set(['running', 'verifying'])

/**
 * Query definitions shared by every screen. Use with `useQuery(...)` in
 * components or `queryClient.ensureQueryData(...)` in route loaders.
 */
export const cspmQueries = {
  accounts: () =>
    queryOptions({ queryKey: ['accounts'], queryFn: getAccounts }),
  account: (id: string) =>
    queryOptions({
      queryKey: ['accounts', id],
      queryFn: () => getAccount(id),
    }),
  accountScans: (id: string) =>
    queryOptions({
      queryKey: ['accounts', id, 'scans'],
      queryFn: () => getAccountScans(id),
      // Poll while a scan is running so its result appears on its own
      refetchInterval: (query) =>
        query.state.data?.some((s) => s.status === 'running') ? 2000 : false,
    }),
  assets: () => queryOptions({ queryKey: ['assets'], queryFn: getAssets }),
  asset: (id: string) =>
    queryOptions({ queryKey: ['assets', id], queryFn: () => getAsset(id) }),
  findings: () =>
    queryOptions({ queryKey: ['findings'], queryFn: getFindings }),
  finding: (id: string) =>
    queryOptions({
      queryKey: ['findings', 'detail', id],
      queryFn: () => getFinding(id),
    }),
  findingsTrend: () =>
    queryOptions({
      queryKey: ['findings', 'trend'],
      queryFn: getFindingsTrend,
    }),
  compliance: () =>
    queryOptions({ queryKey: ['compliance'], queryFn: getCompliance }),
  alerts: () =>
    queryOptions({
      queryKey: ['alerts'],
      queryFn: getAlerts,
      // Keep the bell fresh without a websocket
      refetchInterval: 60_000,
    }),
  alertSettings: () =>
    queryOptions({
      queryKey: ['alerts', 'settings'],
      queryFn: getAlertSettings,
    }),
  remediations: () =>
    queryOptions({
      queryKey: ['remediations'],
      queryFn: getRemediations,
      // Poll while any fix is running so progress shows up on its own
      refetchInterval: (query) =>
        query.state.data?.some((r) => IN_FLIGHT.has(r.status)) ? 1500 : false,
    }),
  remediation: (id: string) =>
    queryOptions({
      queryKey: ['remediations', 'detail', id],
      queryFn: () => getRemediation(id),
      refetchInterval: (query) =>
        query.state.data && IN_FLIGHT.has(query.state.data.status)
          ? 1500
          : false,
    }),
  remediationSettings: () =>
    queryOptions({
      queryKey: ['remediations', 'settings'],
      queryFn: getRemediationSettings,
    }),
  postureSummary: () =>
    queryOptions({
      queryKey: ['posture', 'summary'],
      queryFn: getPostureSummary,
    }),
}
