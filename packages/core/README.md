# @yakupsogut/abp-react-core

Style-free, brand-free, backend-free React logic layer for [ABP Framework](https://abp.io) backends.

Provides: OIDC PKCE auth, ABP application-configuration + permission checks, an axios HTTP client with 401 silent-renew retry, headless CRUD hook, and i18n helpers.

This package is designed to be used with the **abp-react-kit** template, which wires everything up automatically.

---

## Install

```
npm i @yakupsogut/abp-react-core
```

---

## Required setup — call before any auth or API use

```ts
import { configureClient } from '@yakupsogut/abp-react-core'

configureClient({
  apiUrl:           'https://your-abp-api.example.com',
  clientId:         'YourClient',
  redirectUri:      'https://your-app.example.com/auth-callback',
  silentRedirectUri: 'https://your-app.example.com/silent-renew.html',
  postLogoutUri:    'https://your-app.example.com',
  scope:            'openid profile email YourApi',
})
```

Call `configureClient` once at application startup (e.g. in `main.tsx`) before rendering your React tree.

---

## Public API

| Export | Description |
|---|---|
| `configureClient(config)` | Initialize auth + API settings (required at startup) |
| `AuthProvider` | React context provider for OIDC auth state |
| `useAuth()` | Hook — `{ user, isAuthenticated, login, logout, ... }` |
| `AppConfigProvider` | Loads ABP application-configuration into context |
| `usePermission(name)` | Returns `true` if the current user has the named permission |
| `useCurrentUser()` | Returns the current ABP user info from app-config |
| `LocalizationProvider` | Wires up i18next from ABP localization resources |
| `useL(key, group?)` | Localization hook — returns translated string |
| `useLanguages()` | Returns available ABP language list |
| `useCrud(service, messages?)` | Headless CRUD hook (list, create, update, delete) |
| `axiosInstance` | Shared axios instance (Bearer + Accept-Language + 401-retry) |
| `http<T>(path, init?)` | Typed wrapper over `axiosInstance` |
| `getUserManager()` | Returns the `oidc-client-ts` UserManager |
| `getAccessToken()` | Returns current access token string or null |
| `signOut()` | Trigger OIDC sign-out |
| `AbpError` | Typed ABP error class (message + validationErrors) |
| `getCurrentCulture()` | Returns active culture string (e.g. `"en"`) |
| `setCurrentCulture(c)` | Set active culture |
