import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN_COOKIE = 'cspm_access_token'
const USER_COOKIE = 'cspm_user'

export type UserRole = 'owner' | 'admin' | 'analyst' | 'viewer'

export interface AuthUser {
  id: string
  name: string
  email: string
  organization: string
  role: UserRole
  /** Session expiry, epoch ms */
  exp: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

function readCookieJson<T>(name: string): T | null {
  const raw = getCookie(name)
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(raw)) as T
  } catch {
    return null
  }
}

function writeCookieJson(name: string, value: unknown) {
  setCookie(name, encodeURIComponent(JSON.stringify(value)))
}

export const useAuthStore = create<AuthState>()((set) => {
  const initUser = readCookieJson<AuthUser>(USER_COOKIE)
  const initToken = readCookieJson<string>(ACCESS_TOKEN_COOKIE) ?? ''
  const expired = initUser ? initUser.exp < Date.now() : false

  return {
    auth: {
      user: expired ? null : initUser,
      setUser: (user) =>
        set((state) => {
          if (user) writeCookieJson(USER_COOKIE, user)
          else removeCookie(USER_COOKIE)
          return { ...state, auth: { ...state.auth, user } }
        }),
      accessToken: expired ? '' : initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          writeCookieJson(ACCESS_TOKEN_COOKIE, accessToken)
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN_COOKIE)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN_COOKIE)
          removeCookie(USER_COOKIE)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
    },
  }
})

export function isAuthenticated() {
  const { accessToken, user } = useAuthStore.getState().auth
  return Boolean(accessToken && user && user.exp > Date.now())
}

export function getInitials(name: string) {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('') || '?'
  )
}
