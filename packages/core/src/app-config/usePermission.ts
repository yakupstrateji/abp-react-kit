import { useContext } from 'react'
import { AppConfigContext } from './AppConfigProvider'

export function usePermission(policy: string): boolean {
  const ctx = useContext(AppConfigContext)
  return !!ctx?.grantedPolicies[policy]
}

export function useCurrentUser() { return useContext(AppConfigContext)?.currentUser ?? null }
