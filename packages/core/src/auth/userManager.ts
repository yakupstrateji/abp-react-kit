import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { getConfig } from '../config/env'
import { getAuthStrategy } from './strategy'

let _userManager: UserManager | null = null

/** Lazily create the OIDC UserManager on first use (after configureClient()). */
export function getUserManager(): UserManager {
  if (!_userManager) {
    const c = getConfig()
    _userManager = new UserManager({
      authority: c.apiUrl,
      client_id: c.clientId,
      redirect_uri: c.redirectUri,
      silent_redirect_uri: c.silentRedirectUri,
      post_logout_redirect_uri: c.postLogoutUri,
      response_type: 'code',
      scope: c.scope,
      automaticSilentRenew: true,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    })
  }
  return _userManager
}

/**
 * FOR TESTING ONLY: inject a mock UserManager instance (or pass null to reset
 * so the next getUserManager() call creates a fresh instance via the constructor).
 * Not exported from the package barrel (index.ts).
 */
export function _setUserManagerForTests(instance: UserManager | null): void {
  _userManager = instance
}

// Delegates to the active auth strategy (redirect → oidc user; password → ROPC).
export const getAccessToken = async (): Promise<string | null> => getAuthStrategy().getAccessToken()

// Synchronous logout guard (see original rationale): prevents ProtectedRoute from
// re-logging-in during the sign-out navigation.
let _signingOut = false
export const isSigningOut = () => _signingOut

export async function signOut(): Promise<void> {
  _signingOut = true
  try {
    await getAuthStrategy().logout()
  } finally {
    // Redirect mode navigates away (page unloads); password mode does not. Either
    // way, reset the guard so a failed/no-nav sign-out doesn't wedge the UI in the
    // "signing out…" spinner forever.
    _signingOut = false
  }
}
