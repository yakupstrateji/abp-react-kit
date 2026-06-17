import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { CallbackPage } from '@/auth/CallbackPage'
import { SilentRenew } from '@/auth/SilentRenew'
import { LoggedOutPage } from '@/auth/LoggedOutPage'
import { LoginPage } from '@/auth/LoginPage'
import { AdminLayout } from '@/layout/AdminLayout'
import { RequirePermission } from '@/auth/RequirePermission'
import { NotFoundPage } from '@/components/NotFoundPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { UsersPage } from '@/features/admin/users/UsersPage'
import { RolesPage } from '@/features/admin/roles/RolesPage'
import { TenantsPage } from '@/features/admin/tenants/TenantsPage'
import { SettingsPage } from '@/features/admin/settings/SettingsPage'
import { ProfilePage } from '@/features/account/ProfilePage'
import { StudentsPage } from '@/features/students/StudentsPage'
import { ClassesPage } from '@/features/classes/ClassesPage'

// Pages are eagerly imported (no per-route lazy/Suspense). The admin page
// chunks are tiny, so code-splitting them added a "Yükleniyor…" flash on every
// navigation for negligible bundle savings — eager loading makes navigation instant.

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

// Dashboard
const dashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: DashboardPage,
})

// Users — permission guard as component wrapper
const usersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/users',
  component: () => (
    <RequirePermission policy="AbpIdentity.Users">
      <UsersPage />
    </RequirePermission>
  ),
})

// Roles
const rolesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/roles',
  component: () => (
    <RequirePermission policy="AbpIdentity.Roles">
      <RolesPage />
    </RequirePermission>
  ),
})

// Tenants
const tenantsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/tenants',
  component: () => (
    <RequirePermission policy="AbpTenantManagement.Tenants">
      <TenantsPage />
    </RequirePermission>
  ),
})

// Settings
const settingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/settings',
  component: () => (
    <RequirePermission policy="SettingManagement.Emailing">
      <SettingsPage />
    </RequirePermission>
  ),
})

// Students
const studentsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/students',
  component: () => (
    <RequirePermission policy="SchollApp.Students">
      <StudentsPage />
    </RequirePermission>
  ),
})

// Classes
const classesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/classes',
  component: () => (
    <RequirePermission policy="SchollApp.Classes">
      <ClassesPage />
    </RequirePermission>
  ),
})

// Profile
const profileRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/profile',
  component: ProfilePage,
})

// Build route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  callbackRoute,
  silentRenewRoute,
  loggedOutRoute,
  protectedRoute.addChildren([
    adminLayoutRoute.addChildren([
      dashboardRoute,
      usersRoute,
      rolesRoute,
      tenantsRoute,
      settingsRoute,
      studentsRoute,
      classesRoute,
      profileRoute,
    ]),
  ]),
])

export const router = createRouter({ routeTree })

// Type augmentation for full type-safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
