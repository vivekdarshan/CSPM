/** Mock timestamps are relative to page load so the UI always looks "live". */
export const now = Date.now()
export const HOUR = 60 * 60 * 1000
export const DAY = 24 * HOUR
export const hoursAgo = (h: number) => new Date(now - h * HOUR).toISOString()
export const daysAgo = (d: number) => new Date(now - d * DAY).toISOString()
