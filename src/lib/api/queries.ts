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
} from './cspm-api'

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
  postureSummary: () =>
    queryOptions({
      queryKey: ['posture', 'summary'],
      queryFn: getPostureSummary,
    }),
}
