export const PLANS = {
  free: { label: 'Free', price: 0 },
  basic: { label: 'Basic', price: 199 },
  standard: { label: 'Standard', price: 499 },
  premium: { label: 'Premium', price: 799 },
} as const

export const ACTIVE_SUBSCRIPTION_STATUSES = ['trial', 'active'] as const

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
