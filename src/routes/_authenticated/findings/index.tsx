import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Findings } from '@/features/findings'

/** Filters live in the URL so a filtered view can be shared or bookmarked. */
const findingsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(20),
  filter: z.string().optional().catch(''),
  /** Status tab; "open" includes in-progress findings */
  view: z
    .enum(['open', 'suppressed', 'resolved', 'all'])
    .optional()
    .catch('open'),
  severity: z
    .array(z.enum(['critical', 'high', 'medium', 'low', 'informational']))
    .optional()
    .catch([]),
  category: z.array(z.string()).optional().catch([]),
  account: z.array(z.string()).optional().catch([]),
  type: z.array(z.string()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/findings/')({
  validateSearch: findingsSearchSchema,
  component: Findings,
})
