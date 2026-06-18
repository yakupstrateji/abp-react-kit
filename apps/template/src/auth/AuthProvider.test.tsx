import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserManager } from 'oidc-client-ts'
import { AuthProvider, useAuth } from '@yakupsogut/abp-react-core'
// Direct internal import to inject the mock instance via _setUserManagerForTests
import { _setUserManagerForTests } from '../../../../packages/core/src/auth/userManager'

// Mock oidc-client-ts at the lowest level so that new UserManager(...)
// returns a controlled mock object. getUserManager() in core calls this
// constructor lazily; _setUserManagerForTests() ensures the mock is in
// place before AuthProvider mounts so both the event subscriptions and
// getUser() return mock-controlled values.
vi.mock('oidc-client-ts', () => {
  const mockEvents = {
    addUserLoaded: vi.fn(),
    addUserUnloaded: vi.fn(),
    removeUserLoaded: vi.fn(),
    removeUserUnloaded: vi.fn(),
    addAccessTokenExpired: vi.fn(),
    addSilentRenewError: vi.fn(),
    removeAccessTokenExpired: vi.fn(),
    removeSilentRenewError: vi.fn(),
  }
  const mockInstance = {
    getUser: vi.fn(),
    signinRedirect: vi.fn(),
    signoutRedirect: vi.fn(),
    events: mockEvents,
  }
  // Must be a real class / function so `new UserManager(...)` works.
  // Always returns the same mockInstance — every caller (getUserManager()
  // in core, the test) shares one object so spies stay in sync.
  function UserManager() { return mockInstance }
  function WebStorageStateStore() {}
  return { UserManager, WebStorageStateStore }
})

// Obtain the shared mockInstance by calling the mocked constructor.
const mockUserManager = new (UserManager as any)()

function Probe() {
  const { isAuthenticated, isLoading } = useAuth()
  return <div>{isLoading ? 'loading' : isAuthenticated ? 'in' : 'out'}</div>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    // Reset all mock implementations and call history for a clean slate.
    vi.resetAllMocks()
    // Inject the mock instance so getUserManager() returns it immediately
    // (avoids triggering the real UserManager constructor on first use).
    _setUserManagerForTests(mockUserManager as unknown as UserManager)
  })

  it('reports anonymous when no user', async () => {
    mockUserManager.getUser.mockResolvedValue(null)
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument())
  })

  it('reports authenticated when a user exists', async () => {
    mockUserManager.getUser.mockResolvedValue({ access_token: 't', profile: { sub: '1' }, expired: false })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('in')).toBeInTheDocument())
  })

  it('transitions out→in when userLoaded event fires', async () => {
    // Initial getUser returns null → Probe shows "out"
    mockUserManager.getUser.mockResolvedValue(null)
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument())

    // Retrieve the callback registered with addUserLoaded and invoke it
    const onLoaded = mockUserManager.events.addUserLoaded.mock.calls[0][0]
    act(() => onLoaded({ access_token: 't', profile: { sub: '1' }, expired: false }))
    await waitFor(() => expect(screen.getByText('in')).toBeInTheDocument())
  })

  it('transitions in→out when userUnloaded event fires', async () => {
    // Initial getUser returns a user → Probe shows "in"
    mockUserManager.getUser.mockResolvedValue({ access_token: 't', profile: { sub: '1' }, expired: false })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('in')).toBeInTheDocument())

    // Retrieve the callback registered with addUserUnloaded and invoke it
    const onUnloaded = mockUserManager.events.addUserUnloaded.mock.calls[0][0]
    act(() => onUnloaded())
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument())
  })

  it('transitions in→out when the access token expires', async () => {
    // Regression: a failed/expired silent renew must clear the authenticated state
    // instead of leaving stale "in" UI until the next 401.
    mockUserManager.getUser.mockResolvedValue({ access_token: 't', profile: { sub: '1' }, expired: false })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('in')).toBeInTheDocument())

    const onExpired = mockUserManager.events.addAccessTokenExpired.mock.calls[0][0]
    act(() => onExpired())
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument())
  })
})
