import { useEffect } from 'react'
import { getUserManager } from '@yakupsogut/abp-react-core'
export function SilentRenew() {
  useEffect(() => { getUserManager().signinSilentCallback().catch(() => {}) }, [])
  return null
}
