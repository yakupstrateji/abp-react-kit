// Culture store — persists the user's selected UI culture to localStorage.
// Key: schollapp.culture. Falls back to browser language (first segment) or 'tr'.
// getCurrentCulture() is synchronous so it can be called from httpClient.ts without React.

const STORAGE_KEY = 'schollapp.culture'

let _current: string = (() => {
  try {
    return (
      localStorage.getItem(STORAGE_KEY) ??
      navigator.language.split('-')[0] ??
      'tr'
    )
  } catch {
    return 'tr'
  }
})()

export function getCurrentCulture(): string {
  return _current
}

export function setCurrentCulture(culture: string): void {
  _current = culture
  try {
    localStorage.setItem(STORAGE_KEY, culture)
  } catch {
    // ignore storage errors
  }
}
