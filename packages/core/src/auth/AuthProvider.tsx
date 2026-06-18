import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'oidc-client-ts'
import { signOut } from './userManager'
import { getAuthStrategy } from './strategy'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  loginToTenant: (tenantId?: string) => Promise<void>
  /** Username/password login (password auth mode). Rejects in redirect mode. */
  loginWithPassword: (username: string, password: string, tenantId?: string) => Promise<void>
  logout: () => Promise<void>
}
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const strategy = getAuthStrategy()
    const apply = (u: User | null) => setUser(u && !u.expired ? u : null)
    // Subscribe first so a renew triggered by getUser() can't emit before we listen.
    const unsubscribe = strategy.subscribe(apply)
    strategy.getUser().then((u) => {
      apply(u)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user && !user.expired,
      isLoading,
      loginToTenant: (tenantId?: string) => getAuthStrategy().login(tenantId),
      login: () => getAuthStrategy().login(),
      loginWithPassword: (username: string, password: string, tenantId?: string) =>
        getAuthStrategy().passwordLogin(username, password, tenantId),
      logout: () => signOut(),
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
