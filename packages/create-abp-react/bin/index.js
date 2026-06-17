#!/usr/bin/env node
import degit from 'degit'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'

// TODO: set OWNER to the public GitHub repo owner/org before publishing (Task 8)
// e.g. 'stratejibilisim/abp-react-kit/apps/template'
const REPO = 'OWNER/abp-react-kit/apps/template'

const dir = process.argv[2]
if (!dir) {
  console.error('Usage: npx create-abp-react <project-dir>')
  process.exit(1)
}
if (existsSync(dir)) {
  console.error(`Directory "${dir}" already exists.`)
  process.exit(1)
}

console.log(`Scaffolding abp-react app in ./${dir} …`)
const emitter = degit(REPO, { cache: false, force: true })

try {
  await emitter.clone(dir)
} catch (err) {
  console.error(`\nError: could not clone template from "${REPO}".`)
  console.error(`  ${err.message}`)
  console.error('\nIf the GitHub repo is not yet public, this is expected.')
  console.error('Set OWNER in bin/index.js to the real GitHub owner/org before publishing.')
  process.exit(1)
}

// set package name
const pkgPath = join(dir, 'package.json')
if (!existsSync(pkgPath)) {
  console.error('Template package.json not found — the clone may be incomplete.')
  process.exit(1)
}
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.name = basename(dir).replace(/[^a-z0-9-]/gi, '-').toLowerCase()
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

// .env from example
const envExample = join(dir, '.env.example')
if (existsSync(envExample) && !existsSync(join(dir, '.env'))) {
  writeFileSync(join(dir, '.env'), readFileSync(envExample, 'utf8'))
}

// git init
try {
  execSync('git init -q && git add -A && git commit -q -m "Initial commit from create-abp-react"', { cwd: dir, stdio: 'ignore' })
} catch { /* git optional */ }

console.log(`
Done. Next steps:
  cd ${dir}
  npm install
  # edit .env  (VITE_API_URL, VITE_CLIENT_ID, redirect URIs -> your ABP backend)
  npm run openapi-ts     # regenerate the API client against your backend (with backend running)
  npm run dev
`)
