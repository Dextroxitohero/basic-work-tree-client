import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthSession, AuthUser } from '@/api/auth'
import type { Permission } from '@/api/types'

export type { Permission } from '@/api/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  /** Epoch ms en que expira el token; null si no hay sesión. */
  expiresAt: number | null
  setSession: (session: AuthSession) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      expiresAt: null,
      setSession: (session) =>
        set({
          token: session.access_token,
          user: session.user,
          expiresAt: Date.now() + session.expires_in * 1000,
        }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, expiresAt: null }),
    }),
    {
      name: 'auth',
      // sessionStorage: la sesión no sobrevive al cerrar la pestaña.
      storage: createJSONStorage(() => sessionStorage),
      // Una sesión ya expirada se descarta al hidratar, antes de que salga ninguna petición.
      onRehydrateStorage: () => (state) => {
        if (state?.expiresAt && state.expiresAt <= Date.now()) state.logout()
      },
    },
  ),
)

/** Solo decide qué se muestra. La autorización real la hace la API. */
export function useCan(permission: Permission): boolean {
  return useAuthStore((s) => s.user?.permissions.includes(permission) ?? false)
}
