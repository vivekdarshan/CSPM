import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ComplianceReport } from '@/features/compliance/report'

export const Route = createFileRoute('/_authenticated/compliance/report')({
  validateSearch: z.object({
    account: z.string().optional().catch(undefined),
  }),
  component: ComplianceReport,
})
