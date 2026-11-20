import { Link } from '@tanstack/react-router'
import { APP_CONFIG } from '@/config/app'
import { Logo } from '@/assets/logo'
import { useAuthStore } from '@/stores/auth-store'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

/** Product brand and current organization, shown at the top of the sidebar. */
export function AppTitle() {
  const { setOpenMobile } = useSidebar()
  const organization = useAuthStore((s) => s.auth.user?.organization)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <Link to='/' onClick={() => setOpenMobile(false)}>
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              <Logo className='size-5' />
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold'>{APP_CONFIG.name}</span>
              <span className='text-muted-foreground truncate text-xs'>
                {organization ?? APP_CONFIG.tagline}
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
