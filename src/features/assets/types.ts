import { type Asset, type Severity } from '@/types/cspm'

export type RiskLevel = Exclude<Severity, 'informational'> | 'none'

/** Asset joined with what the inventory table needs to show and filter. */
export type AssetRow = Asset & {
  accountName: string
  highestSeverity: Exclude<Severity, 'informational'> | null
}
