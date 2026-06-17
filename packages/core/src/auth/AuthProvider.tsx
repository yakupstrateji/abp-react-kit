import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'oidc-client-ts'
import { getUserManager, signOut } from './userManager'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  loginToTenant: (tenantId?: string) => Promise<void>
  logout: () => Promise<void>
}
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userManager = getUserManager()
    userManager.getUser().then((u) => { setUser(u && !u.expired ? u : null); setIsLoading(false) })
    const onLoaded = (u: User) => setUser(u)
    const onUnloaded = () => setUser(null)
    userManager.events.addUserLoaded(onLoaded)
    userManager.events.addUserUnloaded(onUnloaded)
    return () => { userManager.events.removeUserLoaded(onLoaded); userManager.events.removeUserUnloaded(onUnloaded) }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    loginToTenant: (tenantId?: string) =>
      tenantId
        ? getUserManager().signinRedirect({ extraQueryParams: { __tenant: tenantId } })
        : getUserManager().signinRedirect(),
    login: () => getUserManager().signinRedirect(),
    logout: () => signOut(),
  }), [user, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
