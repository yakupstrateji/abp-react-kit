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

The project-root `tailwind-preset.js` maps every CSS token to a Tailwind utility so you can write `bg-primary`, `text-sidebar-fg`, etc. Add new tokens in `index.css` and the corresponding mapping in the preset to extend the design system.

## Branding config (`src/app/branding.ts`)

```ts
import type { BrandingConfig } from '@strateji/abp-react-core'

export const branding: BrandingConfig = {
  appName: 'My App',          // shown in sidebar header and page title
  logoUrl: '/logo.svg',       // optional; falls back to text-only
  toasterTheme: 'system',     // Sonner theme: 'light' | 'dark' | 'system'
}
```

## Navigation config (`src/app/navigation.ts`)

Define all routes and the sidebar menu in one array. Both the TanStack Router route tree and the sidebar are generated from this config:

```ts
import type { NavEntry } from '@strateji/abp-react-core'
import { LayoutDashboard, Users } from 'lucide-react'

export const navigation: NavEntry[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  {
    key: 'admin', label: 'Administration', icon: Users,
    children: [
      {
        key: 'users', label: 'Users', path: '/admin/users',
        permission: 'AbpIdentity.Users',  // hides the item if not granted
      },
    ],
  },
]
```

`permission` is optional. When set, the sidebar item is hidden for users who lack that ABP permission string.

## Backend wiring

### Environment variables

Create `.env.local` (git-ignored) or populate `public/dynamic-env.json` for runtime injection:

```env
VITE_AUTHORITY=https://localhost:44334
VITE_CLIENT_ID=YourApp_React
VITE_API_BASE_URL=https://localhost:44334
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/
VITE_SCOPE=openid profile email roles YourApi
```

`dynamic-env.json` values override `.env` at runtime, which is useful for Docker deployments where you can mount the file without rebuilding.

### Regenerate the API client

After changing your ABP backend, regenerate typed API hooks:

```bash
pnpm openapi-ts
```

Output goes to `src/api/generated/`. These files are excluded from ESLint and should be committed as-is.

## Core dependency

`@strateji/abp-react-core` is listed in `package.json` as a regular dependency. Update it independently of your UI changes:

```bash
pnpm update @strateji/abp-react-core
```

Core exports: `AuthProvider`, `useAuth`, `AppConfigProvider`, `usePermission`, `httpClient`, `useCrud`, `CrudService`, `LocalizationProvider`, `useL`, `env`.

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
