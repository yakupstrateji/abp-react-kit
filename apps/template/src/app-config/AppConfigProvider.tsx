import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchAppConfig } from './appConfig'
import type { AppConfig } from './appConfig'
import { useAuth } from '@/auth/useAuth'
import { Spinner } from '@/components/ui/Spinner'

interface AppConfigCtx {
  currentUser: AppConfig['currentUser'] | undefined
  currentTenant: { id: string | null; name: string | null } | null
  grantedPolicies: Record<string, boolean>
  isLoading: boolean
  localization?: AppConfig['localization']
}
export const AppConfigContext = createContext<AppConfigCtx | null>(null)

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { data, isLoading, isError } = useQuery({ queryKey: ['app-config'], queryFn: fetchAppConfig, enabled: isAuthenticated })
  useEffect(() => {
    if (isError) toast.error('Uygulama yapılandırması yüklenemedi')
  }, [isError])
  if (isAuthenticated && isLoading) return <Spinner label="Yükleniyor…" /* Loading — before i18n is available */ />
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
