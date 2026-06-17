import { useState } from 'react'
import { useAuth } from '@strateji/abp-react-core'
import { useL } from '@/i18n/i18n'
import { axiosInstance } from '@strateji/abp-react-core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const TENANT_STORAGE_KEY = 'schollapp.tenant'

export function LoginPage() {
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
      // Pre-auth call — no bearer token needed; axiosInstance still handles
      // Accept-Language and error parsing but won't inject a token here
      // (getAccessToken returns null before login).
      const res = await axiosInstance.get<{
        success: boolean
        tenantId: string | null
        name: string | null
      }>(`/api/abp/multi-tenancy/tenants/by-name/${encodeURIComponent(name)}`)
      const data = res.data
      if (!data.success || !data.tenantId) {
        setError(L('SchollApp::TenantNotFound', 'Kiracı bulunamadı'))
        return
      }
      localStorage.setItem(TENANT_STORAGE_KEY, name)
      await loginToTenant(data.tenantId)
    } catch {
      setError(L('SchollApp::TenantNotFound', 'Kiracı bulunamadı'))
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
          <CardTitle className="text-xl">SchollApp</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="tenant-name">
                {L('SchollApp::Tenant', 'Kiracı')}
              </Label>
              <Input
                id="tenant-name"
                type="text"
                value={tenantName}
                onChange={(e) => { setTenantName(e.target.value); setError(null) }}
                placeholder={L('SchollApp::TenantPlaceholder', 'boş = Host')}
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
              {L('SchollApp::ContinueAsHost', 'Host olarak devam et')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
