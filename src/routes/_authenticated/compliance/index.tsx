import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Compliance } from '@/features/compliance'

const complianceSearchSchema = z.object({
  /** Limit results to one account */
  account: z.string().optional().catch(undefined),
  status: z.enum(['fail', 'pass', 'manual']).optional().catch(undefined),
  section: z.string().optional().catch(undefined),
  /** Control open in the side panel */
  control: z.string().optional().catch(undefined),
})

export type ComplianceSearch = z.infer<typeof complianceSearchSchema>

export const Route = createFileRoute('/_authenticated/compliance/')({
  validateSearch: complianceSearchSchema,
  component: Compliance,
})
