import { usePermission } from '@yakupsogut/abp-react-core'
import { ForbiddenPage } from '@/components/ForbiddenPage'

export function RequirePermission({ policy, children }: { policy: string; children?: React.ReactNode }) {
  const granted = usePermission(policy)
  return granted ? <>{children}</> : <ForbiddenPage />
}
