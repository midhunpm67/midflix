import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'
import { ACTIVE_SUBSCRIPTION_STATUSES } from '@/lib/constants'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: User) => void
  isAdmin: () => boolean
  hasActiveSubscription: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('auth_token', token)
        set({ user, token, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('auth_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (user) => set({ user }),

      isAdmin: () => get().user?.role === 'admin',

      hasActiveSubscription: () => {
        const status = get().user?.subscription?.status
        return ACTIVE_SUBSCRIPTION_STATUSES.includes(status as 'trial' | 'active')
      },
    }),
    {
      name: 'midflix-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
