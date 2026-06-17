/**
 * Runtime-configurable environment object.
 *
 * Values are initialised from build-time VITE_* replacements so that
 * local dev and Vitest work with no network request. At startup,
 * loadRuntimeConfig() fetches /dynamic-env.json and Object.assign's
 * the values in-place so all consumers (userManager, httpClient, …)
 * see the runtime values — provided they are imported AFTER the await.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  clientId: import.meta.env.VITE_CLIENT_ID as string,
  redirectUri: import.meta.env.VITE_REDIRECT_URI as string,
  silentRedirectUri: import.meta.env.VITE_SILENT_REDIRECT_URI as string,
  postLogoutUri: import.meta.env.VITE_POST_LOGOUT_URI as string,
  scope: import.meta.env.VITE_SCOPE as string,
}

/**
 * Fetch /dynamic-env.json and merge its values into `env`.
 * On any failure (network error, missing file, parse error) the function
 * swallows the error and leaves the build-time fallback values intact.
 * This function must never throw.
 */
export async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await fetch('/dynamic-env.json')
    if (!response.ok) return
    const data = await response.json()
    Object.assign(env, data)
  } catch {
    // Swallow — keep build-time fallback values
  }
}
