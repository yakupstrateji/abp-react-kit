# schollapp-spa — Yeniden Kullanım & Paketleme Notları

> Amaç: Bu React frontend'ini (ABP backend'ine bağlanan, sahip olduğumuz açık-kaynak çözüm) ileride **başka ABP projelerinde tekrar kullanmak**. Business ekranları bilerek ayrı tutuluyor ki çekirdek temiz/yeniden-kullanılabilir kalsın.

## Paketleme seçenekleri

| Yol | Efor | Ne zaman |
|---|---|---|
| **1. Git template + `degit`** | Düşük | Hemen kullanılabilirlik; tek/az proje |
| **2. `dotnet new` template** | Orta | "ABP/antosubash gibi" tek-komut scaffold (`dotnet new ... --apiUrl`) |
| **3. npm "kit" paketi** | Yüksek | 3+ proje / ekip / uzun vade — tek yerden güncelleme |

## Önerilen yol (karar)
- **pnpm monorepo'yu bugün** kurmak ucuz ve risksiz (business zaten ayrı → soyutlama hazır):
  ```
  packages/abp-react-kit   # auth/oidc, httpClient, i18n, app-config, ui, useCrud/CrudPage, admin sayfaları
  apps/project-a           # sadece env + üretilen API client + business ekranları
  ```
  Kit, workspace içinden **internal link**'le kullanılır → npm'in faydası, publish/versiyon yükü olmadan.
- **Registry'ye PUBLISH'i 2. proje gerçekten çıkınca** yap — o zaman 2. tüketici abstraction'ı doğrular (erken/yanlış soyutlamadan kaçın). Geçiş bedava, çünkü zaten paket formunda.

## Sıralama (karar)
**Business önce, npm sonra.** 1-2 gerçek business ekranı, kit'in doğru sınırlarını ortaya çıkarır (neyin değiştiğini öğrenirsin). npm/monorepo çıkarımı mekanik bir refactor; bekledikçe zorlaşmaz, business onu besler. Kit ancak 2. tüketici olunca publish'e değer.

## Tasarım özelleştirme (tüketiciler kendi görünümünü nasıl yapar — fork etmeden)
En önemli tasarım kararı: **mantık = paket, görünüm = projede.**
1. **CSS değişkenleri (tema token'ları):** shadcn `--primary/--background/--radius/dark` üstüne kurulu. Her proje kendi CSS'inde ezer → renk/radius/dark mode anında değişir, kit'e dokunmadan. (Zaten kurulu.)
2. **Tailwind config + `className`:** tüketici sınıf ekler/ezer; bileşenler `cn` ile `className` kabul eder (instance bazında ince ayar).
3. **Props / slot:** DataTable kolonları, custom cell renderer, configurable aksiyonlar → davranış/layout fork'suz özelleşir.
4. **Headless / UI ayrımı (derin özelleştirme için en doğru):**
   - Paket = **mantık** (auth/oidc, httpClient, useCrud, i18n, app-config) → tasarım görüşü yok.
   - **UI kopyala-yapıştır kalır:** shadcn bileşenleri zaten projeye kopyalanmak için tasarlandı. Kit, UI'ı bir `kit init`/registry ile her projeye kopyalar → o proje görünümün tamamına sahip olur, serbestçe editler.

## Her projede DEĞİŞEN (per-project) kısım
- `dynamic-env.json` / `.env`: **API URL, client_id, scope**
- Yeni backend'e **OIDC public client + CORS** kaydı (SPA origin)
- **Üretilen API client** — `pnpm openapi-ts` ile yeni backend'in swagger'ından (PAKETE KONMAZ, backend'e özgü)
- Uygulama adı / branding
- **Localization resource adı** (`SchollApp::` → yeni proje) + i18next `defaultNS`
- **Business ekranları**

## YENİDEN KULLANILAN (çekirdek) kısım
auth/oidc (PKCE, login-öncesi tenant, logout) · httpClient (axios + ABP hata + 401 yenileme) · app-config + `usePermission` · i18n (i18next + RTL + dil değiştirici) · `useCrud`/`CrudPage` · ui primitifleri (shadcn) · admin modülleri (Users/Roles/Tenants/Settings/Profile/Features/izinler) · runtime config (`dynamic-env.json`)

## Frontend npm kit'e özel 3 teknik nüans
1. **Üretilen client paket içinde OLMAZ** — backend'e özgü, her projede üretilir.
2. **Tailwind/shadcn:** tüketen projenin Tailwind `content` config'i kit'in sınıflarını da taramalı (yoksa stiller düşer).
3. **peer deps** (react, @tanstack/react-router, @tanstack/react-query, oidc-client-ts, i18next, axios) tek sürümde tutulmalı — workspace bunu zaten halleder.

## Stack (referans — resmi ABP React ile hizalı)
Vite · React · TypeScript · TanStack Router · TanStack Query · Axios (OpenAPI codegen) · shadcn/ui (Radix + CVA + CSS-değişken tema) · React Hook Form + Zod · OIDC PKCE (oidc-client-ts) · i18next · dynamic-env.json · Vitest + RTL.
Farklı/eksik olan tek şey: ABP'nin **ticari** paketleri (`@volo/*`, `Volo.Abp.AdminConsole`) — yerine açık-kaynak eşdeğerleri.
