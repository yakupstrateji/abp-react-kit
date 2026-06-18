/**
 * Runtime configuration for @yakupsogut/abp-react-core.
 * The consuming app MUST call configureClient(...) once at startup (before any
 * auth/API use), passing its backend URL, OIDC client id and redirect URIs.
 * The core is bundler-agnostic: it never reads import.meta.env itself.
 */
export interface AbpReactConfig {
  apiUrl: string
  clientId: string
  redirectUri: string
  silentRedirectUri: string
  postLogoutUri: string
  scope: string
  /**
   * Login UX strategy:
   * - 'redirect' (default): OIDC Authorization Code + PKCE — the browser is sent
   *   to the ABP server-rendered login page.
   * - 'password': an in-SPA username/password form using the OAuth2 Resource
   *   Owner Password Credentials (ROPC) grant. Opt-in; see docs for limitations.
   */
  authMode?: 'redirect' | 'password'
}

let _config: AbpReactConfig | null = null

const ALWAYS_REQUIRED = ['apiUrl', 'clientId', 'scope'] as const
const REDIRECT_REQUIRED = ['redirectUri', 'silentRedirectUri', 'postLogoutUri'] as const

export function configureClient(config: AbpReactConfig): void {
  // Fail fast on missing/empty fields instead of surfacing cryptic OIDC/axios
  // errors later (e.g. authority: undefined, baseURL: undefined).
  const required =
    config.authMode === 'password'
      ? [...ALWAYS_REQUIRED]
      : [...ALWAYS_REQUIRED, ...REDIRECT_REQUIRED]
  const missing = required.filter((k) => !config[k])
  if (missing.length) {
    throw new Error(
      '@yakupsogut/abp-react-core: configureClient() received missing/empty fields: ' +
        missing.join(', ') +
        '. Check your VITE_* env vars / public/dynamic-env.json.',
    )
  }
  _config = config
}

export function getConfig(): AbpReactConfig {
  if (!_config) {
    throw new Error(
      '@yakupsogut/abp-react-core: configureClient() must be called at app startup ' +
        'before using auth or API. Pass { apiUrl, clientId, redirectUri, silentRedirectUri, postLogoutUri, scope }.',
    )
  }
  return _config
}

/** Active auth mode, defaulting to 'redirect' when unset. */
export function getAuthMode(): 'redirect' | 'password' {
  return _config?.authMode === 'password' ? 'password' : 'redirect'
}
