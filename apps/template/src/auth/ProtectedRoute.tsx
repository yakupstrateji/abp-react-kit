import { Navigate, Outlet } from '@tanstack/react-router'
import { useAuth, isSigningOut } from '@yakupsogut/abp-react-core'
import { Spinner } from '@/components/ui/Spinner'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Spinner label="Yetkilendiriliyor…" />
  }

  if (isSigningOut()) {
    return <Spinner label="Çıkış yapılıyor…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
