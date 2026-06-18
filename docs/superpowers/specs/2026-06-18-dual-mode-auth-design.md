# Dual-mode authentication (redirect ↔ password) — Design

Date: 2026-06-18
Status: Approved (proceeding to implementation)

## Problem

Today all login is funneled through `oidc-client-ts` `UserManager` with
`response_type=code` (Authorization Code + PKCE). The template's `LoginPage`
collects an optional tenant name and then calls `signinRedirect()`, which sends
the browser to the ABP server-rendered MVC login page.

Some consumer projects need the login form to live **inside the React SPA**
(username + password fields), with no redirect to the ABP UI. This must be
selectable per project (via env), without forking the template, and the existing
redirect flow must remain the default and stay byte-identical.

## Approach

Introduce an `AuthStrategy` seam in `@yakupsogut/abp-react-core`. All auth
consumers already go through a single choke point (`getAccessToken()` /
`getUserManager()` in core, surfaced via `useAuth()`), so the seam is clean.

- `AbpReactConfig.authMode?: 'redirect' | 'password'`, default `'redirect'`.
- `getAuthStrategy()` lazily selects the implementation from config.
- `RedirectStrategy` wraps today's `UserManager` (unchanged behavior).
- `PasswordStrategy` implements the OAuth2 Resource Owner Password Credentials
  (ROPC) grant against `POST {apiUrl}/connect/token`.
- `getAccessToken()`, `signOut()`, and the 401-retry interceptor delegate to the
  active strategy. `useAuth()`'s shape is unchanged, so `ProtectedRoute`,
  `Header`, layout, and app-config need no changes.

## Components

### Core (`packages/core`)
- `config/env.ts` — add `authMode` (optional, default `redirect`) to
  `AbpReactConfig`; add **field validation** in `configureClient` (throws on
  missing/empty required keys — also closes audit MEDIUM #5).
- `auth/strategy.ts` (new) — `AuthStrategy` interface
  (`getAccessToken / refresh / login / logout / getUser` + `loaded`/`unloaded`
  subscriptions) + `getAuthStrategy()` singleton + `_setAuthStrategyForTests`.
- `auth/redirectStrategy.ts` (new) — adapts the existing `UserManager`/PKCE path.
- `auth/passwordStrategy.ts` (new) — token-endpoint client using a **raw** HTTP
  client that bypasses the shared `axiosInstance` interceptor (no 401 recursion);
  token storage in `localStorage` shaped so `getAccessToken()` keeps working;
  **single-flight** refresh driven by an expiry timer (oidc `automaticSilentRenew`
  cannot drive ROPC); emits loaded/unloaded events.
- `auth/userManager.ts` — `getAccessToken` and `signOut` delegate to the active
  strategy; wrap `signOut` in try/finally so a failed `signoutRedirect` resets
  the `_signingOut` guard (audit MEDIUM #3).
- `auth/AuthProvider.tsx` — subscribe to the active strategy's events; add
  `loginWithPassword(username, password, tenant?)` to the context (throws in
  redirect mode); also subscribe to `addAccessTokenExpired` / `addSilentRenewError`
  so a lost session clears `user` (audit MEDIUM #2); compute
  `isAuthenticated` with a live expiry check (audit LOW #11).
- `api/httpClient.ts` — 401-retry delegates to `getAuthStrategy().refresh()` with
  a **shared in-flight promise** (single-flight, audit MEDIUM #1); on failure,
  strategy-specific handling (redirect → `signinRedirect`; password → clear tokens
  and route to `/login`).
- `index.ts` — export the new strategy types and the broadened `AuthContextValue`.

### Template (`apps/template`)
- `lib/env.ts` + `vite.config.ts` — add `VITE_AUTH_MODE` (+ `dynamic-env.json`
  `authMode`), default `redirect`.
- `auth/LoginPage.tsx` — branch on `authMode`. Redirect mode keeps the current
  tenant + redirect flow. Password mode renders username + password (+ optional
  tenant name, reusing the existing `tenants/by-name` resolution) and calls
  `loginWithPassword`, surfacing `AbpError` (`invalid_grant` → "kullanıcı adı veya
  şifre hatalı", lockout message).
- `/auth/callback` and `/auth/silent-renew` routes stay registered (unused in
  password mode).

### Backend (local fixture `Strateji.SchollApp`)
- `OpenIddictDataSeedContributor.cs` (SchollApp_React, ~line 143-146) — add
  `OpenIddictConstants.GrantTypes.Password` to the grant list; re-run the
  DbMigrator so the OpenIddict application row is updated.

## Data flow (password mode)
1. Form submit → `loginWithPassword(username, password, tenant?)` →
   `PasswordStrategy.login` → `POST /connect/token` (`grant_type=password`,
   `username`, `password`, `client_id`, `scope`, `__tenant` header) →
   store `{access_token, refresh_token, expires_at, profile}` → schedule refresh →
   emit `userLoaded` → `AuthProvider.setUser` → app renders.
2. API call → interceptor attaches Bearer from `getAccessToken()` →
   `401` → single-flight `refresh()` (`grant_type=refresh_token`) → retry;
   refresh failure → clear tokens + navigate `/login`.
3. Logout → clear local tokens → emit `userUnloaded` → `/login`.

## Error handling
- Token-endpoint client bypasses the shared interceptor (no 401 recursion).
- `invalid_grant` mapped to a friendly message; lockout surfaced.
- Refresh is single-flight to avoid refresh-token rotation stampede.
- `offline_access` required in scope (otherwise no refresh token → silent session
  death); validate/warn.

## Constraints (documented, accepted)
- ROPC is discouraged by OAuth 2.1 → strictly opt-in, redirect stays default.
- Password mode does NOT surface 2FA / external login / email confirmation /
  rich lockout UX (these live on the ABP MVC page).
- Refresh token in browser storage increases XSS blast radius.

## Testing
- Redirect-mode tests preserved unchanged (regression guard).
- New unit tests: `PasswordStrategy` (login, single-flight refresh, expiry,
  logout, `__tenant`), `AuthProvider.loginWithPassword`, password `LoginPage`.
- Runtime verification against the local backend (`admin` / `1q2w3E*`) in both
  modes.

## Backward compatibility
`authMode` is optional with a `redirect` default, so existing consumers and the
published `AbpReactConfig` type are unaffected.
