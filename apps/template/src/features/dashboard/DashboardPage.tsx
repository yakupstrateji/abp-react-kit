import { useQuery } from '@tanstack/react-query'
import { http } from '@/api/httpClient'
import { useCurrentUser } from '@/app-config/usePermission'
import { Spinner } from '@/components/ui/Spinner'
import { useL } from '@/i18n/i18n'

export function DashboardPage() {
  const L = useL()
  const currentUser = useCurrentUser()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-users-count'],
    queryFn: () => http<{ totalCount: number }>('/api/identity/users?MaxResultCount=1'),
  })

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{L('SchollApp::Dashboard', 'Dashboard')}</h1>
      {currentUser && (
        <p className="text-gray-600">
          {L('SchollApp::Welcome', 'Hoş geldiniz')},{' '}
          <span className="font-semibold">{currentUser.name ?? currentUser.userName}</span>
        </p>
      )}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm max-w-xs">
        <h2 className="text-sm font-medium text-gray-500">{L('SchollApp::TotalUsers', 'Toplam Kullanıcı')}</h2>
        {isLoading ? (
          <Spinner />
        ) : (
          <p className="mt-2 text-3xl font-bold text-gray-900">{data?.totalCount ?? '—'}</p>
        )}
      </div>
    </div>
  )
}
