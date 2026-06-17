import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth, userManager } from '@strateji/abp-react-core'

// Mock oidc-client-ts at the lowest level so the AuthProvider (in core) picks
// up the fake userManager instance. vi.mock('@strateji/abp-react-core') would
// only replace the re-export; AuthProvider's internal relative import of
// ./userManager would still point to the real module. Mocking oidc-client-ts
// intercepts the UserManager constructor itself, which is what userManager.ts
// in core instantiates.
vi.mock('oidc-client-ts', () => {
  const mockEvents = {
    addUserLoaded: vi.fn(),
    addUserUnloaded: vi.fn(),
    removeUserLoaded: vi.fn(),
    removeUserUnloaded: vi.fn(),
  }
  const mockInstance = {
    getUser: vi.fn(),
    signinRedirect: vi.fn(),
    signoutRedirect: vi.fn(),
    events: mockEvents,
  }
  // Must be a real class / function so `new UserManager(...)` works
  function UserManager() { return mockInstance }
  function WebStorageStateStore() {}
  return { UserManager, WebStorageStateStore }
})

function Probe() {
  const { isAuthenticated, isLoading } = useAuth()
  return <div>{isLoading ? 'loading' : isAuthenticated ? 'in' : 'out'}</div>
}

describe('AuthProvider', () => {
  beforeEach(() => vi.clearAllMocks())
  it('reports anonymous when no user', async () => {
    ;(userManager.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument())
  })
  it('reports authenticated when a user exists', async () => {
    ;(userManager.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({ access_token: 't', profile: { sub: '1' }, expired: false })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('in')).toBeInTheDocument())
  })
})
