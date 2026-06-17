import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/auth/AuthProvider'
import { AppConfigProvider } from '@/app-config/AppConfigProvider'
import { LocalizationProvider } from '@/i18n/i18n'
import { router } from '@/routes'
import './index.css'
import '@/api' // applies client base config

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Keep list/detail data fresh for 30s so navigating away and back doesn't
      // refetch (and flash a loading state) on every page switch.
      staleTime: 30_000,
    },
  },
})

export function mount(): void {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppConfigProvider>
            <LocalizationProvider>
              <RouterProvider router={router} />
              <Toaster richColors position="top-right" theme="light" />
            </LocalizationProvider>
          </AppConfigProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  )
}
