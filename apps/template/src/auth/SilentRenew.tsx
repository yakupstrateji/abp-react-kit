import { useEffect } from 'react'
import { userManager } from '@yakupsogut/abp-react-core'
export function SilentRenew() {
  useEffect(() => { userManager.signinSilentCallback().catch(() => {}) }, [])
  return null
}
