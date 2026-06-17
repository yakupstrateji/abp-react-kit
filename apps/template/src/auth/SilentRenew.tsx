import { useEffect } from 'react'
import { userManager } from './userManager'
export function SilentRenew() {
  useEffect(() => { userManager.signinSilentCallback().catch(() => {}) }, [])
  return null
}
