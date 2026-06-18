#!/usr/bin/env node
import degit from 'degit'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

// Public GitHub repo + subdir the template is degit'd from.
const REPO = 'yakupstrateji/abp-react-kit/apps/template'

// --- args: <project-dir> [--backend <abp-backend-path>] ---
const argv = process.argv.slice(2)
let dir
let backendArg
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--backend') backendArg = argv[++i]
  else if (!argv[i].startsWith('--') && !dir) dir = argv[i]
}
if (!dir) {
  console.error('Usage: npx create-abp-react <project-dir> [--backend <abp-backend-path>]')
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
  console.error('\nMake sure you have network access and the repo is public.')
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

// --- Optional: sync the template's UI localization keys into the ABP backend ---
// The template resolves bare keys (Menu:Users, UserName, …) against the backend's
// default localization resource. Fresh backends don't define them, so the UI stays
// in the Turkish fallback in every language. Offer to add the missing keys.
let backendPath = backendArg
if (!backendPath && stdin.isTTY) {
  const rl = createInterface({ input: stdin, output: stdout })
  const ans = (
    await rl.question(
      '\nABP backend proje yolu (UI çevirilerini backend localization resource\'una\n' +
        'eklemek için; boş bırak = atla): ',
    )
  ).trim()
  rl.close()
  if (ans) backendPath = ans
}
if (backendPath) {
  try {
    syncBackendLocalization(dir, backendPath)
  } catch (e) {
    console.warn(`  Localization sync atlandı: ${e.message}`)
  }
}

console.log(`
Done. Next steps:
  cd ${dir}
  npm install
  # edit .env  (VITE_API_URL, VITE_CLIENT_ID, redirect URIs -> your ABP backend)
  npm run openapi-ts     # regenerate the API client against your backend (with backend running)
  npm run dev
`)

// ---------------------------------------------------------------------------
// Localization sync helpers
// ---------------------------------------------------------------------------

/**
 * Merge the template's reference localization keys (docs/backend-localization/*.json)
 * into the ABP backend's app localization resource — adding only keys that the
 * backend is missing, never overwriting existing values.
 */
function syncBackendLocalization(targetDir, backend) {
  if (!existsSync(backend)) throw new Error(`backend yolu bulunamadı: ${backend}`)

  const refDir = join(targetDir, 'docs', 'backend-localization')
  const refs = ['en', 'tr']
    .map((c) => ({ culture: c, path: join(refDir, `${c}.json`) }))
    .filter((r) => existsSync(r.path))
  if (!refs.length) {
    console.log('  Referans localization dosyaları bulunamadı, atlanıyor.')
    return
  }

  const candidates = findResourceDirs(backend)
  if (!candidates.length) {
    console.log(`  ${backend} altında uygulama localization resource'u bulunamadı, atlanıyor.`)
    console.log('  (Beklenen: src/<Proje>.Domain.Shared/Localization/<Resource>/)')
    return
  }
  const resourceDir = candidates[0]
  console.log(`\nLocalization resource: ${resourceDir}`)
  if (candidates.length > 1) {
    console.log(`  (İlki kullanılıyor. Diğer adaylar: ${candidates.slice(1).join(', ')})`)
  }

  let touched = false
  for (const ref of refs) {
    const refTexts = JSON.parse(readFileSync(ref.path, 'utf8')).texts || {}
    const beFile = join(resourceDir, `${ref.culture}.json`)
    if (!existsSync(beFile)) {
      console.log(`  - ${ref.culture}.json backend resource'unda yok — atlandı (oluşturursan eklenir).`)
      continue
    }
    const be = JSON.parse(readFileSync(beFile, 'utf8'))
    be.texts = be.texts || {}
    let added = 0
    for (const k of Object.keys(refTexts)) {
      if (!(k in be.texts)) {
        be.texts[k] = refTexts[k]
        added++
      }
    }
    if (added) {
      writeFileSync(beFile, JSON.stringify(be, null, 2) + '\n')
      touched = true
    }
    console.log(`  - ${ref.culture}: +${added} anahtar (toplam ${Object.keys(be.texts).length})`)
  }

  if (touched) {
    console.log("  ✓ Backend localization güncellendi. Embedded resource olduğu için backend'i")
    console.log('    yeniden DERLE + BAŞLAT (dotnet build), sonra SPA dilini değiştirip doğrula.')
  } else {
    console.log('  Backend zaten tüm anahtarlara sahip — değişiklik yok.')
  }
}

/**
 * Find app localization resource directories under the backend tree
 * (…/Localization/<ResourceName>/ with .json culture files), excluding ABP/Volo
 * framework resources. Returns absolute directory paths.
 */
function findResourceDirs(root) {
  const SKIP = new Set(['node_modules', 'bin', 'obj', '.git', '.vs', '.idea', 'dist', 'wwwroot'])
  const found = []
  const walk = (d, depth) => {
    if (depth > 9) return
    let entries
    try {
      entries = readdirSync(d, { withFileTypes: true })
    } catch {
      return
    }
    const isLocalization = basename(d) === 'Localization'
    for (const e of entries) {
      if (!e.isDirectory() || SKIP.has(e.name)) continue
      const full = join(d, e.name)
      if (isLocalization) {
        // e is a resource folder; record if it has json culture files and isn't framework
        if (/^(Abp|Volo|Microsoft|System)/i.test(e.name)) continue
        let hasJson = false
        try {
          hasJson = readdirSync(full).some((f) => f.endsWith('.json'))
        } catch {
          /* ignore */
        }
        if (hasJson) found.push(full)
      } else {
        walk(full, depth + 1)
      }
    }
  }
  walk(root, 0)
  return found
}
