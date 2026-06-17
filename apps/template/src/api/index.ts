/**
 * Wires the generated @hey-api/client-axios client to share the one axios
 * instance from httpClient (which already carries bearer-token, Accept-Language,
 * ABP-error-parsing and 401-retry interceptors).
 *
 * Import this module once at app bootstrap (bootstrap.tsx: `import '@/api'`).
 * Do NOT hand-edit files under src/api/generated/.
 * To regenerate: ensure backend is running at https://localhost:44334, then:
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED='0'; pnpm openapi-ts
 */
import { client } from './generated/client.gen'
import { axiosInstance } from './httpClient'

// Point the generated SDK at the shared axios instance that already has all
// interceptors (bearer token, Accept-Language, ABP error, 401 retry).
// The hey-api client detects that axiosInstance is not AxiosStatic (no `.Axios`
// property) and uses it directly without creating a new instance.
client.setConfig({
  axios: axiosInstance,
  throwOnError: true,
})

// Re-export everything from generated for convenient import by feature modules
export * from './generated'
export { client }
