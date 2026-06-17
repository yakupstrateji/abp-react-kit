import { useEffect } from 'react'
import { userManager } from '@strateji/abp-react-core'
export function SilentRenew() {
  useEffect(() => { userManager.signinSilentCallback().catch(() => {}) }, [])
  return null
}
