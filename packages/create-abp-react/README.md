# @yakupsogut/create-abp-react

Scaffold a new ABP + React (Vite/TypeScript) project in seconds.

## Usage

```bash
npm create @yakupsogut/abp-react my-app
# or
npx @yakupsogut/create-abp-react my-app
```

This will:
1. Degit the `apps/template` from the `abp-react-kit` GitHub repository into `./my-app`
2. Set the project name in `package.json`
3. Copy `.env.example` → `.env` (edit it with your ABP backend URL and OIDC client details)
4. Run `git init` and create an initial commit

## After scaffolding

```bash
cd my-app
# Edit .env — set VITE_API_URL, VITE_CLIENT_ID, and redirect URIs to match your ABP backend
npm install
pnpm openapi-ts        # regenerate the API client (requires your ABP backend running)
npm run dev
```

## Manual fallback

If you prefer to scaffold manually:

```bash
npx degit yakupstrateji/abp-react-kit/apps/template my-app
cd my-app
cp .env.example .env
npm install
```
