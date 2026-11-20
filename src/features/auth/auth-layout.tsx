import { APP_CONFIG } from '@/config/app'
import { CheckCircle2 } from 'lucide-react'
import { Logo } from '@/assets/logo'

type AuthLayoutProps = {
  children: React.ReactNode
}

const HIGHLIGHTS = [
  'Find misconfigurations across AWS, Azure and Google Cloud',
  'See which resources are exposed to the internet',
  'Get clear, step-by-step fixes ranked by risk',
]

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='flex items-center justify-center px-4 py-10'>
        <div className='w-full max-w-[420px] space-y-6'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg'>
              <Logo className='size-5' />
            </div>
            <div className='leading-tight'>
              <p className='text-lg font-semibold'>{APP_CONFIG.name}</p>
              <p className='text-muted-foreground text-xs'>
                {APP_CONFIG.tagline}
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>

      <div className='bg-muted/40 relative hidden flex-col justify-center border-s px-12 lg:flex'>
        <div className='max-w-md space-y-6'>
          <h2 className='text-3xl font-bold tracking-tight'>
            Cloud security without a security team.
          </h2>
          <p className='text-muted-foreground'>
            Connect a cloud account in minutes with read-only access. We scan it
            continuously and tell you exactly what to fix.
          </p>
          <ul className='space-y-3'>
            {HIGHLIGHTS.map((item) => (
              <li key={item} className='flex gap-3 text-sm'>
                <CheckCircle2
                  className='text-success mt-0.5 size-4 shrink-0'
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
