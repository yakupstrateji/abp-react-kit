# Publishing & updating abp-react-kit packages

This document covers how to publish a new version of `@yakupsogut/abp-react-core`, how consumers update it, and how to publish the `create-abp-react` scaffolding CLI.

---

## Publish a new core version

### 1. Make your changes in `packages/core`

Edit source files under `packages/core/src/`. Run tests before publishing:

```bash
pnpm --filter @yakupsogut/abp-react-core test
pnpm -r build
```

### 2. Bump the version (semver)

Edit `packages/core/package.json`:

- **patch** (`1.0.0` -> `1.0.1`) — bug fixes, no API changes
- **minor** (`1.0.0` -> `1.1.0`) — new exports, backward-compatible
- **MAJOR** (`1.0.0` -> `2.0.0`) — breaking changes to exported API or `AbpReactConfig` shape

### 3. Dry run first

```bash
cd packages/core
npm pack --dry-run
```

Verify the tarball lists `dist/`, `src/`, `README.md`, and `package.json`. It must NOT include `src/**/*.test.*` files or `node_modules`.

### 4. Log in to npm as yakupsogut

```bash
npm login
# enter username: yakupsogut, password, OTP if enabled
```

### 5. Publish

```bash
cd packages/core
pnpm publish
```

`prepublishOnly` runs `pnpm build` automatically, so `dist/` is always up to date before publish. `publishConfig.access: "public"` ensures the scoped package is public.

---

## Consuming core updates in a consumer project

Consumer projects scaffold from the template and install core from npm:

```bash
# pull the latest minor/patch within ^1.x
npm update @yakupsogut/abp-react-core
```

For a **MAJOR** version bump:

1. Edit the version range in `package.json`: `"@yakupsogut/abp-react-core": "^2.0.0"`
2. Run `npm install`
3. Follow the changelog for any breaking API changes (e.g. changes to `AbpReactConfig`, `configureClient` signature, or removed exports)

---

## Publishing the CLI (`create-abp-react`)

The CLI in `packages/create-abp-react` uses `degit` to clone `apps/template` from the public GitHub repo. Before publishing:

### 1. Push the monorepo public to GitHub

The GitHub repo must be public for `degit` to work without authentication. Push `abp-react-kit` to a public repo (e.g. `github.com/yakupstrateji/abp-react-kit`).

### 2. CLI degit path

`packages/create-abp-react/bin/index.js` is already set to:

```js
const REPO = 'yakupstrateji/abp-react-kit/apps/template'
```

Only change this if you move the repo to a different owner/name.

### 3. Publish

```bash
cd packages/create-abp-react
npm publish
```

`publishConfig.access: "public"` is already set in `package.json`.

After publishing, users can scaffold with:

```bash
npx create-abp-react my-app
```

---

## Checklist before any publish

- [ ] `pnpm -r build` passes with no errors
- [ ] `pnpm -r test` passes (core 2 + template 50)
- [ ] `npm pack --dry-run` in `packages/core` shows expected files
- [ ] Version bumped in `package.json` (semver)
- [ ] For CLI: `REPO` in `bin/index.js` = `yakupstrateji/abp-react-kit/apps/template` (set)
- [ ] Logged in to npm as the package owner
