import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Mock mode is on until a backend exists. Set VITE_USE_MOCK_API=false and
 * VITE_API_URL to point the app at a real API without touching any screens.
 */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
})

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Simulated network latency for mock responses. */
export function mockDelay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(value)), ms)
  )
}
