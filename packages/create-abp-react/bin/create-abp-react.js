#!/usr/bin/env node
import degit from 'degit'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, basename, resolve } from 'node:path'
import { homedir } from 'node:os'
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
const rl = stdin.isTTY ? createInterface({ input: stdin, output: stdout }) : null
let backendPath = backendArg ? normalizeBackendPath(backendArg) : null
if (!backendPath && rl) {
  const ans = await rl.question(
    '\nABP backend proje yolu (UI çevirilerini backend localization resource\'una\n' +
      'eklemek için; boş bırak = atla): ',
  )
  if (ans.trim()) backendPath = normalizeBackendPath(ans)
}
if (backendPath) {
  try {
    await syncBackendLocalization(dir, backendPath, rl)
  } catch (e) {
    warnSkip(`Localization sync hatası: ${e.message}`)
  }
} else if (!rl && !backendArg) {
  console.log(
    '\n(i) UI çevirilerini backend\'e otomatik eklemek için --backend <abp-backend-yolu> ver,\n' +
      '    ya da apps/template/docs/backend-localization/ altındaki en/tr.json\'u backend resource\'una elle ekle.',
  )
}
if (rl) rl.close()

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

/** Trim, strip surrounding quotes, expand a leading ~, resolve to an absolute path. */
function normalizeBackendPath(p) {
  let s = String(p).trim().replace(/^['"]|['"]$/g, '').trim()
  if (s === '~') s = homedir()
  else if (s.startsWith('~/') || s.startsWith('~\\')) s = join(homedir(), s.slice(2))
  return resolve(s)
}

/** Loud, can't-miss skip/warning so localization issues aren't silent. */
function warnSkip(msg) {
  console.warn(`\n  ⚠️  ${msg}`)
  console.warn(
    '     UI çevirileri eklenmedi. Backend resource\'una elle eklemek için:\n' +
      '     apps/template/docs/backend-localization/{en,tr}.json → backend\'in Localization/<Resource>/ klasörüne merge et.',
  )
}

/**
 * Merge the template's reference localization keys (docs/backend-localization/*.json)
 * into the ABP backend's DEFAULT app localization resource — adding only keys the
 * backend is missing, never overwriting existing values.
 */
async function syncBackendLocalization(targetDir, backend, rl) {
  if (!existsSync(backend)) {
    warnSkip(`backend yolu bulunamadı: ${backend}`)
    return
  }

  const refDir = join(targetDir, 'docs', 'backend-localization')
  const refs = ['en', 'tr']
    .map((c) => ({ culture: c, path: join(refDir, `${c}.json`) }))
    .filter((r) => existsSync(r.path))
  if (!refs.length) {
    warnSkip('referans localization dosyaları bulunamadı (docs/backend-localization).')
    return
  }

  let candidates = findResourceDirs(backend)
  if (!candidates.length) {
    warnSkip(`${backend} altında uygulama localization resource'u bulunamadı.`)
    console.warn("     (Beklenen: src/<Proje>.Domain.Shared/Localization/<Resource>/)")
    return
  }

  // Rank: the app's DEFAULT resource lives in *.Domain.Shared and is usually named
  // after the project — prefer those so we don't sync a test/secondary resource.
  const projectName = basename(backend).replace(/[^a-z0-9]/gi, '')
  candidates = candidates
    .map((d) => {
      let score = 0
      if (/Domain\.Shared/i.test(d)) score += 100
      if (projectName && new RegExp(projectName, 'i').test(basename(d))) score += 50
      return { dir: d, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.dir)

  let resourceDir = candidates[0]
  if (candidates.length > 1 && rl) {
    console.log('\nBirden fazla localization resource bulundu:')
    candidates.forEach((d, i) => console.log(`  [${i + 1}] ${d}`))
    const pick = (await rl.question(`Hangisi uygulamanın DEFAULT resource'u? [1-${candidates.length}, varsayılan 1]: `)).trim()
    const idx = Number.parseInt(pick, 10)
    if (Number.isInteger(idx) && idx >= 1 && idx <= candidates.length) resourceDir = candidates[idx - 1]
  } else if (candidates.length > 1) {
    console.log(`  (Birden fazla resource var; ${resourceDir} seçildi. Diğerleri: ${candidates.slice(1).join(', ')})`)
  }

  console.log(`\nLocalization resource: ${resourceDir}`)
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
    console.log('\n  ┌────────────────────────────────────────────────────────────────┐')
    console.log('  │  ✓ Backend localization güncellendi.                            │')
    console.log('  │  ⚠ ZORUNLU: .json embedded resource → backend\'i YENİDEN DERLE   │')
    console.log('  │    + BAŞLAT (dotnet build, sonra host\'u yeniden çalıştır),      │')
    console.log('  │    yoksa eski çeviriler servis edilmeye devam eder.             │')
    console.log('  └────────────────────────────────────────────────────────────────┘')
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
        // NOTE: do NOT filter by an "Abp"/"Volo" name prefix — the app's own
        // resource is frequently named "AbpDemo", "AbpReact", … (starts with Abp).
        // Framework resources ship in NuGet packages, not in the source tree, so
        // any resource folder found here under the backend source IS an app resource.
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
