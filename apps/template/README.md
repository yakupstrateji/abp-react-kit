# @strateji/template

The design half of abp-react-kit. Copy this app into your project and re-skin it for your brand.

## What's in here

This app owns all styling and feature pages. Business logic (auth, OIDC, CRUD, i18n, httpClient) lives in `@strateji/abp-react-core` — a dependency you keep updated independently.

## Re-skinning

### CSS tokens (`src/index.css`)

Every color, radius, and sidebar dimension is a CSS custom property. Edit the `:root` block to re-skin with zero Tailwind config changes:

```css
:root {
  /* Brand color — any hsl triple */
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;

  /* Sidebar */
  --sidebar-bg: 222.2 47.4% 11.2%;
  --sidebar-fg: 215 20.2% 65.1%;
  --sidebar-active-bg: 217.2 91.2% 59.8%;
  --sidebar-active-fg: 210 40% 98%;
  --sidebar-hover-bg: 217.2 32.6% 17.5%;

  /* Surface / border / radius */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
  /* ... more tokens in the file */
}
```

Dark mode overrides go in `.dark { ... }` in the same file.

### Tailwind preset (`tailwind-preset.js`)

`apps/template/tailwind-preset.js` maps every CSS token to a Tailwind utility so you can write `bg-primary`, `text-sidebar-fg`, etc. Add new tokens in `index.css` and the corresponding mapping in the preset to extend the design system.

## Branding config (`src/app/branding.ts`)

`BrandingConfig` / `NavEntry` are NOT exported from `@strateji/abp-react-core`. The `Branding` interface and `NavEntry` type are defined locally in `src/app/branding.ts` and `src/app/navigation.ts` respectively — you own and edit them directly.

```ts
// src/app/branding.ts — edit this file directly
// Branding interface is defined here: { appName: string; logo?: ReactNode; toasterTheme: 'light' | 'dark' | 'system' }
import type { ReactNode } from 'react'

export interface Branding {
  appName: string
  logo?: ReactNode
  toasterTheme: 'light' | 'dark' | 'system'
}

export const branding: Branding = {
  appName: 'My App',          // shown in sidebar header and page title
  toasterTheme: 'system',     // Sonner theme: 'light' | 'dark' | 'system'
  // logo is an optional ReactNode; to pass JSX, rename branding.ts → branding.tsx
  // logo: React.createElement('img', { src: '/logo.svg', alt: 'My App' }),
}
```

## Navigation config (`src/app/navigation.ts`)

Define all routes and the sidebar menu in one array. Both the route tree and the sidebar are generated from this config. `NavEntry` is defined locally in `src/app/navigation.ts` — it is NOT exported from `@strateji/abp-react-core`:

```ts
// src/app/navigation.ts — edit this file directly
import type { ComponentType } from 'react'

export interface NavEntry {
  path: string
  labelKey: string          // i18n key e.g. 'App::Menu:Dashboard'
  fallbackLabel: string     // shown when i18n key is not yet loaded
  permission?: string       // optional ABP permission string
  component: ComponentType
  showInMenu?: boolean      // defaults to true
  exact?: boolean
}

export const navigation: NavEntry[] = [
  { path: '/', labelKey: 'App::Menu:Dashboard', fallbackLabel: 'Dashboard', component: DashboardPage, exact: true },
  { path: '/admin/users', labelKey: 'App::Menu:Users', fallbackLabel: 'Users', permission: 'AbpIdentity.Users', component: UsersPage },
]
```

`permission` is optional. When set, the sidebar item is hidden for users who lack that ABP permission string.

## Backend wiring

### Environment variables

There are **two separate mechanisms with different key schemas**:

**Build-time** — `.env.local` (git-ignored), uses `VITE_*` names exactly as defined in `vite.config.ts`:

```env
VITE_API_URL=https://localhost:44334
VITE_CLIENT_ID=YourApp_React
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_SILENT_REDIRECT_URI=http://localhost:5173/auth/silent-renew
VITE_POST_LOGOUT_URI=http://localhost:5173/auth/logged-out
VITE_SCOPE=openid profile email roles offline_access YourApi
```

**Runtime override** — `public/dynamic-env.json` (camelCase keys, read at startup without a rebuild):

```json
{
  "apiUrl": "https://localhost:44334",
  "clientId": "YourApp_React",
  "redirectUri": "http://localhost:5173/auth/callback",
  "silentRedirectUri": "http://localhost:5173/auth/silent-renew",
  "postLogoutUri": "http://localhost:5173/auth/logged-out",
  "scope": "openid profile email roles offline_access YourApi"
}
```

`dynamic-env.json` values override `.env` at runtime — useful for Docker deployments where you can mount the file without rebuilding.

### Regenerate the API client

After changing your ABP backend, regenerate typed API hooks:

```bash
pnpm openapi-ts
```

Output goes to `src/api/generated/`. These files are excluded from ESLint and should be committed as-is.

## Core dependency

`@strateji/abp-react-core` is consumed via a **workspace dependency** (`workspace:*`) — the template and core live together inside the abp-react-kit monorepo. Logic updates (auth, CRUD, i18n) flow in by pulling the monorepo and re-running `pnpm install`:

```bash
git pull            # pick up upstream core changes
pnpm install        # re-link workspace packages
pnpm -r build       # verify everything still builds
```

> **Note:** Publishing `@strateji/abp-react-core` to npm as a standalone versioned package is a deliberate follow-up task (out of current scope). Until then, keep the template and core together in the monorepo — `pnpm update @strateji/abp-react-core` against a published tarball will not work because the current package exports raw TypeScript source.

Core exports: `AuthProvider`, `useAuth`, `AppConfigProvider`, `usePermission`, `axiosInstance`, `http`, `useCrud`, `CrudService`, `LocalizationProvider`, `useL`, `env`, `loadRuntimeConfig`.

## Commands

```bash
pnpm dev          # Vite dev server at http://localhost:5173
pnpm build        # type-check + production build -> dist/
pnpm test         # run all 50 tests (Vitest + Testing Library + MSW)
pnpm lint         # ESLint (generated files excluded)
pnpm openapi-ts   # regenerate src/api/generated/ from backend Swagger
```

## Manual verification

The full app requires a running ABP backend. Start it at https://localhost:44334, then:

```bash
pnpm dev
```

Open http://localhost:5173, log in as `admin` / `1q2w3E*`, and exercise the admin CRUD pages. Trust the dev cert first if needed: `dotnet dev-certs https --trust`.

Note: live re-skin (editing `--primary` in `src/index.css` and confirming colors update) was not CI-verified — it requires the dev server running and a browser.
