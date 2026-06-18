import { defineConfig } from '@hey-api/openapi-ts'
import { loadEnv } from 'vite'

// Local ABP backends serve a self-signed dev cert; openapi-ts fetches the Swagger
// doc over HTTPS, which Node rejects by default (→ "fetch failed"). Tolerate it for
// THIS codegen step only. Set NODE_TLS_REJECT_UNAUTHORIZED=1 yourself to enforce
// strict TLS (e.g. when generating against a backend with a valid certificate).
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED == null) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

// The openapi-ts CLI does NOT auto-load .env files (only Vite does), so read them
// here too — otherwise VITE_API_URL set in .env would be ignored and codegen would
// silently fall back to the default backend URL.
const fileEnv = loadEnv('development', process.cwd(), '')
const baseUrl =
  process.env.OPENAPI_INPUT ??
  process.env.VITE_API_URL ??
  fileEnv.VITE_API_URL ??
  'https://localhost:44334'
const swaggerPath = '/swagger/v1/swagger.json'
const input = baseUrl.endsWith(swaggerPath) ? baseUrl : `${baseUrl.replace(/\/$/, '')}${swaggerPath}`

export default defineConfig({
  input,
  output: { path: 'src/api/generated' },
  plugins: ['@hey-api/client-axios'],
})
