import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Assets } from '@/features/assets'

/** Filters live in the URL so a filtered view can be shared or bookmarked. */
const assetsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(20),
  filter: z.string().optional().catch(''),
  type: z.array(z.string()).optional().catch([]),
  account: z.array(z.string()).optional().catch([]),
  region: z.array(z.string()).optional().catch([]),
  exposure: z
    .array(z.enum(['public', 'private']))
    .optional()
    .catch([]),
  risk: z
    .array(z.enum(['critical', 'high', 'medium', 'low', 'none']))
    .optional()
    .catch([]),
})

export type AssetsSearch = z.infer<typeof assetsSearchSchema>

export const Route = createFileRoute('/_authenticated/assets/')({
  validateSearch: assetsSearchSchema,
  component: Assets,
})
