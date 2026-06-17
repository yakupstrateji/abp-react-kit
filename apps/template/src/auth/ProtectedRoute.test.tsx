import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { ProtectedRoute } from './ProtectedRoute'
import * as useAuthMod from '@strateji/abp-react-core'
import { isSigningOut } from '@strateji/abp-react-core'

vi.mock('@strateji/abp-react-core', async (importActual) => {
  const actual = await importActual<typeof import('@strateji/abp-react-core')>()
  return { ...actual, isSigningOut: vi.fn(() => false) }
})

function buildRouter(initialPath: string, authState: ReturnType<typeof useAuthMod.useAuth>) {
  vi.spyOn(useAuthMod, 'useAuth').mockReturnValue(authState)

  const rootRoute = createRootRoute({ component: () => <Outlet /> })

  const protectedRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'protected',
    component: ProtectedRoute,
  })

  const secretRoute = createRoute({
    getParentRoute: () => protectedRoute,
    path: '/secret',
    component: () => <div>secret</div>,
  })

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <div>login page</div>,
  })

  const routeTree = rootRoute.addChildren([
    protectedRoute.addChildren([secretRoute]),
    loginRoute,
  ])

  const history = createMemoryHistory({ initialEntries: [initialPath] })

  return createRouter({ routeTree, history })
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    ;(isSigningOut as ReturnType<typeof vi.fn>).mockReturnValue(false)
  })

  it('renders children when authenticated', async () => {
    const router = buildRouter('/secret', {
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginToTenant: vi.fn(),
      logout: vi.fn(),
    })
    render(<RouterProvider router={router} />)
    // TanStack Router is async — wait for routing to settle
    await screen.findByText('secret')
    expect(screen.getByText('secret')).toBeInTheDocument()
  })

  it('redirects to /login when anonymous', async () => {
    const router = buildRouter('/secret', {
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginToTenant: vi.fn(),
      logout: vi.fn(),
    })
    render(<RouterProvider router={router} />)
    await screen.findByText('login page')
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('does NOT navigate while signing out (prevents logout re-login race)', async () => {
    ;(isSigningOut as ReturnType<typeof vi.fn>).mockReturnValue(true)
    const router = buildRouter('/secret', {
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginToTenant: vi.fn(),
      logout: vi.fn(),
    })
    render(<RouterProvider router={router} />)
    // Should show signing-out spinner, not the login page
    await screen.findByText('Çıkış yapılıyor…')
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
    expect(screen.getByText('Çıkış yapılıyor…')).toBeInTheDocument()
  })
})
