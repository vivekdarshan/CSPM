import { Link, useSearch } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import { USE_MOCK_API } from '@/lib/api/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Sign in</CardTitle>
          <CardDescription>
            Sign in to review your cloud security posture.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {USE_MOCK_API && (
            <div className='bg-muted text-muted-foreground flex gap-2 rounded-md p-3 text-xs'>
              <Info className='mt-px size-3.5 shrink-0' aria-hidden />
              <span>
                Demo mode: sign in with any email and a password of 7 or more
                characters.
              </span>
            </div>
          )}
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground w-full text-center text-sm'>
            New here?{' '}
            <Link
              to='/sign-up'
              className='text-foreground font-medium underline-offset-4 hover:underline'
            >
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
