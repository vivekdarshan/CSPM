import { queryOptions } from '@tanstack/react-query'
import {
  getAccounts,
  getAssets,
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
  assets: () => queryOptions({ queryKey: ['assets'], queryFn: getAssets }),
  findings: () =>
    queryOptions({ queryKey: ['findings'], queryFn: getFindings }),
  findingsTrend: () =>
    queryOptions({
      queryKey: ['findings', 'trend'],
      queryFn: getFindingsTrend,
    }),
  postureSummary: () =>
    queryOptions({
      queryKey: ['posture', 'summary'],
      queryFn: getPostureSummary,
    }),
}
