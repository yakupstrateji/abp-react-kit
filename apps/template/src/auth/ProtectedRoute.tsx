import { Navigate, Outlet } from '@tanstack/react-router'
import { useAuth } from './useAuth'
import { isSigningOut } from './userManager'
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
