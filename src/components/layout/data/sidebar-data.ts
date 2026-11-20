import {
  Bell,
  Boxes,
  ClipboardCheck,
  Cloud,
  HelpCircle,
  LayoutDashboard,
  Monitor,
  Palette,
  Settings,
  ShieldAlert,
  UserCog,
  Wrench,
  Hammer,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: 'Overview',
      items: [{ title: 'Dashboard', url: '/', icon: LayoutDashboard }],
    },
    {
      title: 'Cloud',
      items: [
        { title: 'Accounts', url: '/accounts', icon: Cloud },
        { title: 'Assets', url: '/assets', icon: Boxes },
      ],
    },
    {
      title: 'Security',
      items: [
        { title: 'Findings', url: '/findings', icon: ShieldAlert },
        { title: 'Compliance', url: '/compliance', icon: ClipboardCheck },
        { title: 'Alerts', url: '/alerts', icon: Bell },
      ],
    },
    {
      title: 'Remediation',
      items: [{ title: 'Actions', url: '/remediation', icon: Hammer }],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            { title: 'Profile', url: '/settings', icon: UserCog },
            { title: 'Account', url: '/settings/account', icon: Wrench },
            { title: 'Appearance', url: '/settings/appearance', icon: Palette },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            { title: 'Display', url: '/settings/display', icon: Monitor },
          ],
        },
        { title: 'Help Center', url: '/help-center', icon: HelpCircle },
      ],
    },
  ],
}
