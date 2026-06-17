import { http } from '../api/httpClient'

export interface AppConfig {
  currentUser: { id: string | null; userName: string | null; isAuthenticated: boolean; name?: string | null }
  currentTenant: { id: string | null; name: string | null; isAvailable: boolean }
  auth: { grantedPolicies: Record<string, boolean> }
  localization: {
    defaultResourceName: string
    currentCulture: { name: string; cultureName: string; displayName: string; twoLetterIsoLanguageName: string }
    languages: { cultureName: string; uiCultureName: string; displayName: string; twoLetterIsoLanguageName: string }[]
    values: Record<string, Record<string, string>>
  }
}

export const fetchAppConfig = () => http<AppConfig>('/api/abp/application-configuration')
