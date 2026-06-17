import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { getConfig } from '../config/env'

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

export const getAccessToken = async () => (await getUserManager().getUser())?.access_token ?? null

// Synchronous logout guard (see original rationale): prevents ProtectedRoute from
// re-logging-in during the sign-out navigation.
let _signingOut = false
export const isSigningOut = () => _signingOut

export async function signOut(): Promise<void> {
  _signingOut = true
  await getUserManager().signoutRedirect()
}
