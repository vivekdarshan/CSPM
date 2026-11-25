import { z } from 'zod'
import {
  AWS_ACCOUNT_ID_PATTERN,
  AWS_ROLE_ARN_PATTERN,
  accountIdFromRoleArn,
} from '@/lib/aws'

export const connectSchema = z
  .object({
    provider: z.enum(['aws', 'azure', 'gcp']),
    name: z
      .string()
      .trim()
      .min(2, 'Enter a name of at least 2 characters.')
      .max(40, 'Keep the name under 40 characters.'),
    accountId: z
      .string()
      .trim()
      .regex(AWS_ACCOUNT_ID_PATTERN, 'Enter the 12-digit AWS account ID.'),
    environment: z.enum(['production', 'staging', 'development', 'shared']),
    regions: z.array(z.string()).min(1, 'Select at least one region.'),
    roleArn: z
      .string()
      .trim()
      .regex(
        AWS_ROLE_ARN_PATTERN,
        'Enter a role ARN, e.g. arn:aws:iam::123456789012:role/VigilSecurityAudit.'
      ),
  })
  .refine((v) => accountIdFromRoleArn(v.roleArn) === v.accountId, {
    path: ['roleArn'],
    message: 'This role belongs to a different AWS account.',
  })

export type ConnectFormValues = z.infer<typeof connectSchema>

export const STEPS = [
  { id: 'provider', title: 'Provider', fields: ['provider'] },
  {
    id: 'details',
    title: 'Account details',
    fields: ['name', 'accountId', 'environment', 'regions'],
  },
  { id: 'access', title: 'Grant access', fields: ['roleArn'] },
  { id: 'verify', title: 'Verify', fields: [] },
] as const satisfies {
  id: string
  title: string
  fields: readonly (keyof ConnectFormValues)[]
}[]
