import { type Severity } from '@/types/cspm'

/** Highest first. Use this order for lists, legends and stacked charts. */
export const SEVERITY_ORDER: Severity[] = [
  'critical',
  'high',
  'medium',
  'low',
  'informational',
]

/** Severities that are plotted on charts (informational is listed, not plotted). */
export const CHARTED_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const

export const SEVERITY_META: Record<
  Severity,
  {
    label: string
    /** Tailwind text-color class; pair with `currentColor` on SVG marks */
    textClass: string
    /** Tailwind background class for dots and bars */
    bgClass: string
    /** Classes for the badge pill */
    badgeClass: string
    /** Weight used by the posture score */
    weight: number
  }
> = {
  critical: {
    label: 'Critical',
    textClass: 'text-severity-critical',
    bgClass: 'bg-severity-critical',
    badgeClass:
      'border-severity-critical/30 bg-severity-critical/10 text-severity-critical',
    weight: 10,
  },
  high: {
    label: 'High',
    textClass: 'text-severity-high',
    bgClass: 'bg-severity-high',
    badgeClass:
      'border-severity-high/30 bg-severity-high/10 text-severity-high-ink',
    weight: 5,
  },
  medium: {
    label: 'Medium',
    textClass: 'text-severity-medium',
    bgClass: 'bg-severity-medium',
    badgeClass:
      'border-severity-medium/40 bg-severity-medium/15 text-severity-medium-ink',
    weight: 2,
  },
  low: {
    label: 'Low',
    textClass: 'text-severity-low',
    bgClass: 'bg-severity-low',
    badgeClass: 'border-severity-low/30 bg-severity-low/10 text-severity-low',
    weight: 0.5,
  },
  informational: {
    label: 'Info',
    textClass: 'text-muted-foreground',
    bgClass: 'bg-muted-foreground',
    badgeClass: 'border-border bg-muted text-muted-foreground',
    weight: 0,
  },
}

export function compareSeverity(a: Severity, b: Severity) {
  return SEVERITY_ORDER.indexOf(a) - SEVERITY_ORDER.indexOf(b)
}
