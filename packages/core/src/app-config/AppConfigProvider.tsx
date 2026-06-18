import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAppConfig } from './appConfig'
import type { AppConfig } from './appConfig'
import { useAuth } from '../auth/useAuth'

export interface AppConfigContextValue {
  currentUser: AppConfig['currentUser'] | undefined
  currentTenant: { id: string | null; name: string | null } | null
  grantedPolicies: Record<string, boolean>
  isLoading: boolean
  localization?: AppConfig['localization']
}
export const AppConfigContext = createContext<AppConfigContextValue | null>(null)

export function AppConfigProvider({
  children,
  fallback = null,
  onError,
}: {
  children: ReactNode
  fallback?: ReactNode
  onError?: () => void
}) {
  const { isAuthenticated } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['app-config'],
    queryFn: fetchAppConfig,
    enabled: isAuthenticated,
  })
  useEffect(() => {
    if (isError) onError?.()
  }, [isError, onError])
  if (isAuthenticated && isLoading) return <>{fallback}</>
  return (
    <AppConfigContext.Provider
      value={{
        currentUser: data?.currentUser,
        currentTenant: data?.currentTenant ?? null,
        grantedPolicies: data?.auth.grantedPolicies ?? {},
        isLoading,
        localization: data?.localization,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  )
}

export function useCurrentTenant(): { id: string | null; name: string | null } | null {
  return useContext(AppConfigContext)?.currentTenant ?? null
}
