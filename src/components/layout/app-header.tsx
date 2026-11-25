import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { NotificationsBell } from '@/components/layout/notifications-bell'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

/** Standard top bar used on every authenticated page. */
export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <Header fixed>
      <Search placeholder='Search pages...' />
      {children}
      <div className='ms-auto flex items-center gap-2 sm:gap-4'>
        <NotificationsBell />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </div>
    </Header>
  )
}
