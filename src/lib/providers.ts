import { type CloudProvider } from '@/types/cspm'

export const PROVIDER_META: Record<
  CloudProvider,
  { label: string; short: string; className: string }
> = {
  aws: {
    label: 'Amazon Web Services',
    short: 'AWS',
    className: 'bg-[#232f3e] text-[#ff9900]',
  },
  azure: {
    label: 'Microsoft Azure',
    short: 'Az',
    className: 'bg-[#0078d4] text-white',
  },
  gcp: {
    label: 'Google Cloud',
    short: 'GCP',
    className: 'bg-white text-[#1a73e8] ring-1 ring-inset ring-[#dadce0]',
  },
}
