import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Remediation } from '@/features/remediation'

export const Route = createFileRoute('/_authenticated/remediation/')({
  validateSearch: z.object({
    tab: z
      .enum(['approval', 'active', 'history', 'ready'])
      .optional()
      .catch(undefined),
  }),
  component: Remediation,
})
