export interface Subscription {
  plan: 'free' | 'basic' | 'standard' | 'premium'
  status: 'trial' | 'active' | 'expired' | 'cancelled'
  trial_ends_at: string | null
  expires_at: string | null
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  role: 'admin' | 'subscriber'
  is_active: boolean
  email_verified_at: string | null
  subscription: Subscription
  created_at: string
}

export interface AuthResponse {
  user: User
  token: string
}
