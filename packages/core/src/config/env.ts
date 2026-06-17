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
}

let _config: AbpReactConfig | null = null

export function configureClient(config: AbpReactConfig): void {
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
