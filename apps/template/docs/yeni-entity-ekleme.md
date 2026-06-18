# Yeni (İlişkili) Entity Ekleme Reçetesi

> Bir iş ekranını (CRUD) baştan sona eklemek için adım-adım rehber. `Student` ve
> `Class` slice'ları bu kalıbın referansıdır — yenisini eklerken birini kopyala,
> isimleri değiştir.
>
> **İki repo:** Backend `C:\dev\Acme.BookStore` (ABP,
> SQLite), Frontend `C:\dev\bookstore-react` (Vite + React).
> Sıralama önemlidir: **Backend → migration → DbMigrator → codegen → Frontend.**
>
> _Proje adı (`Acme.BookStore`), frontend klasörü (`bookstore-react`) ve yollar (`C:\dev\…`)
> birer örnektir — kendi proje adın ve yollarınla değiştir._

Örnek olarak yeni bir **`Teacher` (Öğretmen)** entity'si ekliyoruz. Kendi
entity'nde `Teacher`→kendi adın, `teachers`→çoğul anahtarın olacak.

---

## 0) TL;DR — Kontrol listesi

**Backend**
- [ ] `Domain/Teachers/Teacher.cs` — `FullAuditedAggregateRoot<Guid>, IMultiTenant`
- [ ] `Application.Contracts/Teachers/` — `TeacherDto`, `CreateUpdateTeacherDto`, `GetTeacherListDto`, `ITeacherAppService`
- [ ] İzinler — `BookStorePermissions.cs` + `BookStorePermissionDefinitionProvider.cs`
- [ ] `Application/Teachers/TeacherAppService.cs` — `CrudAppService` + 4 policy + filtre
- [ ] `BookStoreDbContext.cs` — `DbSet<Teacher>` + `builder.Entity<Teacher>(...)`
- [ ] Lokalizasyon — `Domain.Shared/.../BookStore/{en,tr,ar}.json`
- [ ] `dotnet build` → `dotnet-ef migrations add Added_Teacher` → DbMigrator (exe, bin'den)

**Frontend** (önce backend'i 44334'te başlat, sonra codegen)
- [ ] `pnpm openapi-ts` (client'ı yenile)
- [ ] `features/teachers/` — `teacherSchema.ts`, `useTeachers.ts`, `TeacherForm.tsx`, `TeachersPage.tsx`, test
- [ ] `routes.tsx` — `/teachers` + `RequirePermission`
- [ ] `Sidebar.tsx` — menü linki + `usePermission`
- [ ] İlişki varsa → aşağıdaki **"İlişki (FK)"** bölümü
- [ ] `pnpm vitest run` + `pnpm build` yeşil → commit

---

## 1) Backend

### 1.1 Entity — `Domain/Teachers/Teacher.cs`
```csharp
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace Acme.BookStore.Teachers;

public class Teacher : FullAuditedAggregateRoot<Guid>, IMultiTenant
{
    public Guid? TenantId { get; set; }
    public string Name { get; set; } = string.Empty;   // zorunlu
    public string? Branch { get; set; }                 // opsiyonel
    public bool IsActive { get; set; }
}
```

### 1.2 DTO + servis arayüzü — `Application.Contracts/Teachers/`
- `TeacherDto : FullAuditedEntityDto<Guid>` (+ alanlar)
- `CreateUpdateTeacherDto` (+ `[Required]` / `[StringLength]`)
- `GetTeacherListDto : PagedAndSortedResultRequestDto { public string? Filter { get; set; } }`
- `ITeacherAppService : ICrudAppService<TeacherDto, Guid, GetTeacherListDto, CreateUpdateTeacherDto>`

### 1.3 İzinler
`BookStorePermissions.cs` — `Students` bloğunu kopyala:
```csharp
public static class Teachers
{
    public const string Default = GroupName + ".Teachers";
    public const string Create  = Default + ".Create";
    public const string Edit    = Default + ".Edit";
    public const string Delete  = Default + ".Delete";
}
```
`BookStorePermissionDefinitionProvider.cs` — aynı şekilde `Teachers` grubunu kaydet
(Default + Create/Edit/Delete child'ları, `L("Permission:Teachers")` ile).

### 1.4 AppService — `Application/Teachers/TeacherAppService.cs`
`StudentAppService`'i kopyala. **Önemli:** proje **Mapperly** kullanır ama Student
slice'ı runtime'da elle `MapToGetOutputDto` / `MapToEntityAsync` override'ları yapar
— aynısını yap (her yeni alanı iki yönde de map'le). Ctor'da 4 policy'i ata,
`CreateFilteredQueryAsync`'te `Filter`'ı uygula.

### 1.5 DbContext — `EntityFrameworkCore/BookStoreDbContext.cs`
```csharp
public DbSet<Teacher> Teachers { get; set; }
// OnModelCreating içinde:
builder.Entity<Teacher>(b =>
{
    b.ToTable(BookStoreConsts.DbTablePrefix + "Teachers", BookStoreConsts.DbSchema);
    b.ConfigureByConvention();
    b.Property(x => x.Name).IsRequired().HasMaxLength(64);
    b.Property(x => x.Branch).HasMaxLength(64);
});
```

### 1.6 Lokalizasyon — `Domain.Shared/Localization/BookStore/{en,tr,ar}.json`
Her dosyaya: `Teachers`, `Menu:Teachers`, `Teacher`, `Branch`,
`Permission:Teachers`(+`.Create/.Edit/.Delete`). (tr: Öğretmenler / Öğretmen / Branş.)

### 1.7 Build + migration + uygula
> PowerShell. .NET `~/.dotnet` altında — env'i **her zaman** önce kur.
```powershell
$d = "$env:USERPROFILE\.dotnet"; $env:DOTNET_ROOT=$d; $env:PATH="$d;$d\tools;$env:PATH"
Set-Location 'C:\dev\Acme.BookStore'

# 1) Derle (0 hata olmalı)
& "$d\dotnet.exe" build "Acme.BookStore.slnx" -c Debug -v minimal

# 2) Migration ekle — EntityFrameworkCore PROJESİNDEN çalıştır
Set-Location 'src\Acme.BookStore.EntityFrameworkCore'
& "$d\tools\dotnet-ef.exe" migrations add Added_Teacher

# 3) DbMigrator'ı derle ve EXE'yi KENDİ bin klasöründen çalıştır (aşağıdaki nota bak)
Set-Location 'C:\dev\Acme.BookStore'
& "$d\dotnet.exe" build "src\Acme.BookStore.DbMigrator\Acme.BookStore.DbMigrator.csproj" -c Debug -v minimal
$bin = 'C:\dev\Acme.BookStore\src\Acme.BookStore.DbMigrator\bin\Debug\net10.0'
Set-Location $bin
& "$bin\Acme.BookStore.DbMigrator.exe"
```
> ⚠️ **DbMigrator'ı `dotnet run` ile solution kökünden çalıştırma.** Çalışma
> dizini değişince SQLite dosya yolu/config bozulur ("no such table:
> AbpPermissionGrants"). Daima derlenmiş **EXE'yi kendi `bin\Debug\net10.0`
> dizininden** çalıştır. Backend'i durdurmayı unutma (DLL kilidi):
> `Get-Process Acme.BookStore.Web -EA SilentlyContinue | Stop-Process -Force`.

---

## 2) Backend'i başlat + client'ı yenile (codegen)

```powershell
# Backend (ayrı pencere/arka plan) — 44334'te
$d = "$env:USERPROFILE\.dotnet"; $env:DOTNET_ROOT=$d; $env:PATH="$d;$d\tools;$env:PATH"
$env:ASPNETCORE_ENVIRONMENT='Development'; $env:ASPNETCORE_URLS='https://localhost:44334'
Set-Location 'C:\dev\Acme.BookStore\src\Acme.BookStore.Web'
& "$d\dotnet.exe" run --no-launch-profile

# Backend ayağa kalkınca, frontend reposunda:
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'   # localhost self-signed sertifika için
Set-Location 'C:\dev\bookstore-react'
pnpm openapi-ts
```
Bu, `src/api/generated/`'i swagger'dan yeniden üretir. Üretilen isimler:
- Fonksiyonlar (tekil controller adı): `getApiAppTeacher`, `postApiAppTeacher`,
  `putApiAppTeacherById`, `deleteApiAppTeacherById`
- Tipler: `AcmeBookStoreTeachersTeacherDto`, `AcmeBookStoreTeachersCreateUpdateTeacherDto`

> Üretilen `src/api/generated/` dosyalarını **elle düzenleme.**

---

## 3) Frontend slice — `features/teachers/`

`features/students/`'i kopyala, isimleri değiştir. Altın kural: **servisleri
generated DTO tipleriyle** tiple (Zod tipi değil) → `as never`/`as any` gerekmez.

### 3.1 `teacherSchema.ts` (Zod)
```ts
import { z } from 'zod'
export const teacherSchema = z.object({
  name: z.string().min(1, 'Ad zorunlu'),
  branch: z.string().optional(),
  isActive: z.boolean().default(true),
})
export type TeacherFormInput = z.infer<typeof teacherSchema>
```

### 3.2 `useTeachers.ts` (servis + hooks)
`useClasses.ts`'i birebir kopyala; `Class`→`Teacher`, `class`→`teacher`,
`'classes'`→`'teachers'`. Lookup gerekiyorsa (dropdown'larda kullanılacaksa)
`useTeacherOptions`'ı **`useLookupOptions`** ile yaz:
```ts
import { useLookupOptions } from '@/components/crud/useLookupOptions'

export function useTeacherOptions() {
  return useLookupOptions('teachers', async () => {            // anahtar useCrud ile AYNI
    const res = await getApiAppTeacher({ query: { MaxResultCount: 1000 }, throwOnError: true })
    return (res.data.items ?? []).map((t) => ({ id: t.id ?? '', name: t.name ?? '' }))
  })
}
```

### 3.3 `TeacherForm.tsx` + `TeachersPage.tsx`
`StudentForm` / `StudentsPage`'i kopyala. Sayfada `useCrud('teachers', ...)`,
DataTable kolonları, filtre toolbar, Modal (create/edit, `key={editTarget?.id ?? 'new'}`),
ConfirmDialog, ve butonları `usePermission('BookStore.Teachers.Create'|'.Edit'|'.Delete')`
ile gizle. Bir de `TeacherForm.test.tsx` (zorunlu-alan validasyonu) ekle.

### 3.4 Route — `src/routes.tsx`
Eager import + `RequirePermission` ile (lazy/Suspense **kullanma** — "Yükleniyor…"
flash'ı yapıyor):
```tsx
import { TeachersPage } from '@/features/teachers/TeachersPage'

const teachersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/teachers',
  component: () => (
    <RequirePermission policy="BookStore.Teachers">
      <TeachersPage />
    </RequirePermission>
  ),
})
// ...ve adminLayoutRoute.addChildren([...])'a teachersRoute'u ekle.
```

### 3.5 Menü — `src/layout/Sidebar.tsx`
```ts
const canTeachers = usePermission('BookStore.Teachers')
// navItems içine:
{ to: '/teachers', label: L('Menu:Teachers', 'Öğretmenler'), show: canTeachers },
```

### 3.6 Doğrula
```powershell
Set-Location 'C:\dev\bookstore-react'
pnpm vitest run   # tüm testler yeşil
pnpm build        # tsc + vite, 0 hata
```

---

## 4) İlişki (Foreign Key) — örn. `Teacher`'ı bir `Class`'a bağlamak

Standalone CRUD'a ek olarak, bir entity'yi başka birine bağlamak için:

**Backend**
1. Entity'ye `public Guid? ClassId { get; set; }` ekle (**nullable** — mevcut
   satırlar bozulmasın).
2. `TeacherDto` ve `CreateUpdateTeacherDto`'ya `Guid? ClassId` ekle.
3. AppService'in elle mapping'inde `ClassId`'yi iki yönde de map'le.
4. DbContext'te FK'yı tanımla (silme davranışı **SetNull**: sınıf silinince
   öğretmenin `ClassId`'si null olur, öğretmen silinmez):
   ```csharp
   b.HasOne<Class>().WithMany().HasForeignKey(x => x.ClassId)
    .OnDelete(DeleteBehavior.SetNull);
   ```
5. Yeni migration (`dotnet-ef migrations add Added_Teacher_ClassId`) → DbMigrator.
6. Client'ı yenile (`pnpm openapi-ts`).

**Frontend**
1. `teacherSchema.ts`: `classId: z.string().nullish()` (generated DTO `string | null | undefined`).
2. `TeacherForm.tsx`: RHF `Controller` + shadcn `Select`; seçenekler
   `useClassOptions()`'tan; null için "— Sınıf yok —" seçeneği.
3. `TeachersPage.tsx`: `useClassOptions()` ile `id → name` map kur, tabloya
   "Sınıf" kolonu ekle (`map[row.classId] ?? '—'`).

---

## 5) Üç altın kural (sürtünmesiz tutmak için)

1. **`entityKey` tutarlılığı** — `useCrud('teachers', ...)`, `useLookupOptions('teachers', ...)`
   ve mutasyon invalidasyonu **aynı string'i** kullanmalı. CRUD mutasyonu
   `invalidateQueries(['teachers'])` çağırır; TanStack prefix-eşleşmesi sayesinde
   `['teachers', 'options']` lookup'ı da otomatik tazelenir.
2. **Lookup/dropdown = her zaman `useLookupOptions`** — ham `useQuery` + serbest
   anahtar yazma. (Eski `['class-options']` hatası "ekledim ama gelmedi"e yol açtı;
   `useLookupOptions` anahtarı `[entityKey, 'options']`'a sabitleyip bunu engeller —
   `useLookupOptions.test.tsx` bunu kilitler.)
3. **İzin iki katmanda** — frontend `RequirePermission` + `usePermission` ile
   gizler, **backend de** `[Authorize]`/policy ile enforce eder (defense-in-depth).
   İzni backend'de tanımlamayı (1.3) atlama.

---

## 6) Sık çıkan sorunlar (yaşanmış)

| Belirti | Sebep / Çözüm |
|---|---|
| DbMigrator: `no such table: AbpPermissionGrants` | `dotnet run` ile kökten çalıştırılmış. EXE'yi **kendi bin dizininden** çalıştır. |
| DbMigrator: `Format of the initialization string starting at index 0` | Bir tenant'ın bağlantı dizesi bozuk (örn. çıplak `BookStore.db`). Geçerli format `Data Source=...`. Gerekirse `AbpTenantConnectionStrings` kaydını temizle. |
| `pnpm openapi-ts` TLS/sertifika hatası | `$env:NODE_TLS_REJECT_UNAUTHORIZED='0'` (yalnız localhost). |
| Build "file in use" / DLL kilidi | `Acme.BookStore.Web` process'i açık. Migration/build'den önce durdur. |
| Yeni kayıt dropdown'a gelmiyor (refresh gerekiyor) | Lookup yanlış anahtarla yazılmış. **Kural #2** — `useLookupOptions` kullan. |
| `body: input as never` yazma ihtiyacı | Servisi Zod tipiyle tiplemişsin. Generated `*Dto` / `*Writable` tipleriyle tiple. |

---

İlk slice'ı eklerken `Student` (standalone) ve `Class` (+ Student→Class ilişkisi)
örneklerine bak; çoğu durumda kopyala-yapıştır + isim değiştir yeterli.
