interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_REDIRECT_URI: string
  readonly VITE_SILENT_REDIRECT_URI: string
  readonly VITE_POST_LOGOUT_URI: string
  readonly VITE_SCOPE: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
