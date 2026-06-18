import type { User } from 'oidc-client-ts'
import { getUserManager, isSigningOut } from './userManager'
import type { AuthStrategy } from './strategy'

/**
 * Default strategy: OIDC Authorization Code + PKCE via oidc-client-ts. The
 * browser is redirected to the ABP login page; tokens + silent renew are managed
 * by the UserManager. Behavior is identical to the kit's original auth flow.
 */
export function createRedirectStrategy(): AuthStrategy {
  return {
    async getUser() {
      const u = await getUserManager().getUser()
      return u && !u.expired ? u : null
    },

    async getAccessToken() {
      const u = await getUserManager().getUser()
      return u?.access_token ?? null
    },

    subscribe(cb) {
      const events = getUserManager().events
      const onLoaded = (u: User) => cb(u)
      const onGone = () => cb(null)
      events.addUserLoaded(onLoaded)
      events.addUserUnloaded(onGone)
      // Reflect a lost session proactively instead of waiting for the next 401.
      events.addAccessTokenExpired(onGone)
      events.addSilentRenewError(onGone)
      return () => {
        events.removeUserLoaded(onLoaded)
        events.removeUserUnloaded(onGone)
        events.removeAccessTokenExpired(onGone)
        events.removeSilentRenewError(onGone)
      }
    },

    login(tenantId) {
      return tenantId
        ? getUserManager().signinRedirect({ extraQueryParams: { __tenant: tenantId } })
        : getUserManager().signinRedirect()
    },

    passwordLogin() {
      return Promise.reject(
        new Error(
          "@yakupsogut/abp-react-core: password login is not available in 'redirect' auth mode " +
            "(set authMode: 'password').",
        ),
      )
    },

    async renew() {
      await getUserManager().signinSilent()
    },

    recoverFromRenewFailure() {
      // Don't bounce to the IdP while a sign-out navigation is already underway.
      if (isSigningOut()) return Promise.resolve()
      return getUserManager().signinRedirect()
    },

    logout() {
      return getUserManager().signoutRedirect()
    },
  }
}
