import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth, useL, axiosInstance, getAuthMode } from '@yakupsogut/abp-react-core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { branding } from '@/app/branding'

const TENANT_STORAGE_KEY = 'abp-react.tenant'

/** Resolve a tenant name to its id via the public by-name endpoint (no auth). */
async function resolveTenantId(name: string): Promise<string | null> {
  const res = await axiosInstance.get<{
    success: boolean
    tenantId: string | null
    name: string | null
  }>(`/api/abp/multi-tenancy/tenants/by-name/${encodeURIComponent(name)}`)
  return res.data.success ? res.data.tenantId : null
}

/** Switch login UX by configured authMode. */
export function LoginPage() {
  return getAuthMode() === 'password' ? <PasswordLoginForm /> : <RedirectLoginForm />
}

// ── Redirect (OIDC Authorization Code + PKCE) — default ──────────────────────

function RedirectLoginForm() {
  const { loginToTenant } = useAuth()
  const L = useL()

  const [tenantName, setTenantName] = useState<string>(
    () => localStorage.getItem(TENANT_STORAGE_KEY) ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const name = tenantName.trim()

    if (!name) {
      // Host login — clear stored tenant
      localStorage.removeItem(TENANT_STORAGE_KEY)
      await loginToTenant()
      return
    }

    setIsLoading(true)
    try {
      const tenantId = await resolveTenantId(name)
      if (!tenantId) {
        setError(L('TenantNotFound', 'Kiracı bulunamadı'))
        return
      }
      localStorage.setItem(TENANT_STORAGE_KEY, name)
      await loginToTenant(tenantId)
    } catch {
      setError(L('TenantNotFound', 'Kiracı bulunamadı'))
    } finally {
      setIsLoading(false)
    }
  }

  function handleHostLogin() {
    localStorage.removeItem(TENANT_STORAGE_KEY)
    setTenantName('')
    setError(null)
    void loginToTenant()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{branding.appName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="tenant-name">{L('Tenant', 'Kiracı')}</Label>
              <Input
                id="tenant-name"
                type="text"
                value={tenantName}
                onChange={(e) => { setTenantName(e.target.value); setError(null) }}
                placeholder={L('TenantPlaceholder', 'boş = Host')}
                autoComplete="organization"
                disabled={isLoading}
              />
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isLoading} loading={isLoading} className="w-full">
              {L('AbpAccount::Login', 'Giriş yap')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={handleHostLogin}
              disabled={isLoading}
              className="text-sm text-muted-foreground"
            >
              {L('ContinueAsHost', 'Host olarak devam et')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Password (ROPC) — in-SPA username/password form, opt-in ──────────────────

function PasswordLoginForm() {
  const { loginWithPassword } = useAuth()
  const L = useL()
  const navigate = useNavigate()

  const [tenantName, setTenantName] = useState<string>(
    () => localStorage.getItem(TENANT_STORAGE_KEY) ?? '',
  )
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      let tenantId: string | undefined
      const name = tenantName.trim()
      if (name) {
        const resolved = await resolveTenantId(name)
        if (!resolved) {
          setError(L('TenantNotFound', 'Kiracı bulunamadı'))
          return
        }
        tenantId = resolved
        localStorage.setItem(TENANT_STORAGE_KEY, name)
      } else {
        localStorage.removeItem(TENANT_STORAGE_KEY)
      }

      await loginWithPassword(username.trim(), password, tenantId)
      navigate({ to: '/', replace: true })
    } catch (err) {
      // The token endpoint returns OAuth-style { error, error_description } on
      // bad credentials / lockout / 2FA-required (ROPC can't satisfy those).
      const data = (err as { response?: { data?: { error_description?: string } } })?.response?.data
      setError(data?.error_description || L('InvalidCredentials', 'Kullanıcı adı veya şifre hatalı'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{branding.appName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="login-username">{L('UserName', 'Kullanıcı Adı')}</Label>
              <Input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null) }}
                autoComplete="username"
                disabled={isLoading}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="login-password">{L('Password', 'Şifre')}</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="login-tenant">{L('Tenant', 'Kiracı')}</Label>
              <Input
                id="login-tenant"
                type="text"
                value={tenantName}
                onChange={(e) => { setTenantName(e.target.value); setError(null) }}
                placeholder={L('TenantPlaceholder', 'boş = Host')}
                autoComplete="organization"
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isLoading} loading={isLoading} className="w-full">
              {L('AbpAccount::Login', 'Giriş yap')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
