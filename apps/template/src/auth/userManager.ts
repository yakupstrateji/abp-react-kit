import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { env } from '@/lib/env'

export const userManager = new UserManager({
  authority: env.apiUrl,
  client_id: env.clientId,
  redirect_uri: env.redirectUri,
  silent_redirect_uri: env.silentRedirectUri,
  post_logout_redirect_uri: env.postLogoutUri,
  response_type: 'code',
  scope: env.scope,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})

export const getAccessToken = async () => (await userManager.getUser())?.access_token ?? null

// Synchronous logout guard. signoutRedirect() internally removes the local user
// (firing UserUnloaded -> isAuthenticated=false) BEFORE it navigates to the ABP
// end-session endpoint. Without this flag, ProtectedRoute's effect reacts to the
// anonymous state by calling signinRedirect(), which races with / preempts the
// sign-out navigation and silently re-logs-in against the still-valid ABP cookie.
let _signingOut = false
export const isSigningOut = () => _signingOut

export async function signOut(): Promise<void> {
  _signingOut = true
  await userManager.signoutRedirect()
}
