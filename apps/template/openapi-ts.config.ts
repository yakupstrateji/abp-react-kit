import { defineConfig } from '@hey-api/openapi-ts'

const baseUrl = process.env.OPENAPI_INPUT ?? process.env.VITE_API_URL ?? 'https://localhost:44334'
const swaggerPath = '/swagger/v1/swagger.json'
const input = baseUrl.endsWith(swaggerPath) ? baseUrl : `${baseUrl.replace(/\/$/, '')}${swaggerPath}`

export default defineConfig({
  input,
  output: { path: 'src/api/generated' },
  plugins: ['@hey-api/client-axios'],
})
