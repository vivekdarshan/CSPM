import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cspmQueries } from '@/lib/api/queries'
import { controlsForAccount, summarize } from '@/lib/compliance'

/** Framework, account-scoped controls and lookups shared by page and report. */
export function useCompliance(accountId: string | undefined) {
  const {
    data: framework,
    isError: frameworkError,
    refetch: refetchFramework,
  } = useQuery(cspmQueries.compliance())
  const {
    data: findings,
    isError: findingsError,
    refetch: refetchFindings,
  } = useQuery(cspmQueries.findings())
  const {
    data: accounts,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useQuery(cspmQueries.accounts())

  const ready = useMemo(() => {
    if (!framework || !findings || !accounts) return undefined
    const controls = controlsForAccount(framework.controls, findings, accountId)
    return {
      status: 'ready' as const,
      framework,
      controls,
      sections: framework.sections.map((s) => ({
        ...s,
        ...summarize(controls.filter((c) => c.sectionId === s.id)),
      })),
      summary: summarize(controls),
      findingsById: new Map(findings.map((f) => [f.id, f])),
      accounts,
      accountNames: new Map(accounts.map((a) => [a.id, a.name])),
      account: accounts.find((a) => a.id === accountId),
    }
  }, [framework, findings, accounts, accountId])

  if (ready) return ready
  return {
    status: (frameworkError || findingsError || accountsError
      ? 'error'
      : 'loading') as 'error' | 'loading',
    retry: () => {
      refetchFramework()
      refetchFindings()
      refetchAccounts()
    },
  }
}
