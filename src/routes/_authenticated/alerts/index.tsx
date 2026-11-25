import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Alerts } from '@/features/alerts'

export const Route = createFileRoute('/_authenticated/alerts/')({
  validateSearch: z.object({
    tab: z.enum(['inbox', 'rules', 'channels']).optional().catch(undefined),
    unread: z.boolean().optional().catch(undefined),
  }),
  component: Alerts,
})
