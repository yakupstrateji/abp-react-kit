import type { AbpReactConfig } from '@yakupsogut/abp-react-core'

// Consumer-side: reads Vite build-time VITE_* (with vite.config defaults), then
// loadRuntimeConfig() optionally overrides from /dynamic-env.json at runtime.
export const env: AbpReactConfig = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  clientId: import.meta.env.VITE_CLIENT_ID as string,
  redirectUri: import.meta.env.VITE_REDIRECT_URI as string,
  silentRedirectUri: import.meta.env.VITE_SILENT_REDIRECT_URI as string,
  postLogoutUri: import.meta.env.VITE_POST_LOGOUT_URI as string,
  scope: import.meta.env.VITE_SCOPE as string,
  // 'redirect' (default — ABP login page) or 'password' (in-SPA username/password form)
  authMode: (import.meta.env.VITE_AUTH_MODE as 'redirect' | 'password' | undefined) ?? 'redirect',
}

export async function loadRuntimeConfig(): Promise<AbpReactConfig> {
  try {
    const r = await fetch('/dynamic-env.json')
    if (r.ok) Object.assign(env, await r.json())
  } catch {
    // keep build-time values
  }
  return env
}
