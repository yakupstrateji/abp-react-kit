import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { CallbackPage } from '@/auth/CallbackPage'
import { SilentRenew } from '@/auth/SilentRenew'
import { LoggedOutPage } from '@/auth/LoggedOutPage'
import { LoginPage } from '@/auth/LoginPage'
import { AdminLayout } from '@/layout/AdminLayout'
import { RequirePermission } from '@/auth/RequirePermission'
import { NotFoundPage } from '@/components/NotFoundPage'
import { navigation } from '@/app/navigation'

// Root route — renders all children directly
const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => <NotFoundPage />,
})

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: CallbackPage,
})

const silentRenewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/silent-renew',
  component: SilentRenew,
})

const loggedOutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/logged-out',
  component: LoggedOutPage,
})

// Pathless protected layout route (auth guard)
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedRoute,
})

// Pathless admin layout route (header + sidebar shell)
const adminLayoutRoute = createRoute({
  getParentRoute: () => protectedRoute,
  id: 'admin-layout',
  component: AdminLayout,
})

// Admin child routes derived from navigation config
const featureRoutes = navigation.map((entry) => {
  const Component = entry.component
  const permission = entry.permission // const → TS narrows to string inside closure, no ! needed
  return createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: entry.path,
    component: permission
      ? () => (
          <RequirePermission policy={permission}>
            <Component />
          </RequirePermission>
        )
      : () => <Component />,
  })
})

// Build route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  callbackRoute,
  silentRenewRoute,
  loggedOutRoute,
  protectedRoute.addChildren([
    adminLayoutRoute.addChildren(featureRoutes),
  ]),
])

export const router = createRouter({ routeTree })

// Type augmentation for full type-safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
