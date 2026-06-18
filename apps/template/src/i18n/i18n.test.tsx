import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppConfigContext } from '@yakupsogut/abp-react-core'
import { LocalizationProvider, useL } from '@yakupsogut/abp-react-core'

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
      defaultResourceName: 'App',
      currentCulture: { name: 'en', cultureName: 'en', displayName: 'English', twoLetterIsoLanguageName: 'en' },
      languages: [],
      values: {
        App: { Dashboard: 'Dashboard EN' },
        AbpUi: { Save: 'Save' },
      },
    }

    const { result } = renderHook(() => useL(), { wrapper: makeWrapper(localization) })
    const L = result.current

    expect(L('App::Dashboard', 'Gösterge Paneli')).toBe('Dashboard EN')
    expect(L('AbpUi::Save', 'Kaydet')).toBe('Save')
  })

  it('resolves a bare key (no resource prefix) via the default resource namespace', () => {
    const localization = {
      defaultResourceName: 'App',
      currentCulture: { name: 'en', cultureName: 'en', displayName: 'English', twoLetterIsoLanguageName: 'en' },
      languages: [],
      values: {
        App: { Dashboard: 'Dashboard EN' },
      },
    }

    const { result } = renderHook(() => useL(), { wrapper: makeWrapper(localization) })
    const L = result.current

    // The template references its own keys WITHOUT a resource prefix; they resolve
    // under defaultResourceName ('App' here; the backend's resource name at runtime).
    expect(L('Dashboard', 'Gösterge Paneli')).toBe('Dashboard EN')
  })

  it('returns fallback when key is absent from values', () => {
    const localization = {
      defaultResourceName: 'App',
      currentCulture: { name: 'en', cultureName: 'en', displayName: 'English', twoLetterIsoLanguageName: 'en' },
      languages: [],
      values: { App: {} },
    }

    const { result } = renderHook(() => useL(), { wrapper: makeWrapper(localization) })
    const L = result.current

    expect(L('App::MissingKey', 'Türkçe metin')).toBe('Türkçe metin')
  })

  it('returns key itself when no fallback and key missing', () => {
    const localization = {
      defaultResourceName: 'App',
      currentCulture: { name: 'en', cultureName: 'en', displayName: 'English', twoLetterIsoLanguageName: 'en' },
      languages: [],
      values: { App: {} },
    }

    const { result } = renderHook(() => useL(), { wrapper: makeWrapper(localization) })
    const L = result.current

    expect(L('App::NoFallback')).toBe('App::NoFallback')
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

    expect(L('App::SomeKey', 'Türkçe')).toBe('Türkçe')
    expect(L('App::NoFallback')).toBe('App::NoFallback')
  })
})
