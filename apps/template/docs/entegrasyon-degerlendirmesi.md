# schollapp-spa — ABP Entegrasyon Değerlendirmesi

> **İlk değerlendirme:** 2026-06-16
> **Güncelleme:** 2026-06-16 — ekip düzeltmeleri (`ba97854` → `c4cec9b` → `as never` temizliği) incelendi ve doğrulandı. `tsc -b` temiz (EXIT=0).
> **Kapsam:** Yalnızca `schollapp-spa` (Vite + React 19 backoffice SPA). Backend (`Strateji.SchollApp`) yeni oluşturulduğu ve içi boş olduğu için değerlendirme dışıdır. `schollapp-react` (Next.js) kullanılmayacak, ileride silinecek.
> **Soru:** Backoffice olarak kullanacağımız bu projede ABP entegrasyonları iyi yapılmış mı?

---

## Net cevap (güncel)

Entegrasyonların büyük çoğunluğu iyi yapılmış. İlk değerlendirmedeki **ana problem (codegen kurulmuş ama kullanılmıyor) çözüldü**, küçük pürüzler temizlendi, ikinci turda tespit edilen **CRUD hata mesajı regresyonu kapatıldı** (response interceptor + regresyon testi) ve son turda **`as never` cast'leri de giderildi** (servisler generated `*Writable` DTO'larına bağlandı). Artık **açık teknik bulgu kalmadı**; geriye yalnızca **bilinçli ertelenen** mimari madde (token/BFF/CSP) var. Tüm proje `tsc -b` ile temiz derleniyor.

### Durum tablosu

| Alan | İlk durum | Güncel durum |
|------|-----------|--------------|
| OIDC / Auth | ✅ Çok iyi | ✅ Çok iyi |
| Multi-tenancy | ✅ Doğru | ✅ Doğru |
| İzinler (permissions) | ✅ Doğru | ✅ Doğru |
| Lokalizasyon (i18n) | ✅ Çok iyi | ✅ Çok iyi |
| Runtime config | ✅ Olgun | ✅ Olgun |
| Test altyapısı | ✅ Gerçek testler | ✅ 46 test geçiyor |
| **API client (codegen)** | ❌ Kurulmuş ama kullanılmıyor | ✅ **Çözüldü** — gerçekten kullanılıyor |
| Tip güvenliği (`any` sızıntısı) | ⚠️ Pürüz | ✅ **Çözüldü** (app kodunda 0) |
| openapi-ts input | ⚠️ Hardcoded | ✅ **Çözüldü** (env'e bağlı) |
| 3. HTTP yolu (LoginPage raw fetch) | ⚠️ Pürüz | ✅ **Çözüldü** (paylaşılan axios) |
| **Hata yönetimi (ABP mesaj/validation)** | ✅ Doğru (`http()` ile) | ✅ **Çözüldü** (response interceptor + regresyon testi) |
| Body tipi (`as never` cast) | — | ✅ **Çözüldü** (servisler `*Writable` DTO'ya bağlı; `tsc -b` temiz) |
| Token saklama (localStorage / BFF / CSP) | ⚠️ Güvenlik notu | ⏸️ Bilinçli ertelendi |

---

## ✅ Çözülen maddeler (doğrulandı)

### 1. Codegen artık gerçekten kullanılıyor — ANA MADDE ÇÖZÜLDÜ
- `src/api/index.ts` → `client.setConfig({ axios: axiosInstance, throwOnError: true })`. Generated client artık `httpClient.ts`'teki **tek paylaşılan axios instance**'ını kullanıyor. Eski, tekrar eden token interceptor'ı (ölü kod) kaldırılmış.
- Tüm servisler elle URL string'i yerine **generated SDK fonksiyonlarını** çağırıyor. Örn. `useStudents.ts` → `getApiAppStudent({ query: { SkipCount, MaxResultCount, Filter } })`, `postApiAppStudent`, `putApiAppStudentById`, `deleteApiAppStudentById`. Manuel param string'leri ve drift riski gitti; paramlar tipli.
- Kapsanan servisler: students, users (+assignable roles), roles, permission-management, tenants (+connection-string), features, settings (emailing + test + timezone), my-profile.
- `appConfig.ts` (`/api/abp/application-configuration`) hâlâ `http()` üzerinde — ama o da aynı paylaşılan axios instance'ını kullandığı için tutarlı.

### 2. `any` sızıntıları temizlendi — ÇÖZÜLDÜ
- `AppConfigProvider.tsx` artık `AppConfig['currentUser']` / `AppConfig['localization']` kullanıyor; `(appConfig as any)` cast'leri ve `i18n.tsx`'teki ikinci `LocalizationData` tanımı kaldırılmış.
- Grep doğrulaması: app (production) kodunda `as any` / `: any` = **0**. Kalan `any` kullanımları yalnızca:
  - `abpError.ts:17` → `parseAbpError(body: any)` — tel üzerinden gelen tiplenmemiş veri; meşru.
  - `*.test.ts(x)` dosyaları — mock'lar; sorun değil.

### 3. openapi-ts input env'e bağlandı — ÇÖZÜLDÜ
- `openapi-ts.config.ts` → `process.env.OPENAPI_INPUT ?? process.env.VITE_API_URL ?? 'https://localhost:44334'`, swagger path otomatik ekleniyor.

### 4. 3. HTTP yolu kapatıldı — ÇÖZÜLDÜ
- `LoginPage.tsx` tenant resolve artık ham `fetch()` yerine `axiosInstance.get(...)` kullanıyor (pre-auth olduğu için token enjekte edilmiyor, doğru).

---

## ✅ Çözüldü: CRUD hata mesajları ABP detayını kaybediyordu (regresyon kapatıldı)

İkinci turda tespit edilmişti: codegen geçişiyle birlikte generated SDK çağrıları `http()`'yi atlayıp doğrudan `axiosInstance`'ı kullandığı için, ABP-error parse + 401-retry'ın `http()` **fonksiyonunun gövdesinde** (response interceptor'da değil) durması nedeniyle CRUD hataları ham `AxiosError` fırlatıyor, `useCrud.onError` `AbpError` göremiyor ve gerçek mesaj + `validationErrors` kayboluyordu.

**Yapılan düzeltme (commit `c4cec9b`) — koddan doğrulandı:**
- ABP-error parse + 401 silent-renew artık paylaşılan `axiosInstance` üzerinde bir **response interceptor**'da (`httpClient.ts:34-58`). `__isRetry` guard'lı 401 → `signinSilent` → `axiosInstance.request(config)` retry, başarısızlıkta `signinRedirect`. Hata yolu artık `parseAbpError(...)` ile `AbpError` döndürüyor.
- `http()` inceltildi (`httpClient.ts:66-87`): yalnızca request + 204/boş gövde map'i; hata yönetimi interceptor'a devredildi.
- Sonuç: **hem `http()` hem generated SDK birebir aynı davranışı alıyor** — backend'in gerçek mesajı + `validationErrors` + her çağrıda 401 token yenileme. `index.ts` yorumu da artık doğru.
- **Regresyon kilidi:** `httpClient.test.ts:74` → "generated-SDK path: a direct axiosInstance call also yields AbpError with the real message + validationErrors" testi, doğrudan `axiosInstance` çağrısının `AbpError` fırlattığını ve `validationErrors[0].members`'ın `'name'` içerdiğini assert ediyor. Grep ile teyit: `interceptors.response` artık tam olarak burada var (tek yer).

---

## ✅ Çözüldü: `as never` cast'leri kaldırıldı (8 yer)

Önceki turda `body: input as never` 8 yerde tip kontrolünü entegrasyon sınırında kapatıyordu (`useUsers`, `useRoles`, `useTenants`, `myProfileService`, `SettingsPage`).

**Yapılan düzeltme — koddan doğrulandı:**
- Servis generic tipleri Zod-türevi tipler yerine **doğrudan generated `*Writable` DTO'larına** bağlandı. Örn. `userService: CrudService<UserDto, VoloAbpIdentityIdentityUserCreateDtoWritable, VoloAbpIdentityIdentityUserUpdateDtoWritable>` → `create(input)` artık DTO tipini alıyor, `postApiIdentityUsers({ body: input })` cast'siz tip-uyumlu. Aynısı roles / tenants için.
- `myProfileService.ts` generated DTO'ları (`UpdateProfileDtoWritable`, `ChangePasswordInput`) kullanıyor.
- `SettingsPage.tsx` `as never` yerine **açık alan map'i** yapıyor: `onSubmit` / `onTestEmailSubmit` Zod değerlerini generated DTO'ya elle (null-coalescing'li) dönüştürüyor. Doğru pattern.
- **Kanıt:** projede `as never` = **0**; yerine `as unknown as` / `@ts-expect-error` gibi başka kaçış konmamış (kalanlar yalnızca test setup + generated kod). `tsc -b --force` → **EXIT=0** (tüm proje tip-temiz).

**Kalan kozmetik notlar (sorun değil):**
- `SettingsPage.tsx`'te `zodResolver(...) as Resolver<...>` — bilinen zod v4 / `@hookform/resolvers` tip sürtünmesi; API body güvenliğini etkilemez.
- `UsersPage.tsx`'te `data as CreateUserInput` / `as UpdateUserInput` — paylaşılan formda union kolunu ayrıştırma; tip-deliği değil.

---

## ⏸️ Bilinçli ertelenen: token saklama (BFF/cookie + CSP)

Ekip kararı (makul):
- Token şu an `localStorage`'da (XSS'e açık). Gerçek koruma için BFF (sunucu token tutar, httpOnly cookie) gerekir — bu da bilerek seçilen **statik / sunucusuz SPA** mimarisine terstir.
- CSP, SPA içine gömülmekten çok **hosting katmanında** (nginx/IIS) verilmeli.
- İç backoffice olduğu için risk düşük; mimari/altyapı kararı olarak ertelendi. ✔️ Kabul edilebilir gerekçe.

---

## ✅ Baştan beri iyi olan kısımlar (referans)

- **OIDC / Auth:** PKCE (`response_type: 'code'`), `automaticSilentRenew`, ve logout race-condition'ını çözen `_signingOut` guard'ı (`userManager.ts:18-29`) — senior seviye, dökümante edilmiş.
- **Multi-tenancy:** `__tenant` query param (`AuthProvider.tsx:32-35`) + tenant adını id'ye çevirme (`LoginPage.tsx`).
- **İzinler:** `application-configuration` → `grantedPolicies` → `usePermission` / `RequirePermission` / Sidebar gating; backend de ayrıca enforce ediyor (defense-in-depth).
- **Lokalizasyon:** ABP `::` namespace → i18next map, RTL desteği, `culture.ts` senkron store, dil değişiminde `Accept-Language` + `invalidateQueries`.
- **Runtime config:** `dynamic-env.json` ile tek Docker image, çok ortam (rebuild yok).
- **CRUD soyutlaması:** `useCrud` + TanStack Query; provider sıralaması doğru; gerçek testler (45 test geçiyor, MSW mock'lı).

---

## Öncelikli aksiyonlar (güncel)

1. ~~ABP-error parse + 401-retry'ı response interceptor'a taşı~~ → ✅ **Yapıldı** (commit `c4cec9b`).
2. ~~`as never` cast'lerini kaldır~~ → ✅ **Yapıldı** (servisler `*Writable` DTO'ya bağlandı; `tsc -b` temiz).
3. (İleride, bilinçli ertelendi) Hosting katmanında CSP; gerekirse BFF/cookie değerlendirmesi.

---

## Özet

İlk değerlendirmenin ana eleştirisi (**codegen kurulup kullanılmaması**) ekip tarafından doğru ve temiz çözülmüş; `any`, env ve 3. HTTP yolu pürüzleri gitmiş. İkinci turda tespit edilen **ABP hata mesajı regresyonu** response interceptor'a taşınarak (+ regresyon testi) kapatılmış; son turda **`as never` cast'leri** de servisleri generated `*Writable` DTO'larına bağlayarak giderilmiş. Tüm proje `tsc -b` ile temiz derleniyor ve 46 test geçiyor. **Açık teknik bulgu kalmadı**; yalnızca token/BFF/CSP mimari gerekçeyle bilinçli ertelenmiş durumda. Entegrasyon kalitesi bu haliyle backoffice için sağlam ve bakımı kolay.
