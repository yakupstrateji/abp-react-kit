import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { RequirePermission } from './RequirePermission'
import * as usePermissionMod from '@yakupsogut/abp-react-core'

vi.mock('@yakupsogut/abp-react-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@yakupsogut/abp-react-core')>()
  return {
    ...actual,
    usePermission: vi.fn(),
  }
})

function buildRouter(granted: boolean) {
  vi.mocked(usePermissionMod.usePermission).mockReturnValue(granted)

  const rootRoute = createRootRoute({ component: () => <Outlet /> })

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin/users',
    component: () => (
      <RequirePermission policy="AbpIdentity.Users">
        <div>users content</div>
      </RequirePermission>
    ),
  })

  const routeTree = rootRoute.addChildren([testRoute])
  const history = createMemoryHistory({ initialEntries: ['/admin/users'] })
  return createRouter({ routeTree, history })
}

describe('RequirePermission', () => {
  it('renders child when permission is granted', async () => {
    const router = buildRouter(true)
    render(<RouterProvider router={router} />)
    await screen.findByText('users content')
    expect(screen.getByText('users content')).toBeInTheDocument()
  })

  it('renders ForbiddenPage when permission is denied', async () => {
    const router = buildRouter(false)
    render(<RouterProvider router={router} />)
    await screen.findByText(/yetkiniz yok/i)
    expect(screen.getByText(/yetkiniz yok/i)).toBeInTheDocument()
    expect(screen.queryByText('users content')).not.toBeInTheDocument()
  })
})
