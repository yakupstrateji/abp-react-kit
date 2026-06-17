import { render, screen, waitFor, act } from '@testing-library/react'
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

  it('transitions out→in when userLoaded event fires', async () => {
    // Initial getUser returns null → Probe shows "out"
    ;(userManager.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument())

    // Retrieve the callback registered with addUserLoaded and invoke it
    const onLoaded = (userManager.events.addUserLoaded as ReturnType<typeof vi.fn>).mock.calls[0][0]
    act(() => onLoaded({ access_token: 't', profile: { sub: '1' }, expired: false }))
    await waitFor(() => expect(screen.getByText('in')).toBeInTheDocument())
  })

  it('transitions in→out when userUnloaded event fires', async () => {
    // Initial getUser returns a user → Probe shows "in"
    ;(userManager.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({ access_token: 't', profile: { sub: '1' }, expired: false })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('in')).toBeInTheDocument())

    // Retrieve the callback registered with addUserUnloaded and invoke it
    const onUnloaded = (userManager.events.addUserUnloaded as ReturnType<typeof vi.fn>).mock.calls[0][0]
    act(() => onUnloaded())
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument())
  })
})
