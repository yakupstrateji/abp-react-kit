# abp-react-kit — Backend'i React SPA için hazırlama

Bu kit bir **React (Vite) frontend'idir**; çalışması için bir **ABP backend'ine** bağlanır.
Bu rehber, kendi ABP backend'inde React SPA'in **login + API** çağrılarının çalışması için
yapman gereken backend tarafı ayarları kopyala-yapıştır örneklerle anlatır.

> **Bağlam:** React `http://localhost:5173`'te, backend `https://localhost:44334` gibi ayrı
> bir origin'de çalışır. Bu **cross-origin + OIDC PKCE** senaryosudur. Frontend ayarları için:
> [`EKIP-REHBERI.md`](./EKIP-REHBERI.md). Bu doküman **backend** tarafıdır.
>
> Örneklerde backend proje adı `AbpDemo`, API scope'u `AbpDemo`, React client `AbpDemo_React`
> varsayılmıştır — kendi proje adınla değiştir.

---

## 0. SPA backend kontrol listesi (TL;DR)

React SPA'in bir ABP backend'ine bağlanması için backend'de **şunlar** gerekir:

- [ ] **(a)** Bir **public / PKCE** OpenIddict client kaydı (`authorization_code` + `refresh_token`)
- [ ] **(b)** Hem `…/auth/callback` **hem** `…/auth/silent-renew` redirect URI'leri (sessiz token yenileme)
- [ ] **(c)** `…/auth/logged-out` post-logout redirect URI
- [ ] **(d)** **CORS** — origin `http://localhost:5173` (MVC şablonunda CORS varsayılan **yoktur**)
- [ ] **(e)** API **scope** adının frontend'deki `VITE_SCOPE` ile **birebir** eşleşmesi
- [ ] **(f)** HTTPS **dev sertifikası** güveni (`dotnet dev-certs https --trust`)

> **Not (MVC vs HttpApi.Host):** ABP'nin **MVC (server-render)** şablonu CORS ve SPA client'ı
> varsayılan getirmez — aşağıdaki adımlar gerekir. **Angular/HttpApi.Host** şablonu bunların
> çoğunu hazır getirir; o zaman çoğunlukla sadece **client adını/redirect URI'lerini** ve
> **CorsOrigins**'i kendi React portuna ayarlaman yeterli olur.

---

## 1. (a–c) React SPA client'ı kaydet (OpenIddict)

`src/<Proje>.Domain/OpenIddict/OpenIddictDataSeedContributor.cs` →
`CreateApplicationsAsync()` içine, **public/PKCE** bir client ekle
(`authorization_code` + `refresh_token`, secret **yok**):

```csharp
// React SPA Client (public, authorization_code + PKCE)
var reactClientId = configurationSection["AbpDemo_React:ClientId"];
if (!reactClientId.IsNullOrWhiteSpace())
{
    var reactRootUrl = configurationSection["AbpDemo_React:RootUrl"]!.TrimEnd('/');

    await CreateApplicationAsync(
        name: reactClientId!,
        type: OpenIddictConstants.ClientTypes.Public,
        consentType: OpenIddictConstants.ConsentTypes.Implicit,
        displayName: "React Application",
        secret: null,
        grantTypes: new List<string>
        {
            OpenIddictConstants.GrantTypes.AuthorizationCode,
            OpenIddictConstants.GrantTypes.RefreshToken
        },
        scopes: commonScopes,
        redirectUri: $"{reactRootUrl}/auth/callback",
        clientUri: reactRootUrl,
        postLogoutRedirectUri: $"{reactRootUrl}/auth/logged-out",
        extraRedirectUris: new List<string> { $"{reactRootUrl}/auth/silent-renew" }
    );
}
```

> **İsteğe bağlı — SPA-içi şifre formu (`authMode: 'password'`):** Login'i ABP arayüzüne
> yönlendirmek yerine SPA içinde kullanıcı adı/şifre formuyla yapmak istersen, bu client'ın
> grant listesine `OpenIddictConstants.GrantTypes.Password` ekle (ROPC):
>
> ```csharp
> grantTypes: new List<string>
> {
>     OpenIddictConstants.GrantTypes.AuthorizationCode,
>     OpenIddictConstants.GrantTypes.RefreshToken,
>     OpenIddictConstants.GrantTypes.Password   // <-- yalnız password modu için
> },
> ```
>
> Sonra frontend'de `VITE_AUTH_MODE=password` ver. **Uyarı:** ROPC OAuth 2.1'de önerilmez ve
> 2FA / harici login / e-posta doğrulama / lockout UX akışlarını **getirmez** (bunlar ABP MVC
> login sayfasında yaşar). Yalnızca güvenilir, birinci-taraf projeler için kullan; varsayılan
> ve internete açık senaryolar için `redirect` (Auth Code + PKCE) modunda kal.

> **Çoklu redirect URI (önemli):** React hem `/auth/callback` (login dönüşü) hem
> `/auth/silent-renew` (sessiz token yenileme) kullanır. ABP şablonunun `CreateApplicationAsync`
> helper'ı **tek** `redirectUri` aldığı için, helper'a opsiyonel bir parametre ekle:
>
> ```csharp
> private async Task CreateApplicationAsync(
>     string name, /* … mevcut parametreler … */,
>     List<string>? extraRedirectUris = null)   // <-- eklendi
> {
>     // … redirectUri eklenen blok …
>     if (!redirectUri.IsNullOrWhiteSpace())
>     {
>         application.RedirectUris.Add(new Uri(redirectUri));
>         foreach (var extra in extraRedirectUris ?? new List<string>())  // <-- eklendi
>             application.RedirectUris.Add(new Uri(extra));
>     }
>     // …
> }
> ```

**DbMigrator `appsettings.json`** → `OpenIddict:Applications` altına client'ın URL'ini ver:

```json
"OpenIddict": {
  "Applications": {
    "AbpDemo_React": {
      "ClientId": "AbpDemo_React",
      "RootUrl": "http://localhost:5173"
    }
  }
}
```

Sonra seed'i **kendi klasöründen** (aşağıdaki cwd tuzağına bak) yeniden çalıştır:

```bash
cd src/AbpDemo.DbMigrator && dotnet run
```

> Frontend'de bu client şu değerlere karşılık gelir: `VITE_CLIENT_ID=AbpDemo_React`,
> `VITE_REDIRECT_URI=http://localhost:5173/auth/callback`,
> `VITE_SILENT_REDIRECT_URI=http://localhost:5173/auth/silent-renew`,
> `VITE_POST_LOGOUT_URI=http://localhost:5173/auth/logged-out`.

---

## 2. (d) CORS yapılandır

MVC şablonunda CORS **yoktur** (server-render olduğu için gerekmez). SPA cross-origin
bağlandığı için eklenmeli.

`src/<Proje>.Web/<Proje>WebModule.cs` → `ConfigureServices` içinde çağrılacak bir metot ekle:

```csharp
private void ConfigureCors(ServiceConfigurationContext context, IConfiguration configuration)
{
    context.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(builder =>
        {
            builder
                .WithOrigins(
                    configuration["App:CorsOrigins"]?
                        .Split(",", StringSplitOptions.RemoveEmptyEntries)
                        .Select(o => o.RemovePostFix("/"))
                        .ToArray() ?? Array.Empty<string>()
                )
                .WithExposedHeaders("_AbpErrorFormat")
                .SetIsOriginAllowedToAllowWildcardSubdomains()
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });
}
```

`OnApplicationInitialization` içinde middleware sırası — `UseRouting()`'ten **sonra**,
`UseAuthentication()`'dan **önce**:

```csharp
app.UseRouting();
app.UseCors();          // <-- eklendi (UseRouting sonrası, UseAuthentication öncesi)
app.UseAuthentication();
```

Web `appsettings.json`:

```json
"App": {
  "SelfUrl": "https://localhost:44334",
  "CorsOrigins": "http://localhost:5173"
}
```

> **Tuzak — `.WithAbpExposedHeaders()` MVC'de derlenmez.** Bu uzantı `Volo.Abp.AspNetCore`
> assembly'sinde (HttpApi.Host şablonunun referansladığı), MVC Web projesinden doğrudan
> referanslanmadığı için derleme hatası verir. Yerine standart
> `.WithExposedHeaders("_AbpErrorFormat")` kullan — login için yeterlidir.

---

## 3. (e) Scope adı frontend ile eşleşsin

Backend'in API scope adı, frontend'deki `VITE_SCOPE`'un sonundaki scope ile **birebir aynı**
olmalı. ABP'de bu genelde **proje adıdır**.

```
backend API scope:  AbpDemo
frontend .env:      VITE_SCOPE=openid profile email roles offline_access AbpDemo
```

> Uyuşmazsa (örn. kit varsayılanı `MyApp` kalmışsa) token reddedilir / 403 alırsın.

---

## 4. (f) HTTPS dev sertifikası güveni

React → `https://localhost:44334` isteklerinde tarayıcı sertifika hatası verirse:

```bash
dotnet dev-certs https --trust      # macOS keychain / Windows cert store parolası sorabilir
dotnet dev-certs https --check --trust
```

> `curl -k` çalışıp tarayıcı çalışmıyorsa sorun **kesinlikle** sertifika güvenidir.
> (Frontend'in `openapi-ts` client üreticisi self-signed dev sertifikasını otomatik tolere eder;
> bu adım tarayıcı içindir.)

---

## 5. Doğrulama (curl)

```bash
# 1) Discovery erişilebilir mi?
curl -sk https://localhost:44334/.well-known/openid-configuration

# 2) CORS preflight → 204 + access-control-allow-origin: http://localhost:5173 beklenir
curl -sk -i -X OPTIONS https://localhost:44334/connect/token \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

`access-control-allow-origin` başlığı dönüyorsa CORS tamam; discovery dönüyorsa backend ayakta.

---

## 6. ⚠️ DbMigrator / host'u DAİMA kendi proje klasöründen çalıştır

Client'ı seed etmek için DbMigrator'ı çalıştırırken bu tuzağa dikkat:

```bash
# DOĞRU
cd src/AbpDemo.DbMigrator && dotnet run

# RİSKLİ
dotnet run --project src/AbpDemo.DbMigrator   # çalışma dizinini repo köküne ayarlar
```

`dotnet run --project <yol>` çalışma dizinini **repo köküne** ayarlar (proje klasörüne değil).
`Host.CreateDefaultBuilder`, `appsettings.json`'ı `Directory.GetCurrentDirectory()`'den okur;
repo kökünde `appsettings.json` olmadığı için connection string `null` olur → `UseSqlite(null)`
→ her bağlantı ayrı, **boş/geçici** bir SQLite veritabanı açar. Belirti:
`SQLite Error 1: 'no such table: AbpSettings'` (tablolar `.db` dosyasında **var** olmasına rağmen).
Aynı kural `…​.Web` ve diğer host projeleri için de geçerli.

---

## 7. Çalıştırma sırası (özet akış)

```bash
# 1) Veritabanı + seed (admin: admin / 1q2w3E*) — KENDİ klasöründen
cd src/AbpDemo.DbMigrator && dotnet run

# 2) Backend (OpenIddict + API + CORS) — KENDİ klasöründen
cd src/AbpDemo.Web && dotnet run          # https://localhost:44334

# 3) Frontend
cd /yol/benim-projem && npm run dev        # http://localhost:5173
```

Tarayıcıda `http://localhost:5173` → **admin / 1q2w3E*** ile giriş.

---

## İlgili dokümanlar

- [`EKIP-REHBERI.md`](./EKIP-REHBERI.md) — frontend kullanımı, `.env`, config katman önceliği
- [`README.md`](../README.md) — mimari ve genel bakış
