import type { ReactNode } from 'react'

export interface Branding {
  appName: string
  logo?: ReactNode
  toasterTheme: 'light' | 'dark' | 'system'
}

export const branding: Branding = {
  appName: 'My App',
  toasterTheme: 'light',
}
