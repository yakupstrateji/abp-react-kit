# @strateji/template

The design half of abp-react-kit. Scaffold a new project with `npx @yakupsogut/create-abp-react my-app`, or copy this folder directly, then re-skin and wire it to your ABP backend.

## Origin

This template is scaffolded by `create-abp-react`. It was bootstrapped from `yakupstrateji/abp-react-kit/apps/template` via degit and is a standalone project — it does not need to stay inside the monorepo.

## What's in here

This app owns all styling and feature pages. Business logic (auth, OIDC, CRUD, i18n, httpClient) lives in `@yakupsogut/abp-react-core` — a **published npm package** (`^1.x`) you update independently.

## How env + core are wired

`src/lib/env.ts` reads VITE_* build-time vars (and optionally `public/dynamic-env.json` at runtime) and assembles an `AbpReactConfig` object. `src/main.tsx` calls `configureClient(config)` from core before anything else, then dynamically imports and mounts the app:

```ts
// src/main.tsx
import { configureClient } from '@yakupsogut/abp-react-core'
import { loadRuntimeConfig } from '@/lib/env'

loadRuntimeConfig().then(async (config) => {
  configureClient(config)
  const { mount } = await import('./bootstrap')
  mount()
})
```

`configureClient` must run before any auth or API call. Never import `bootstrap` (or anything that touches auth/httpClient) at the top level of `main.tsx`.

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

`tailwind-preset.js` maps every CSS token to a Tailwind utility so you can write `bg-primary`, `text-sidebar-fg`, etc. Add new tokens in `index.css` and the corresponding mapping in the preset to extend the design system.

## Branding config (`src/app/branding.ts`)

`Branding` / `NavEntry` are NOT exported from `@yakupsogut/abp-react-core`. The `Branding` interface and `NavEntry` type are defined locally in `src/app/branding.ts` and `src/app/navigation.ts` respectively — you own and edit them directly.

```ts
// src/app/branding.ts — edit this file directly
export const branding: Branding = {
  appName: 'My App',          // shown in sidebar header and page title
  toasterTheme: 'system',     // Sonner theme: 'light' | 'dark' | 'system'
  // logo is an optional ReactNode; to pass JSX, rename branding.ts -> branding.tsx
}
```

## Navigation config (`src/app/navigation.ts`)

Define all routes and the sidebar menu in one array. Both the route tree and the sidebar are generated from this config. `NavEntry` is defined locally — it is NOT exported from `@yakupsogut/abp-react-core`:

```ts
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

**Runtime override (opt-in)** — `public/dynamic-env.json` (camelCase keys, read at startup without a rebuild). **Not shipped by default** — create it only when you need it (e.g. Docker):

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

> ⚠️ **It overrides `.env` at runtime.** If this file exists, its values win over build-time `VITE_*` (`loadRuntimeConfig()` does `Object.assign(env, json)`). Great for Docker, but a common footgun — if you edited `.env` and "nothing changed", a stale `dynamic-env.json` is the usual cause. The kit no longer ships one, so by default `.env` is the single source of truth.

### Regenerate the API client

After changing your ABP backend, regenerate typed API hooks:

```bash
npm run openapi-ts
# or, inside the monorepo:
pnpm openapi-ts
```

Output goes to `src/api/generated/`. These files are excluded from ESLint and should be committed as-is.

> Local ABP backends use a self-signed dev cert; `openapi-ts` tolerates it automatically (no `NODE_TLS_REJECT_UNAUTHORIZED` needed). Set `NODE_TLS_REJECT_UNAUTHORIZED=1` yourself to enforce strict TLS against a backend with a valid certificate.

## In-memory example features

The template ships with **Students** and **Classes** feature pages that use an in-memory store — no backend required. They demonstrate the `CrudService` + `useCrud` pattern for a new entity. You have two options:

**Replace with a real backend-wired service** (follow `features/admin/users`):
1. Create a service using `CrudService` + `http` from core.
2. Update `useStudents` / `useClasses` to call the real service.
3. Add the generated API types from `src/api/generated/`.

**Delete them** if you do not need example entities:
1. Delete `src/features/students/` and `src/features/classes/`.
2. Remove their entries from `src/app/navigation.ts`.

## Core dependency

`@yakupsogut/abp-react-core` is consumed as a **versioned npm dependency** (`^1.0.0` in `package.json`). To update to the latest minor/patch:

```bash
npm update @yakupsogut/abp-react-core
```

For a MAJOR version bump: edit the version range in `package.json`, run `npm install`, and follow the changelog for any breaking API changes.

Inside the monorepo, pnpm resolves core from the local `packages/core` workspace — `npm update` is not needed during monorepo development.

Core exports: `AuthProvider`, `useAuth`, `AppConfigProvider`, `usePermission`, `axiosInstance`, `http`, `useCrud`, `CrudService`, `LocalizationProvider`, `useL`, `configureClient`, `getConfig`, `AbpReactConfig`.

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # type-check + production build -> dist/
npm run test         # run all 50 tests (Vitest + Testing Library + MSW)
npm run lint         # ESLint (generated files excluded)
npm run openapi-ts   # regenerate src/api/generated/ from backend Swagger
```

## Manual verification

The full app requires a running ABP backend. Start it at https://localhost:44334, then:

```bash
npm run dev
```

Open http://localhost:5173, log in as `admin` / `1q2w3E*`, and exercise the admin CRUD pages. Trust the dev cert first if needed: `dotnet dev-certs https --trust`.

The Students and Classes pages work immediately with no backend — they use an in-memory store.

Note: the kit was previously runtime-verified (OIDC login, Users CRUD, re-skin); the controller re-runs this verification after the distribution tasks are complete.
