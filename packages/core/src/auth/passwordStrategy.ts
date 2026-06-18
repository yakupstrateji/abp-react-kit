import axios from 'axios'
import { User } from 'oidc-client-ts'
import type { IdTokenClaims } from 'oidc-client-ts'
import { getConfig } from '../config/env'
import type { AuthStrategy } from './strategy'

const STORAGE_KEY = 'abp-react-core.password-user'

interface StoredSession {
  access_token: string
  refresh_token?: string
  id_token?: string
  token_type: string
  scope: string
  expires_at: number // unix seconds
  tenant_id?: string
  profile: Record<string, unknown>
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  id_token?: string
  token_type?: string
  expires_in?: number
  scope?: string
}

/** Decode a JWT payload (no verification — we only read claims for the profile). */
function decodeJwtPayload(jwt?: string): Record<string, unknown> {
  if (!jwt) return {}
  try {
    const part = jwt.split('.')[1]
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * Password (ROPC) strategy: a fully in-SPA username/password login that hits the
 * OpenIddict token endpoint directly. Opt-in via authMode: 'password'. The token
 * endpoint client deliberately bypasses the shared axiosInstance interceptors so
 * a failed /connect/token call never recurses into the 401-retry path.
 */
export function createPasswordStrategy(): AuthStrategy {
  const listeners = new Set<(user: User | null) => void>()
  // Raw client — NO shared interceptors (avoids 401-retry recursion).
  const tokenClient = axios.create()
  let refreshTimer: ReturnType<typeof setTimeout> | null = null
  let refreshPromise: Promise<void> | null = null

  function load(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as StoredSession) : null
    } catch {
      return null
    }
  }

  function save(session: StoredSession | null): void {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  }

  function toUser(s: StoredSession): User {
    return new User({
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      id_token: s.id_token,
      token_type: s.token_type,
      scope: s.scope,
      profile: s.profile as unknown as IdTokenClaims,
      expires_at: s.expires_at,
      session_state: null,
    })
  }

  function emit(user: User | null): void {
    for (const cb of listeners) cb(user)
  }

  function clearTimer(): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  function scheduleRefresh(expiresAt: number): void {
    clearTimer()
    // Renew 60s before expiry (lower-bounded so we never busy-loop).
    const delay = Math.max(expiresAt * 1000 - 60_000 - Date.now(), 1_000)
    refreshTimer = setTimeout(() => {
      void renew().catch(() => clearSession())
    }, delay)
  }

  function clearSession(): void {
    clearTimer()
    save(null)
    emit(null)
  }

  async function requestToken(
    body: Record<string, string>,
    tenantId?: string,
  ): Promise<StoredSession> {
    const c = getConfig()
    const params = new URLSearchParams({ client_id: c.clientId, scope: c.scope, ...body })
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' }
    if (tenantId) headers['__tenant'] = tenantId
    const res = await tokenClient.post<TokenResponse>(`${c.apiUrl}/connect/token`, params.toString(), {
      headers,
    })
    const data = res.data
    const expires_at = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600)
    const profile = decodeJwtPayload(data.id_token)
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      id_token: data.id_token,
      token_type: data.token_type ?? 'Bearer',
      scope: data.scope ?? c.scope,
      expires_at,
      tenant_id: tenantId,
      profile: Object.keys(profile).length ? profile : { sub: body.username ?? 'user' },
    }
  }

  function applySession(session: StoredSession): void {
    save(session)
    scheduleRefresh(session.expires_at)
    emit(toUser(session))
  }

  async function passwordLogin(
    username: string,
    password: string,
    tenantId?: string,
  ): Promise<void> {
    const session = await requestToken({ grant_type: 'password', username, password }, tenantId)
    applySession(session)
  }

  function renew(): Promise<void> {
    // Single-flight: concurrent 401s / a scheduled refresh share one request so
    // OpenIddict refresh-token rotation isn't raced into invalidation.
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const cur = load()
        if (!cur?.refresh_token) throw new Error('no refresh token')
        const session = await requestToken(
          { grant_type: 'refresh_token', refresh_token: cur.refresh_token },
          cur.tenant_id,
        )
        applySession(session)
      })().finally(() => {
        refreshPromise = null
      })
    }
    return refreshPromise
  }

  return {
    async getUser() {
      const s = load()
      if (!s) return null
      const u = toUser(s)
      if (!u.expired) {
        scheduleRefresh(s.expires_at)
        return u
      }
      // Expired on (re)load: try to refresh in the background if possible.
      if (s.refresh_token) void renew().catch(() => clearSession())
      else clearSession()
      return null
    },

    async getAccessToken() {
      // Return the stored token as-is; the 401 interceptor renews on demand.
      return load()?.access_token ?? null
    },

    subscribe(cb) {
      listeners.add(cb)
      return () => {
        listeners.delete(cb)
      }
    },

    login() {
      return Promise.reject(
        new Error(
          "@yakupsogut/abp-react-core: use loginWithPassword(username, password) in 'password' auth mode.",
        ),
      )
    },

    passwordLogin,
    renew,

    async recoverFromRenewFailure() {
      clearSession()
    },

    async logout() {
      clearSession()
    },
  }
}
