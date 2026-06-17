# abp-react-kit

A pnpm monorepo that turns a React SPA into a reusable kit for ABP Framework backends.

## What is this?

abp-react-kit gives you two things:

- **`packages/core` — `@yakupsogut/abp-react-core`** (published to npm): Style-free, brand-free, backend-free React logic. Covers OIDC PKCE auth, ABP app-config + `usePermission`, `httpClient` with 401-silent-renew-retry, headless `useCrud`, i18n `useL`, and runtime env injection via `configureClient`.
- **`apps/template` — `@strateji/template`**: Owns all design. Contains shadcn `components/ui`, tokenized `index.css` + `tailwind-preset.js`, `layout/`, `features/` (admin CRUD wired to a real ABP backend, plus students + classes in-memory example features), the backend-specific `src/api/generated`, and the two configuration files `app/branding.ts` and `app/navigation.ts`.

The template depends on core as a versioned npm package (`@yakupsogut/abp-react-core ^1.x`). In the monorepo pnpm resolves core from the local `packages/core` workspace during development; consumers who scaffold with `create-abp-react` install it from npm.

## Monorepo layout

```
abp-react-kit/
  packages/
    core/                  @yakupsogut/abp-react-core  (published to npm)
      src/
        auth/              OIDC PKCE, AuthProvider, useAuth
        app-config/        ABP /api/abp/application-configuration, usePermission
        api/               httpClient (Axios), 401 silent-renew-retry interceptor, AbpError
        crud/              useCrud headless hook, CrudService, CrudMessages
        i18n/              LocalizationProvider, useL, culture (localStorage)
        config/            configureClient, getConfig, AbpReactConfig type
        index.ts           public barrel
    create-abp-react/      npx @yakupsogut/create-abp-react scaffolding CLI
  apps/
    template/              @strateji/template  (design + features — copy this for your project)
      tailwind-preset.js   Tailwind preset that maps CSS tokens to utility classes
      src/
        lib/env.ts         Consumer env reading: VITE_* + loadRuntimeConfig()
        main.tsx           loadRuntimeConfig() -> configureClient(config) -> mount()
        app/
          branding.ts      App name, optional logo (ReactNode), toaster theme
          navigation.ts    All routes + sidebar menu in one place
        components/ui/     shadcn components (Button, Dialog, Table...)
        layout/            AdminLayout, Header, Sidebar
        features/
          admin/           Users, Roles, Tenants, Settings, Features — wired to ABP backend
          students/        IN-MEMORY EXAMPLE — no backend required
          classes/         IN-MEMORY EXAMPLE — no backend required
        api/generated/     openapi-ts output — regenerate from your backend
        index.css          CSS custom-property tokens (--primary, --sidebar-*, ...)
  docs/
    PUBLISHING.md          How to publish a new core version + CLI
```

## Core vs Template — what lives where

| Concern | lives in |
|---|---|
| OIDC login / logout / silent renew | `@yakupsogut/abp-react-core` |
| ABP app-config fetch + permission check | `@yakupsogut/abp-react-core` |
| Axios client + 401 auto-retry | `@yakupsogut/abp-react-core` |
| Generic headless CRUD hook | `@yakupsogut/abp-react-core` |
| i18n setup + `useL` | `@yakupsogut/abp-react-core` |
| Runtime env bootstrap (`configureClient`) | `@yakupsogut/abp-react-core` |
| Design tokens, CSS, Tailwind | `apps/template` |
| shadcn component library | `apps/template` |
| Admin layout, sidebar, header | `apps/template` |
| ABP admin CRUD feature pages | `apps/template` |
| In-memory example features (Students, Classes) | `apps/template` |
| Backend-specific generated API client | `apps/template` |
| Branding config (name, logo) | `apps/template` |
| Navigation/routing config | `apps/template` |
| Consumer env reading (VITE_* / dynamic-env.json) | `apps/template/src/lib/env.ts` |

## Consumer workflow

### Step 1 — Scaffold a new project

**Recommended:** use the CLI (requires the public GitHub repo to be live):

```bash
npx @yakupsogut/create-abp-react my-app
cd my-app
```

**Fallback (degit, equivalent to what the CLI does):**

```bash
npx degit yakupstrateji/abp-react-kit/apps/template my-app
cd my-app
```

Either way you get a standalone project folder with `@yakupsogut/abp-react-core ^1.x` as a real npm dependency.

### Step 2 — Install dependencies

```bash
npm install
```

This pulls `@yakupsogut/abp-react-core` from npm (no monorepo needed in your project).

### Step 3 — Point at your ABP backend

Set environment variables. There are **two separate mechanisms with different key schemas**:

**Build-time** — `.env.local` (git-ignored), uses `VITE_*` names from `vite.config.ts`:

```env
VITE_API_URL=https://localhost:44334
VITE_CLIENT_ID=MyApp_React
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_SILENT_REDIRECT_URI=http://localhost:5173/auth/silent-renew
VITE_POST_LOGOUT_URI=http://localhost:5173/auth/logged-out
VITE_SCOPE=openid profile email roles offline_access MyApi
```

**Runtime override** — `public/dynamic-env.json` (camelCase keys, read at startup without a rebuild):

```json
{
  "apiUrl": "https://localhost:44334",
  "clientId": "MyApp_React",
  "redirectUri": "http://localhost:5173/auth/callback",
  "silentRedirectUri": "http://localhost:5173/auth/silent-renew",
  "postLogoutUri": "http://localhost:5173/auth/logged-out",
  "scope": "openid profile email roles offline_access MyApi"
}
```

`dynamic-env.json` values override `.env` at runtime — useful for Docker deployments where you can mount the file without rebuilding.

`src/lib/env.ts` reads these values and passes them to core via `configureClient(config)` in `src/main.tsx`. You own `env.ts` — extend it to add any extra env your project needs.

### Step 4 — Regenerate the API client

```bash
npm run openapi-ts
```

Reads your backend's Swagger (`VITE_API_URL/swagger/v1/swagger.json`) and writes typed hooks into `src/api/generated/`. Run this after changing ABP endpoints.

### Step 5 — Start the dev server

```bash
npm run dev
```

Open http://localhost:5173, log in with your ABP credentials.

### Step 6 — Re-skin via CSS tokens and Tailwind preset

Edit `src/index.css`. Every color, radius, and sidebar measurement is a CSS custom property:

```css
:root {
  --primary: 221.2 83.2% 53.3%;     /* hsl values — change to your brand */
  --sidebar-bg: 222.2 47.4% 11.2%;
  --sidebar-active-fg: 210 40% 98%;
  /* ... */
}
```

The `tailwind-preset.js` at the project root maps these tokens to Tailwind utility classes — no Tailwind config changes needed for a re-skin.

### Step 7 — Configure branding and navigation

`src/app/branding.ts` — set your app name and Sonner toaster theme. The file exports a `branding` object typed by the local `Branding` interface (`{ appName: string; logo?: ReactNode; toasterTheme: 'light' | 'dark' | 'system' }`):

```ts
// src/app/branding.ts  (types defined here — NOT imported from core)
export const branding: Branding = {
  appName: 'My ABP App',
  toasterTheme: 'light',     // 'light' | 'dark' | 'system'
  // logo is an optional ReactNode; to pass JSX, rename branding.ts -> branding.tsx
}
```

`src/app/navigation.ts` — define every route and sidebar menu entry in one place. `NavEntry` is defined in this file, NOT in core:

```ts
export const navigation: NavEntry[] = [
  { path: '/', labelKey: 'App::Menu:Dashboard', fallbackLabel: 'Dashboard', component: DashboardPage, exact: true },
  { path: '/admin/users', labelKey: 'App::Menu:Users', fallbackLabel: 'Users', permission: 'AbpIdentity.Users', component: UsersPage },
]
```

Routes and sidebar are both generated from this array. No separate router file to maintain.

### Step 8 — Handle the in-memory example features

The template ships with two example features — **Students** and **Classes** — that use an in-memory store (no backend required). They exist to show how to wire `CrudService` + `useCrud` for a new entity. You have two options:

**Replace with a real backend-wired service** (follow the `features/admin/users` pattern):
1. Create a real service using `CrudService` with `http` (the axios instance from core).
2. Update `useStudents` / `useClasses` to call the real service.
3. Add the generated API types from `src/api/generated/`.

**Delete them** if you do not need example entities:
1. Delete `src/features/students/` and `src/features/classes/`.
2. Remove their entries from `src/app/navigation.ts`.

### Step 9 — Keep core updated

`@yakupsogut/abp-react-core` is a published npm package. To pull in logic fixes (auth, CRUD, i18n):

```bash
npm update @yakupsogut/abp-react-core   # pulls latest minor/patch within ^1.x
```

For a MAJOR version bump: edit the version range in `package.json`, run `npm install`, and follow the changelog for any breaking API changes.

You own the template folder outright — UI changes you make locally are never overwritten by core updates.

## Commands (monorepo)

```bash
# Install all workspace dependencies
pnpm install

# Build all packages (core tsc + template Vite build)
pnpm -r build

# Run all tests (core 2 tests + template 50 tests)
pnpm -r test

# Start template dev server
pnpm --filter @strateji/template dev

# Re-generate API client
pnpm --filter @strateji/template openapi-ts

# Lint template
pnpm --filter @strateji/template lint
```

## Known issues / manual verification required

### Live login + admin CRUD must be verified manually

The full OIDC login flow, admin CRUD pages, language switcher, and CSS re-skin require the .NET backend running. These were NOT verified in CI (no interactive browser or external server available).

To verify manually:

1. Trust the dev cert: `dotnet dev-certs https --trust`
2. Start the backend: run `Strateji.SchollApp.Web` (https://localhost:44334)
3. Start the frontend: `pnpm --filter @strateji/template dev`
4. Open http://localhost:5173 — login with `admin` / `1q2w3E*`
5. Exercise: dashboard, Users admin CRUD, language switcher, logout
6. Re-skin test: change `--primary` in `src/index.css` and confirm colors update live, then revert

The kit was previously runtime-verified (OIDC login, Users CRUD, re-skin) prior to the distribution work. The controller re-runs this verification after the distribution tasks.

What was verified statically (CI-equivalent):
- `pnpm -r build` passes (core tsc + template Vite build)
- `pnpm -r test` passes (core 2 tests + template 50 tests)
- `pnpm --filter @strateji/template lint` — 0 errors (pre-existing warnings are noted below)
- `cd packages/core && npm pack --dry-run` — tarball lists dist + src + README, excludes test files

### Pre-existing lint warnings (~25 remaining after ignoring generated files)

The template carries ~25 lint warnings from the original SchollApp SPA source. These are NOT introduced by the kit refactor:

- `@typescript-eslint/no-explicit-any` in test files (`httpClient.test.ts`, `i18n.test.tsx`, `usePermission.test.tsx`) and `TenantForm.tsx`
- `react-refresh/only-export-components` in `components/ui/Button.tsx` and `badge.tsx` (shadcn pattern)
- `react-hooks/set-state-in-effect` in `FeatureEditor.tsx`, `PermissionEditor.tsx`, `SettingsPage.tsx`, `TenantsPage.tsx` (pre-existing pattern; functionally correct)
- `@typescript-eslint/no-unused-vars` in `i18n.test.tsx`

Generated files in `src/api/generated/` are excluded from ESLint (added to `globalIgnores` in `eslint.config.js`).

### Data-driven routes and path-type inference

Routes are driven by `app/navigation.ts` at runtime. This trades TanStack Router's static path-type inference for config-driven extensibility. One `as string` cast exists in `Header.tsx` as a result — this is intentional and documented.

### Culture localStorage key

Core persists the selected UI culture under the `abp-react-core.culture` localStorage key (renamed from the source app's brand-specific key during de-branding).

### Windows CRLF git warnings

Git may warn about CRLF line endings on Windows. These are cosmetic and do not affect the build, tests, or runtime behavior.
