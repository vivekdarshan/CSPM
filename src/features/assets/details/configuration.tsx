import { differenceInDays, formatDistanceToNow } from 'date-fns'
import {
  type AssetConfiguration,
  type IamAccessKey,
  type SecurityGroupRule,
} from '@/types/cspm'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Row = {
  label: string
  value: React.ReactNode
  /** Why this value is a risk, shown next to it */
  risk?: string
}

const KEY_ROTATION_DAYS = 90
const OPEN_TO_WORLD = ['0.0.0.0/0', '::/0']
const WEB_PORTS = ['80', '443']

const yesNo = (v: boolean) => (v ? 'Yes' : 'No')
const onOff = (v: boolean) => (v ? 'Enabled' : 'Disabled')
const ago = (iso: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : 'Never'

const isRiskyRule = (r: SecurityGroupRule) =>
  OPEN_TO_WORLD.includes(r.source) && !WEB_PORTS.includes(r.ports)

const keyAgeDays = (k: IamAccessKey) =>
  differenceInDays(new Date(), new Date(k.createdAt))

function describe(c: AssetConfiguration): Row[] {
  switch (c.kind) {
    case 'ec2_instance':
      return [
        {
          label: 'State',
          value: c.state === 'running' ? 'Running' : 'Stopped',
        },
        { label: 'Instance type', value: c.instanceType },
        {
          label: 'Public IP',
          value: c.publicIp ?? 'None',
          risk: c.publicIp ? 'Reachable from the internet' : undefined,
        },
        { label: 'Private IP', value: c.privateIp },
        {
          label: 'IMDSv2 required',
          value: yesNo(c.imdsV2Required),
          risk: c.imdsV2Required
            ? undefined
            : 'IMDSv1 lets SSRF bugs steal role credentials',
        },
        { label: 'IAM role', value: c.iamRole ?? 'None' },
        { label: 'VPC', value: c.vpcId },
        {
          label: 'Security groups',
          value: c.securityGroupIds.join(', ') || 'None',
        },
        { label: 'Launched', value: ago(c.launchedAt) },
      ]
    case 's3_bucket':
      return [
        {
          label: 'Block public access',
          value: onOff(c.blockPublicAccess),
          risk: c.blockPublicAccess ? undefined : 'Bucket can be made public',
        },
        {
          label: 'Bucket policy',
          value: c.publicPolicy ? 'Grants public access' : 'Private',
          risk: c.publicPolicy
            ? 'Anyone on the internet can read objects'
            : undefined,
        },
        {
          label: 'Default encryption',
          value: c.encryption === 'none' ? 'None' : c.encryption,
          risk:
            c.encryption === 'none'
              ? 'Objects are stored unencrypted'
              : undefined,
        },
        {
          label: 'Versioning',
          value: onOff(c.versioning),
          risk: c.versioning
            ? undefined
            : 'Deleted or overwritten data cannot be recovered',
        },
        {
          label: 'Access logging',
          value: onOff(c.accessLogging),
          risk: c.accessLogging
            ? undefined
            : 'No record of who accessed objects',
        },
        { label: 'Size', value: `${c.sizeGb.toLocaleString()} GB` },
      ]
    case 'rds_instance':
      return [
        { label: 'Engine', value: c.engine },
        { label: 'Instance class', value: c.instanceClass },
        {
          label: 'Publicly accessible',
          value: yesNo(c.publiclyAccessible),
          risk: c.publiclyAccessible
            ? 'Database endpoint resolves to a public IP'
            : undefined,
        },
        {
          label: 'Storage encrypted',
          value: yesNo(c.storageEncrypted),
          risk: c.storageEncrypted
            ? undefined
            : 'Data and snapshots are unencrypted',
        },
        { label: 'Multi-AZ', value: yesNo(c.multiAz) },
        {
          label: 'Backup retention',
          value: `${c.backupRetentionDays} day${c.backupRetentionDays === 1 ? '' : 's'}`,
          risk:
            c.backupRetentionDays < 7
              ? 'Less than 7 days of backups'
              : undefined,
        },
        { label: 'Deletion protection', value: onOff(c.deletionProtection) },
      ]
    case 'iam_user':
      return [
        { label: 'Console access', value: yesNo(c.consoleAccess) },
        {
          label: 'MFA',
          value: onOff(c.mfaEnabled),
          risk:
            c.consoleAccess && !c.mfaEnabled
              ? 'Console sign-in is protected by a password only'
              : undefined,
        },
        { label: 'Access keys', value: c.accessKeys.length || 'None' },
        { label: 'Last activity', value: ago(c.lastActivityAt) },
      ]
    case 'iam_role':
      return [
        { label: 'Trusted by', value: c.trustedEntities.join(', ') },
        { label: 'Last used', value: ago(c.lastUsedAt) },
      ]
    case 'security_group':
      return [
        { label: 'Description', value: c.description },
        { label: 'VPC', value: c.vpcId },
        {
          label: 'Attached to',
          value: `${c.attachedResources} resource${c.attachedResources === 1 ? '' : 's'}`,
        },
        {
          label: 'Inbound rules',
          value: c.inboundRules.length,
          risk: c.inboundRules.some(isRiskyRule)
            ? 'Non-web ports are open to the internet'
            : undefined,
        },
      ]
    case 'vpc':
      return [
        { label: 'CIDR block', value: c.cidrBlock },
        { label: 'Default VPC', value: yesNo(c.isDefault) },
        {
          label: 'Flow logs',
          value: onOff(c.flowLogsEnabled),
          risk: c.flowLogsEnabled
            ? undefined
            : 'No network traffic records for investigations',
        },
      ]
    case 'ebs_volume':
      return [
        { label: 'Size', value: `${c.sizeGb} GB` },
        { label: 'Volume type', value: c.volumeType },
        {
          label: 'Encrypted',
          value: yesNo(c.encrypted),
          risk: c.encrypted ? undefined : 'Data and snapshots are unencrypted',
        },
        { label: 'Attached to', value: c.attachedTo ?? 'Not attached' },
      ]
    case 'password_policy':
      return [
        {
          label: 'Minimum length',
          value: `${c.minimumLength} characters`,
          risk: c.minimumLength < 14 ? 'CIS recommends at least 14' : undefined,
        },
        {
          label: 'Require symbols',
          value: yesNo(c.requireSymbols),
          risk: c.requireSymbols ? undefined : 'Weaker passwords allowed',
        },
        { label: 'Require numbers', value: yesNo(c.requireNumbers) },
        { label: 'Require uppercase', value: yesNo(c.requireUppercase) },
        {
          label: 'Maximum age',
          value: c.maxAgeDays ? `${c.maxAgeDays} days` : 'Never expires',
        },
        {
          label: 'Prevent reuse',
          value: c.reusePrevention
            ? `Last ${c.reusePrevention} passwords`
            : 'Off',
          risk: c.reusePrevention
            ? undefined
            : 'CIS recommends blocking the last 24',
        },
      ]
  }
}

export function ConfigurationList({ config }: { config: AssetConfiguration }) {
  const rows = describe(config)
  return (
    <dl className='divide-y'>
      {rows.map((r) => (
        <div
          key={r.label}
          className='grid gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[11rem_1fr] sm:gap-4'
        >
          <dt className='text-muted-foreground text-sm'>{r.label}</dt>
          <dd className='min-w-0 text-sm'>
            <span className={cn('break-words', r.risk && 'font-medium')}>
              {r.value}
            </span>
            {r.risk && (
              <span className='text-severity-high-ink mt-0.5 flex items-start gap-1.5 text-xs'>
                <AlertTriangle
                  className='mt-px size-3.5 shrink-0'
                  aria-hidden
                />
                <span>
                  <span className='sr-only'>Risk: </span>
                  {r.risk}
                </span>
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function SecurityGroupRules({ rules }: { rules: SecurityGroupRule[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Protocol</TableHead>
          <TableHead>Ports</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className='hidden sm:table-cell'>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((r, i) => {
          const risky = isRiskyRule(r)
          return (
            <TableRow key={i} className={cn(risky && 'bg-destructive/5')}>
              <TableCell className='uppercase'>{r.protocol}</TableCell>
              <TableCell className='font-mono'>{r.ports}</TableCell>
              <TableCell>
                <span className='font-mono'>{r.source}</span>
                {risky && (
                  <span className='text-destructive mt-0.5 flex items-center gap-1 text-xs font-medium'>
                    <AlertTriangle className='size-3.5' aria-hidden /> Open to
                    the internet
                  </span>
                )}
              </TableCell>
              <TableCell className='text-muted-foreground hidden sm:table-cell'>
                {r.description ?? '—'}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function AccessKeys({ keys }: { keys: IamAccessKey[] }) {
  if (keys.length === 0) {
    return <p className='text-muted-foreground text-sm'>No access keys.</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key ID</TableHead>
          <TableHead>Age</TableHead>
          <TableHead>Last used</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((k) => {
          const age = keyAgeDays(k)
          const stale = k.active && age > KEY_ROTATION_DAYS
          return (
            <TableRow key={k.id}>
              <TableCell className='font-mono text-xs'>{k.id}</TableCell>
              <TableCell>
                {age} days
                {stale && (
                  <span className='text-severity-high-ink mt-0.5 flex items-center gap-1 text-xs font-medium'>
                    <AlertTriangle className='size-3.5' aria-hidden /> Rotate
                    (over {KEY_ROTATION_DAYS} days)
                  </span>
                )}
              </TableCell>
              <TableCell>{ago(k.lastUsedAt)}</TableCell>
              <TableCell>
                <Badge variant={k.active ? 'secondary' : 'outline'}>
                  {k.active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function PolicyList({ policies }: { policies: string[] }) {
  return (
    <ul className='flex flex-wrap gap-1.5'>
      {policies.map((p) => {
        const admin = p === 'AdministratorAccess' || p === 'Full account access'
        return (
          <li key={p}>
            <Badge
              variant='outline'
              className={cn(
                'font-mono',
                admin && 'border-destructive/40 text-destructive'
              )}
            >
              {p}
              {admin && <span className='sr-only'> (full admin access)</span>}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
