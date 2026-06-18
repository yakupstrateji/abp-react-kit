/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL ?? 'https://localhost:44334'),
      'import.meta.env.VITE_CLIENT_ID': JSON.stringify(env.VITE_CLIENT_ID ?? 'MyApp_React'),
      'import.meta.env.VITE_REDIRECT_URI': JSON.stringify(env.VITE_REDIRECT_URI ?? 'http://localhost:5173/auth/callback'),
      'import.meta.env.VITE_SILENT_REDIRECT_URI': JSON.stringify(env.VITE_SILENT_REDIRECT_URI ?? 'http://localhost:5173/auth/silent-renew'),
      'import.meta.env.VITE_POST_LOGOUT_URI': JSON.stringify(env.VITE_POST_LOGOUT_URI ?? 'http://localhost:5173/auth/logged-out'),
      'import.meta.env.VITE_SCOPE': JSON.stringify(env.VITE_SCOPE ?? 'openid profile email roles offline_access MyApp'),
      'import.meta.env.VITE_AUTH_MODE': JSON.stringify(env.VITE_AUTH_MODE ?? 'redirect'),
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      server: { deps: { inline: ['oidc-client-ts'] } },
    },
  }
})