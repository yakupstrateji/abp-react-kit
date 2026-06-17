import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'
import { userManager } from './userManager'

vi.mock('./userManager', () => ({
  userManager: { getUser: vi.fn(), signinRedirect: vi.fn(), signoutRedirect: vi.fn(),
    events: { addUserLoaded: vi.fn(), addUserUnloaded: vi.fn(), removeUserLoaded: vi.fn(), removeUserUnloaded: vi.fn() } },
  getAccessToken: vi.fn(),
}))

function Probe() { const { isAuthenticated, isLoading } = useAuth(); return <div>{isLoading ? 'loading' : isAuthenticated ? 'in' : 'out'}</div> }

describe('AuthProvider', () => {
  beforeEach(() => vi.clearAllMocks())
  it('reports anonymous when no user', async () => {
    ;(userManager.getUser as any).mockResolvedValue(null)
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument())
  })
  it('reports authenticated when a user exists', async () => {
    ;(userManager.getUser as any).mockResolvedValue({ access_token: 't', profile: { sub: '1' }, expired: false })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('in')).toBeInTheDocument())
  })
})
