import { type SVGProps } from 'react'
import { APP_CONFIG } from '@/config/app'
import { cn } from '@/lib/utils'

/** Shield-with-check mark. */
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      height='24'
      width='24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn('size-6', className)}
      {...props}
    >
      <title>{APP_CONFIG.name}</title>
      <path d='M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z' />
      <path d='m8.5 12 2.5 2.5 4.5-5' />
    </svg>
  )
}
