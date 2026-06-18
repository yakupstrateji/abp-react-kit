import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios so the strategy's raw token-endpoint client is fully controllable.
const post = vi.fn()
vi.mock('axios', () => ({
  default: { create: () => ({ post }) },
}))

import { configureClient } from '../config/env'
import { createPasswordStrategy } from './passwordStrategy'

function makeIdToken(claims: Record<string, unknown>): string {
  const enc = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${enc({ alg: 'none' })}.${enc(claims)}.`
}

describe('passwordStrategy (ROPC)', () => {
  beforeEach(() => {
    post.mockReset()
    localStorage.clear()
    configureClient({
      apiUrl: 'https://api.test',
      clientId: 'Test_React',
      redirectUri: 'http://localhost:5173/auth/callback',
      silentRedirectUri: 'http://localhost:5173/auth/silent-renew',
      postLogoutUri: 'http://localhost:5173/auth/logged-out',
      scope: 'openid profile offline_access Test',
      authMode: 'password',
    })
  })

  it('logs in via grant_type=password (with __tenant) and stores the token', async () => {
    post.mockResolvedValue({
      data: {
        access_token: 'AT',
        refresh_token: 'RT',
        token_type: 'Bearer',
        expires_in: 3600,
        id_token: makeIdToken({ sub: 'u1', name: 'admin' }),
      },
    })
    const s = createPasswordStrategy()
    const seen: (unknown)[] = []
    s.subscribe((u) => seen.push(u))

    await s.passwordLogin('admin', '1q2w3E*', 'tenant-1')

    expect(post).toHaveBeenCalledTimes(1)
    const [url, body, cfg] = post.mock.calls[0] as [string, string, { headers: Record<string, string> }]
    expect(url).toBe('https://api.test/connect/token')
    expect(body).toContain('grant_type=password')
    expect(body).toContain('username=admin')
    expect(body).toContain('client_id=Test_React')
    expect(cfg.headers['__tenant']).toBe('tenant-1')

    expect(await s.getAccessToken()).toBe('AT')
    const u = await s.getUser()
    expect(u?.access_token).toBe('AT')
    expect(u?.profile?.name).toBe('admin')
    expect(seen.at(-1)).not.toBeNull()
  })

  it('renews via grant_type=refresh_token and single-flights concurrent renews', async () => {
    post.mockResolvedValueOnce({ data: { access_token: 'AT1', refresh_token: 'RT1', expires_in: 3600 } })
    const s = createPasswordStrategy()
    await s.passwordLogin('admin', 'pw')

    post.mockResolvedValueOnce({ data: { access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 } })
    await Promise.all([s.renew(), s.renew()])

    const refreshCalls = (post.mock.calls as [string, string, unknown][]).filter((c) =>
      c[1].includes('grant_type=refresh_token'),
    )
    expect(refreshCalls).toHaveLength(1)
    expect(refreshCalls[0][1]).toContain('refresh_token=RT1')
    expect(await s.getAccessToken()).toBe('AT2')
  })

  it('clears the session on logout', async () => {
    post.mockResolvedValue({ data: { access_token: 'AT', refresh_token: 'RT', expires_in: 3600 } })
    const s = createPasswordStrategy()
    const seen: (unknown)[] = []
    s.subscribe((u) => seen.push(u))

    await s.passwordLogin('a', 'b')
    await s.logout()

    expect(await s.getAccessToken()).toBeNull()
    expect(await s.getUser()).toBeNull()
    expect(seen.at(-1)).toBeNull()
  })

  it('rejects the interactive login() entry point in password mode', async () => {
    const s = createPasswordStrategy()
    await expect(s.login()).rejects.toThrow(/loginWithPassword/)
  })
})
