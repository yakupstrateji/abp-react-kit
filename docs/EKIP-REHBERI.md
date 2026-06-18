# abp-react-kit — Ekip Rehberi

ABP Framework backend'leri için **yeniden kullanılabilir React (Vite + TypeScript) kit'i.** Bu rehber, kit'i yeni bir projede nasıl kullanacağını ve nasıl çalıştığını anlatır.

- **GitHub (public):** https://github.com/yakupstrateji/abp-react-kit
- **core (npm):** https://www.npmjs.com/package/@yakupsogut/abp-react-core
- **CLI (npm):** https://www.npmjs.com/package/@yakupsogut/create-abp-react

---

## 1. Bu nedir? (Mimari)

Kit **iki parçadan** oluşur:

| Parça | Ne | Sen ne yaparsın |
|---|---|---|
| **`@yakupsogut/abp-react-core`** | **Mantık** — OIDC PKCE auth, ABP app-config + izin kontrolü, `httpClient` (401→silent-renew→retry), headless `useCrud`, i18n. **Stilsiz, markasız.** | **Düzenlemezsin.** npm'den bağımlılık olarak gelir; güncellemeler `npm update` ile akar. |
| **template** (senin projen) | **Tasarım** — shadcn bileşenleri, layout, sayfalar, marka, menü, CSS token'ları, backend client'ı. | **Tamamen senindir** — istediğin gibi değiştir. |

**Fikir:** Herkes template'in bir kopyasını alır (kendi git'i, kendi tasarımı), `core`'u npm'den ortak bağımlılık olarak kullanır. Bakımcı `core`'u güncellediğinde herkes `npm update` ile alır — kendi kodlarına dokunulmadan.

---

## 2. Hızlı Başlangıç (yeni proje — ~5 dk)

```bash
# 1) Projeyi oluştur (template'i indirir)
npm create @yakupsogut/abp-react benim-projem
#   veya:  npx @yakupsogut/create-abp-react benim-projem

cd benim-projem

# 2) .env'i kendi backend'ine göre doldur (aşağıda)
#    (oluşturulan .env boş gelir — doldurman ŞART)

# 3) Bağımlılıkları kur (core npm'den iner)
npm install

# 4) Kendi backend'inden API client üret
npm run openapi-ts

# 5) Çalıştır
npm run dev
#   → http://localhost:5173
```

`npm create @yakupsogut/abp-react ...` komutu şunları yapar: template'i GitHub'dan indirir → proje adını ayarlar → `.env.example`'ı `.env`'e kopyalar → `git init` eder.

---

## 3. Önkoşullar

- **Node 18+** ve **npm** (pnpm de olur)
- **Çalışan bir ABP backend** ve üzerinde:
  - Bir **OpenIddict/IdentityServer public client** (Authorization Code + PKCE)
    - `redirect_uri` = `http://localhost:5173/auth/callback`
    - `post_logout_redirect_uri` ve silent-renew için `http://localhost:5173/auth/silent-renew`
  - **CORS** origin'i: `http://localhost:5173`
- Backend HTTPS (dev'de self-signed sertifika sorun değil — kit otomatik tolere eder)

> **Port 5173 önemlidir** — backend'deki `redirect_uri` bu portla eşleşmek zorunda. Dev server'ı her zaman 5173'te çalıştır.

> **Backend'i bu SPA için nasıl hazırlarım?** Backend tarafında yapılması gerekenler (public/PKCE
> OpenIddict client kaydı, callback + silent-renew redirect URI'leri, CORS, scope eşleşmesi, dev
> sertifikası) kopyala-yapıştır örneklerle: **[`BACKEND-KURULUM.md`](./BACKEND-KURULUM.md)**.

---

## 4. `.env` nasıl doldurulur

Oluşturulan projede `.env` (veya `.env.local`) şu anahtarları ister:

```env
VITE_API_URL=https://localhost:44334
VITE_CLIENT_ID=Benim_React_Client
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_SILENT_REDIRECT_URI=http://localhost:5173/auth/silent-renew
VITE_POST_LOGOUT_URI=http://localhost:5173/auth/logged-out
VITE_SCOPE=openid profile email roles offline_access BenimApi
```

- `VITE_API_URL` → ABP backend'inin kök URL'i
- `VITE_CLIENT_ID` → backend'de tanımladığın public client'ın id'si
- `VITE_SCOPE` → `openid profile email roles offline_access` + senin API scope'un

### Config katman önceliği (ÖNEMLİ — okuma sırası)

Authority/clientId/scope değerleri şu sırayla okunur; **sonraki bir öncekini ezer:**

| # | Katman | Ne zaman | Anahtarlar |
|---|---|---|---|
| 1 | `vite.config.ts` varsayılanları | her zaman (fallback) | `VITE_*` (`44334`, `SchollApp_React`) |
| 2 | `.env` / `.env.local` | build-time | `VITE_*` |
| 3 | **`public/dynamic-env.json`** | **runtime — hepsini ezer** | camelCase (`apiUrl`, `clientId`, …) |

> ⚠️ **`dynamic-env.json` `.env`'i EZER.** `src/lib/env.ts` içindeki `loadRuntimeConfig()`, bu dosyayı runtime'da `fetch` edip `Object.assign(env, json)` ile build-time `VITE_*` değerlerinin **üzerine yazar.** Yani `.env`'i değiştirdiğin halde "neden değişmedi?" diyorsan, eski bir `dynamic-env.json` büyük olasılıkla onu eziyordur.
>
> **Bu kit artık dolu bir `dynamic-env.json` ile gelmez** → varsayılan olarak **`.env` tek doğruluk kaynağıdır.** (Dosya yoksa `fetch` 404 döner, `loadRuntimeConfig()` bunu `try/catch` ile tolere edip build-time değerlerini korur.)
>
> **Runtime override (opsiyonel — Docker vb.):** Build sonrası değer değiştirmek istersen `public/dynamic-env.json`'ı **kendin oluştur** (camelCase anahtarlar). Tek image ile çok ortam: dosyayı mount et, rebuild gerekmez. Ama unutma — varsa **`.env`'i ezer.**

> **scope eşleşmesi:** `VITE_SCOPE` (veya `dynamic-env.json`'daki `scope`) içindeki API scope adı, **backend'inkiyle birebir aynı** olmalı (ABP'de genelde proje adı, örn. `AbpDemo`). Uyuşmazsa token reddedilir / 403 alırsın.

---

## 5. API client (`openapi-ts`)

```bash
npm run openapi-ts
```

- Backend'inin Swagger'ından (`VITE_API_URL/swagger/v1/swagger.json`) **tipli API hook'larını** `src/api/generated/` altına üretir.
- **Backend uçların değiştiğinde tekrar çalıştır.**
- **Self-signed dev sertifikası otomatik tolere edilir** — ekstra bir şey yapmana gerek yok. (Geçerli sertifikalı bir backend'de katı TLS istiyorsan `NODE_TLS_REJECT_UNAUTHORIZED=1` set et.)

---

## 6. Proje yapısı (senin sahip olduğun)

```
benim-projem/
  src/
    app/
      branding.ts       ← marka: app adı, logo, toaster teması
      navigation.ts     ← TÜM route'lar + sidebar menü (tek yer)
    index.css           ← tasarım token'ları (--primary, --sidebar-* ...)
    components/ui/       ← shadcn bileşenleri (Button, Table, Dialog ...)
    layout/             ← AdminLayout, Header, Sidebar
    features/
      admin/            ← Kullanıcılar, Roller, Kiracılar, Ayarlar (ABP — her backend'de çalışır)
      students/         ← ÖRNEK özellik (in-memory, backend'siz)
      classes/          ← ÖRNEK özellik (in-memory, backend'siz)
    api/generated/      ← openapi-ts çıktısı (senin backend'ine özgü)
    lib/env.ts          ← env'i okur, core'a configureClient(...) ile verir
  tailwind-preset.js    ← CSS token'larını Tailwind sınıflarına bağlar
  .env                  ← backend ayarların
```

`@yakupsogut/abp-react-core` ise `node_modules`'tadır (npm'den gelir) — **mantık orada, sen düzenlemezsin.**

---

## 7. Özelleştirme

### 7.1 Yeniden boyama (reskin)
`src/index.css`'teki token'ları değiştir — HMR ile **anında** yansır:
```css
:root {
  --primary: 221.2 83.2% 53.3%;   /* HSL — markana göre değiştir */
  --sidebar-active-fg: 243 75% 47%;
  /* ... */
}
```

### 7.2 Marka
`src/app/branding.ts`:
```ts
export const branding: Branding = {
  appName: 'Benim Uygulamam',
  toasterTheme: 'light',          // 'light' | 'dark' | 'system'
  // logo isteğe bağlı (ReactNode). JSX için branding.ts'i branding.tsx yap.
}
```

### 7.3 Menü + route (tek yer)
`src/app/navigation.ts` — bir girdi ekle/çıkar; **hem route hem sidebar otomatik** oluşur:
```ts
{ path: '/raporlar', labelKey: 'App::Menu:Reports', fallbackLabel: 'Raporlar',
  permission: 'Benim.Raporlar', component: ReportsPage }
```

---

## 8. Hazır gelen özellikler

- **Login** (OIDC PKCE) / logout / silent-renew
- **Çok kiracılı (multi-tenant)** + login öncesi tenant seçimi
- **Admin:** Kullanıcılar, Roller (+izin editörü), Kiracılar, Ayarlar, Profil, Feature yönetimi — bunlar **standart ABP uçları** olduğu için her ABP backend'inde çalışır
- **i18n** (TR/EN/AR) + dil değiştirici + RTL
- **İzin-bazlı** menü/route gizleme
- **Öğrenciler / Sınıflar** → **örnek** iş özellikleri (in-memory, backend'siz çalışır — deseni göstermek için)

---

## 9. Kendi iş ekranını ekleme (ÖNEMLİ)

Öğrenciler/Sınıflar **örnektir** — backend'siz çalışan, deseni gösteren şablonlardır. Kendi entity'in için:

1. **Sil ya da kopyala:** `features/students`'ı sil + `app/navigation.ts`'ten çıkar, ya da kopyalayıp uyarla.
2. **Gerçek backend'e bağla:** in-memory mock servis yerine, generated client'ı kullanan bir `CrudService` yaz — desen: **`features/admin/users/useUsers.ts`** (gerçek backend'e bağlı CRUD örneği).
3. **Bağla:** `useCrud(key, service, params)` → form + zod schema + sayfa yap → `navigation.ts`'e ekle.

> Admin sayfaları (Users/Roles…) zaten gerçek backend'e bağlıdır; kendi iş sayfaların için aynı deseni izle.

---

## 10. core güncellemesini alma

Bakımcı `@yakupsogut/abp-react-core`'un yeni sürümünü yayınladığında:

```bash
npm update @yakupsogut/abp-react-core
```

→ Yeni mantık (auth/CRUD/i18n düzeltmeleri) iner. **Senin template kodun (tasarım, sayfalar) dokunulmaz.** Büyük (major) sürümde changelog'a bak, gerekirse aralığı elle yükselt.

---

## 11. Komutlar

```bash
npm run dev            # geliştirme sunucusu (5173)
npm run build          # production build
npm run lint           # eslint
npm run openapi-ts     # API client'ı backend'den yeniden üret
```

---

## 12. Sık karşılaşılanlar (Sorun giderme)

| Sorun | Çözüm |
|---|---|
| **Login redirect olmuyor / 400** | Dev server **5173**'te mi? Backend'de `redirect_uri = http://localhost:5173/auth/callback` kayıtlı mı? `.env`'deki `VITE_CLIENT_ID`/`VITE_API_URL` doğru mu? |
| **`openapi-ts` "fetch failed"** | Backend çalışıyor mu (Swagger açık mı)? Self-signed sertifika otomatik tolere edilir; yine de olmuyorsa `VITE_API_URL` doğru mu kontrol et. |
| **Tarayıcıda cert uyarısı** | ABP dev sertifikasını güven: `dotnet dev-certs https --trust` |
| **`npm warn Unknown project config "link-workspace-packages"`** | Bu fix'ten önce oluşturulmuş eski projelerde olur; `.npmrc`'yi sil. Yeni `npm create @yakupsogut/abp-react` projelerinde yoktur. |
| **Admin sayfaları boş/hata** | `npm run openapi-ts`'i KENDİ backend'ine karşı çalıştırdın mı? `.env` doğru backend'i mi gösteriyor? |
| **Öğrenciler/Sınıflar başka backend'de 403** | Bunlar örnek; izin-gate'siz gelir. Eğer kendi backend'inde gizliyse, bu fix öncesi bir sürümdür — en güncel template'i çek. |

---

## 13. Bakımcı için (yayın & güncelleme akışı)

> Bu bölüm kit'i **bakan kişi** (Yakup) içindir. Ayrıntı: [`docs/PUBLISHING.md`](./PUBLISHING.md).

- **core'u güncelle:** `packages/core`'da değiştir → `packages/core/package.json` versiyonu bump et (semver) → `npm login` (yakupsogut) → `cd packages/core && pnpm publish`.
- **CLI'ı güncelle:** sadece `packages/create-abp-react`'in **kendi kodu** değişirse → bump → `cd packages/create-abp-react && npm publish`.
- **Template/docs değişikliği:** sadece `git push` yeter — CLI degit ile **en güncel template'i** çeker, yeni projeler otomatik alır. (Re-publish gerekmez.)

---

## 14. Özet akış şeması

```
[Bakımcı]                          [Sen / Ekip]
core'da değişiklik                 npm create @yakupsogut/abp-react app
   ↓ versiyon bump                    ↓ .env doldur, npm install, openapi-ts
   ↓ pnpm publish (npm)               ↓ npm run dev  → geliştir
   ↓                                  ↓ tasarımı/menüyü/özelliği değiştir (senin kodun)
@yakupsogut/abp-react-core@x ────→ npm update @yakupsogut/abp-react-core
(yeni mantık akar)                 (template kodun dokunulmaz)
```

İyi çalışmalar! Soru olursa: https://github.com/yakupstrateji/abp-react-kit
