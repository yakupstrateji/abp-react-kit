# abp-react-kit

A pnpm monorepo that turns a React SPA into a reusable kit for ABP Framework backends.

## What is this?

abp-react-kit gives you two things:

- **`packages/core` — `@strateji/abp-react-core`**: Style-free, brand-free, backend-free React logic. Covers OIDC PKCE auth, ABP app-config + `usePermission`, `httpClient` with 401-silent-renew-retry, headless `useCrud`, i18n `useL`, and runtime env injection.
- **`apps/template` — `@strateji/template`**: Owns all design. Contains shadcn `components/ui`, tokenized `index.css` + `tailwind-preset.js`, `layout/`, `features/` (admin CRUD, students, classes examples), the backend-specific `src/api/generated`, and the two configuration files `app/branding.ts` and `app/navigation.ts`.

The template depends on core via `workspace:*`. A consuming project copies the template once and keeps updating `@strateji/abp-react-core` as a versioned dependency.

## Monorepo layout

```
abp-react-kit/
  packages/
    core/                  @strateji/abp-react-core  (logic, no styles)
      src/
        auth/              OIDC PKCE, AuthProvider, useAuth
        app-config/        ABP /api/abp/application-configuration, usePermission
        http/              httpClient (Axios), 401 silent-renew-retry interceptor
        crud/              useCrud headless hook, CrudService, CrudMessages
        i18n/              LocalizationProvider, useL
        env/               runtime env (dynamic-env.json + .env fallback)
        index.ts           public barrel
  apps/
    template/              @strateji/template  (design + features)
      src/
        app/
          branding.ts      App name, logo URL, toaster theme
          navigation.ts    All routes + sidebar menu in one place
        components/ui/     shadcn components (Button, Dialog, Table…)
        layout/            AppShell, Header, Sidebar
        features/          admin CRUD (users, roles, tenants, settings, features)
                           plus students + classes examples
        api/generated/     openapi-ts output — regenerate from your backend
        index.css          CSS custom-property tokens (--primary, --sidebar-*, …)
        tailwind-preset.js Tailwind preset that maps tokens to utility classes
```

## Core vs Template — what lives where

| Concern | lives in |
|---|---|
| OIDC login / logout / silent renew | `@strateji/abp-react-core` |
| ABP app-config fetch + permission check | `@strateji/abp-react-core` |
| Axios client + 401 auto-retry | `@strateji/abp-react-core` |
| Generic headless CRUD hook | `@strateji/abp-react-core` |
| i18n setup + `useL` | `@strateji/abp-react-core` |
| Runtime env (VITE_* + dynamic-env.json) | `@strateji/abp-react-core` |
| Design tokens, CSS, Tailwind | `apps/template` |
| shadcn component library | `apps/template` |
| App shell, sidebar, header | `apps/template` |
| ABP admin CRUD feature pages | `apps/template` |
| Backend-specific generated API client | `apps/template` |
| Branding config (name, logo) | `apps/template` |
| Navigation/routing config | `apps/template` |

## Consumer workflow

### Step 1 — Copy the template

```bash
# with degit
npx degit strateji/abp-react-kit/apps/template my-app
cd my-app && pnpm install
```

Or simply copy the `apps/template` folder into your project.

### Step 2 — Re-skin via CSS tokens and Tailwind preset

Edit `src/index.css`. Every color, radius, and sidebar measurement is a CSS custom property:

```css
:root {
  --primary: 221.2 83.2% 53.3%;     /* hsl values — change to your brand */
  --sidebar-bg: 222.2 47.4% 11.2%;
  --sidebar-active-fg: 210 40% 98%;
  /* … */
}
```

The `tailwind-preset.js` at the project root maps these tokens to Tailwind utility classes — no Tailwind config changes needed for a re-skin.

### Step 3 — Configure branding and navigation

`src/app/branding.ts` — set your app name, optional logo URL, and Sonner toaster theme:

```ts
export const branding = {
  appName: 'My ABP App',
  logoUrl: '/logo.svg',      // optional; falls back to text
  toasterTheme: 'light',     // 'light' | 'dark' | 'system'
} satisfies BrandingConfig
```

`src/app/navigation.ts` — define every route and sidebar menu entry in one place:

```ts
export const navigation: NavEntry[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  {
    key: 'admin', label: 'Administration', icon: Settings,
    children: [
      { key: 'users', label: 'Users', path: '/admin/users', permission: 'AbpIdentity.Users' },
    ],
  },
]
```

Routes and sidebar are both generated from this array. No separate router file to maintain.

### Step 4 — Wire up your ABP backend

1. Set environment variables (`.env.local` or `public/dynamic-env.json` for runtime injection):

```env
VITE_AUTHORITY=https://localhost:44334
VITE_CLIENT_ID=MyApp_React
VITE_API_BASE_URL=https://localhost:44334
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
```

2. Regenerate the API client from your backend's Swagger:

```bash
pnpm openapi-ts
```

The generated files go into `src/api/generated/` and are committed. They are excluded from ESLint (generated code).

### Step 5 — Keep core updated

`@strateji/abp-react-core` stays as a regular npm dependency in your copied template. Logic fixes (auth, CRUD, i18n) flow in by bumping the version:

```bash
pnpm update @strateji/abp-react-core
```

You own the template folder outright — UI changes never break your core updates.

## Commands

```bash
# Install all workspace dependencies
pnpm install

# Build all packages (core type-check + template Vite build)
pnpm -r build

# Run all tests (core 2 tests + template 50 tests)
pnpm -r test

# Start template dev server
pnpm --filter @strateji/template dev
# or from apps/template:
pnpm dev

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

What was verified in CI:
- `pnpm -r build` passes (core tsc + template Vite build)
- `pnpm -r test` passes (core 2 tests + template 50 tests)
- Vite dev server starts and serves the SPA HTML at http://localhost:5173

### Pre-existing lint errors (~25 remaining after ignoring generated files)

The template inherits ~25 lint errors from the original SchollApp SPA source. These are NOT introduced by the kit refactor:

- `@typescript-eslint/no-explicit-any` in test files (`httpClient.test.ts`, `i18n.test.tsx`, `usePermission.test.tsx`) and `TenantForm.tsx`
- `react-refresh/only-export-components` in `components/ui/Button.tsx` and `badge.tsx` (shadcn pattern of exporting both component and variant function from the same file)
- `react-hooks/set-state-in-effect` in `FeatureEditor.tsx`, `PermissionEditor.tsx`, `SettingsPage.tsx`, `TenantsPage.tsx` (pre-existing pattern from the source app; functionally correct but not idiomatic)
- `@typescript-eslint/no-unused-vars` in `i18n.test.tsx`

Generated files in `src/api/generated/` are excluded from ESLint (added to `globalIgnores` in `eslint.config.js`).

### Data-driven routes and path-type inference

Routes are driven by `app/navigation.ts` at runtime. This trades TanStack Router's static path-type inference for config-driven extensibility. One `as string` cast exists in `Header.tsx` as a result — this is intentional and documented.

### Windows CRLF git warnings

Git may warn about CRLF line endings on Windows. These are cosmetic and do not affect the build, tests, or runtime behavior.
