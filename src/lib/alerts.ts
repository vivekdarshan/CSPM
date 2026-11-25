import { type AlertTrigger, type ChannelType } from '@/types/cspm'
import { Hash, Mail, MessageSquare } from 'lucide-react'

export const TRIGGER_META: Record<
  AlertTrigger,
  { title: string; description: string }
> = {
  new_finding: {
    title: 'New finding',
    description: 'A scan finds a new problem at or above the chosen severity.',
  },
  connection_failed: {
    title: 'Account connection lost',
    description: 'We can no longer reach a connected account.',
  },
  scan_failed: {
    title: 'Scan failed',
    description: 'A scheduled or manual scan could not finish.',
  },
  weekly_digest: {
    title: 'Weekly summary',
    description:
      'Every Monday: posture score, new and fixed findings, and anything overdue.',
  },
}

export const CHANNEL_META: Record<
  ChannelType,
  {
    label: string
    icon: React.ElementType
    targetLabel: string
    placeholder: string
  }
> = {
  email: {
    label: 'Email',
    icon: Mail,
    targetLabel: 'Email address',
    placeholder: 'security@yourcompany.com',
  },
  slack: {
    label: 'Slack',
    icon: Hash,
    targetLabel: 'Incoming webhook URL',
    placeholder: 'https://hooks.slack.com/services/…',
  },
  teams: {
    label: 'Microsoft Teams',
    icon: MessageSquare,
    targetLabel: 'Workflow webhook URL',
    placeholder: 'https://…',
  },
}

/** Webhook URLs are secrets: show the host and the last few characters. */
export function maskTarget(type: ChannelType, target: string) {
  if (type === 'email') return target
  try {
    const url = new URL(target)
    return `${url.host}/…${target.slice(-4)}`
  } catch {
    return '…' + target.slice(-4)
  }
}
