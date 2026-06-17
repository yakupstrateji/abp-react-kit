import { useEffect, useContext, type ReactNode } from 'react'
import i18next from 'i18next'
import { I18nextProvider, useTranslation, initReactI18next } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { AppConfigContext } from '@/app-config/AppConfigProvider'
import type { AppConfig } from '@/app-config/appConfig'
import { setCurrentCulture, getCurrentCulture } from './culture'

type LocalizationData = AppConfig['localization']

/** Two-letter codes of RTL languages */
const RTL_CODES = new Set(['ar', 'arc', 'dv', 'fa', 'ha', 'he', 'ks', 'ku', 'ps', 'ur', 'yi', 'sd', 'ug'])

function isRtlCulture(twoLetterCode: string): boolean {
  return RTL_CODES.has(twoLetterCode.toLowerCase())
}

// Create a dedicated i18next instance so it doesn't pollute the global singleton.
const i18nInstance = i18next.createInstance()

i18nInstance
  .use(initReactI18next)
  .init({
    // Language will be set dynamically when LocalizationProvider mounts.
    lng: getCurrentCulture(),
    fallbackLng: getCurrentCulture(),
    // ABP resource separator: 'AbpUi::Save' → ns=AbpUi, key=Save
    nsSeparator: '::',
    defaultNS: 'SchollApp',
    // Disable dot-notation key nesting so 'Menu:Users' is a literal key.
    keySeparator: false,
    returnNull: false,
    // Start with no resources; LocalizationProvider loads them from app-config.
    resources: {},
    interpolation: { escapeValue: false },
    // Don't init i18n asynchronously — we'll add resources in LocalizationProvider.
    initAsync: false,
  })

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const appConfig = useContext(AppConfigContext)
  const loc = appConfig?.localization

  const value: LocalizationData = loc ?? {
    defaultResourceName: 'SchollApp',
    currentCulture: { name: 'tr', cultureName: 'tr', displayName: 'Türkçe', twoLetterIsoLanguageName: 'tr' },
    languages: [],
    values: {},
  }

  // Load resource bundles from app-config localization values into i18next.
  useEffect(() => {
    const culture = value.currentCulture.cultureName || value.currentCulture.name || 'tr'
    const resourceValues = value.values ?? {}

    // Add each ABP resource as an i18next namespace for the current language.
    for (const [ns, translations] of Object.entries(resourceValues)) {
      i18nInstance.addResourceBundle(culture, ns, translations, true, true)
    }

    // Switch the active language.
    void i18nInstance.changeLanguage(culture)
  }, [value.currentCulture, value.values])

  // Set document dir and lang whenever culture changes.
  useEffect(() => {
    const culture = value.currentCulture
    const twoLetter =
      culture.twoLetterIsoLanguageName ||
      (culture.cultureName ?? '').split('-')[0] ||
      'tr'
    const dir = isRtlCulture(twoLetter) ? 'rtl' : 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = culture.cultureName || culture.name || 'tr'
  }, [value.currentCulture])

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
}

/**
 * Returns a localizer function L(key, fallback?).
 *
 * Key format accepted:
 *   'AbpUi::Save'          → namespace AbpUi,  i18next key Save
 *   'Dashboard'            → namespace SchollApp (defaultNS), i18next key Dashboard
 *   'SchollApp::Dashboard' → namespace SchollApp, i18next key Dashboard
 *
 * Provider-safe: when no resources are loaded for the key, returns fallback ?? key,
 * so test assertions on Turkish fallback strings continue to pass.
 */
export function useL(): (key: string, fallback?: string) => string {
  // useTranslation binds to the i18nInstance provided by I18nextProvider.
  const { t } = useTranslation(undefined, { i18n: i18nInstance })

  return (key: string, fallback?: string): string => {
    // i18next uses nsSeparator '::' so 'AbpUi::Save' automatically resolves
    // to namespace 'AbpUi' and key 'Save'.
    const result = t(key, { defaultValue: fallback ?? key })

    // If the resolved value equals the raw key (i18next returned it unchanged
    // because the key is missing), and a fallback was provided, return the fallback.
    if (result === key && fallback !== undefined) {
      return fallback
    }

    return result
  }
}

export function useLanguages() {
  const appConfig = useContext(AppConfigContext)
  const loc = appConfig?.localization
  const qc = useQueryClient()

  const languages = loc?.languages ?? []
  const current = loc?.currentCulture?.cultureName ?? getCurrentCulture()

  function change(culture: string): void {
    setCurrentCulture(culture)
    // Also update i18next language immediately.
    void i18nInstance.changeLanguage(culture)
    // Invalidate all queries so the app refetches in the new culture.
    void qc.invalidateQueries()
  }

  return { languages, current, change }
}
