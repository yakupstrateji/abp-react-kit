import type { User } from 'oidc-client-ts'
import { getAuthMode } from '../config/env'
import { createRedirectStrategy } from './redirectStrategy'
import { createPasswordStrategy } from './passwordStrategy'

/**
 * Pluggable authentication strategy. The two implementations (redirect = OIDC
 * Authorization Code + PKCE, password = ROPC) back the SAME useAuth() surface,
 * so the rest of the app never branches on auth mode.
 */
export interface AuthStrategy {
  /** Resolve the current (non-expired) user, or null. */
  getUser(): Promise<User | null>
  /** Bearer access token for outgoing API calls, or null when unauthenticated. */
  getAccessToken(): Promise<string | null>
  /** Subscribe to user changes (login / logout / renew / expiry). Returns an unsubscribe fn. */
  subscribe(cb: (user: User | null) => void): () => void
  /** Interactive login. Redirect mode → signinRedirect; password mode → throws. */
  login(tenantId?: string): Promise<void>
  /** Username/password login. Password mode only; redirect mode → throws. */
  passwordLogin(username: string, password: string, tenantId?: string): Promise<void>
  /** Renew the access token. Redirect → signinSilent; password → refresh_token grant. */
  renew(): Promise<void>
  /** Recover after renew() failed — called by the 401 interceptor. */
  recoverFromRenewFailure(): Promise<void>
  /** Sign out / clear the session. */
  logout(): Promise<void>
}

let _strategy: AuthStrategy | null = null

/** Lazily build the active strategy from the configured authMode (singleton). */
export function getAuthStrategy(): AuthStrategy {
  if (!_strategy) {
    _strategy = getAuthMode() === 'password' ? createPasswordStrategy() : createRedirectStrategy()
  }
  return _strategy
}

/**
 * FOR TESTING ONLY: inject a strategy (or pass null to reset so the next
 * getAuthStrategy() rebuilds from config). Not exported from the package barrel.
 */
export function _setAuthStrategyForTests(instance: AuthStrategy | null): void {
  _strategy = instance
}
