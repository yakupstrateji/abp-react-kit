import { Link } from '@tanstack/react-router'
import { useL } from '@yakupsogut/abp-react-core'

export function ForbiddenPage() {
  const L = useL()
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-6xl font-bold text-gray-300">403</span>
      <h1 className="text-2xl font-semibold text-gray-700">{L('SchollApp::AccessDenied', 'Erişim Reddedildi')}</h1>
      <p className="text-gray-500">{L('SchollApp::AccessDeniedMessage', 'Bu sayfaya erişim yetkiniz yok.')}</p>
      <Link
        to="/"
        className="mt-2 inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {L('SchollApp::BackToHome', 'Ana sayfaya dön')}
      </Link>
    </div>
  )
}
