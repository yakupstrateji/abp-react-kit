import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppConfigContext } from '@strateji/abp-react-core'
import { LocalizationProvider, useL } from './i18n'

function makeWrapper(localization?: any) {
  const fakeAppConfig = localization
    ? { currentUser: null, grantedPolicies: {}, isLoading: false, localization }
    : null

  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = new QueryClient()
    return (
      <QueryClientProvider client={qc}>
        <AppConfigContext.Provider value={fakeAppConfig as any}>
          <LocalizationProvider>{children}</LocalizationProvider>
        </AppConfigContext.Provider>
      </QueryClientProvider>
    )
  }
}

describe('useL', () => {
  it('returns value from values when present', () => {
    const localization = {
      defaultResourceName: 'SchollApp',
      currentCulture: { name: 'en', cultureName: 'en', displayName: 'English', twoLetterIsoLanguageName: 'en' },
      languages: [],
      values: {
        SchollApp: { Dashboard: 'Dashboard EN' },
        AbpUi: { Save: 'Save' },
      },
    }

    const { result } = renderHook(() => useL(), { wrapper: makeWrapper(localization) })
    const L = result.current

    expect(L('SchollApp::Dashboard', 'Gösterge Paneli')).toBe('Dashboard EN')
    expect(L('AbpUi::Save', 'Kaydet')).toBe('Save')
  })

  it('returns fallback when key is absent from values', () => {
    const localization = {
      defaultResourceName: 'SchollApp',
      currentCulture: { name: 'en', cultureName: 'en', displayName: 'English', twoLetterIsoLanguageName: 'en' },
      languages: [],
      values: { SchollApp: {} },
    }

    const { result } = renderHook(() => useL(), { wrapper: makeWrapper(localization) })
    const L = result.current

    expect(L('SchollApp::MissingKey', 'Türkçe metin')).toBe('Türkçe metin')
  })

  it('returns key itself when no fallback and key missing', () => {
    const localization = {
      defaultResourceName: 'SchollApp',
      currentCulture: { name: 'en', cultureName: 'en', displayName: 'English', twoLetterIsoLanguageName: 'en' },
      languages: [],
      values: { SchollApp: {} },
    }

    const { result } = renderHook(() => useL(), { wrapper: makeWrapper(localization) })
    const L = result.current

    expect(L('SchollApp::NoFallback')).toBe('SchollApp::NoFallback')
  })

  it('is safe when used outside LocalizationProvider (no context)', () => {
    function Wrapper({ children }: { children: ReactNode }) {
      const qc = new QueryClient()
      return (
        <QueryClientProvider client={qc}>
          <AppConfigContext.Provider value={null}>
            <LocalizationProvider>{children}</LocalizationProvider>
          </AppConfigContext.Provider>
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useL(), { wrapper: Wrapper })
    const L = result.current

    expect(L('SchollApp::SomeKey', 'Türkçe')).toBe('Türkçe')
    expect(L('SchollApp::NoFallback')).toBe('SchollApp::NoFallback')
  })
})
