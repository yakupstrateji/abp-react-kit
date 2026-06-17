import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { userManager } from '@strateji/abp-react-core'
import { useL } from '@/i18n/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'

export function LoggedOutPage() {
  const L = useL()
  const navigate = useNavigate()

  // Process the end-session response (clears any leftover sign-out state in storage).
  // The local user was already removed during signOut(); this is just cleanup.
  useEffect(() => {
    userManager.signoutRedirectCallback().catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>{L('SchollApp::LoggedOut', 'Çıkış yapıldı')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">{L('SchollApp::SessionEnded', 'Oturumunuz sonlandırıldı.')}</p>
          <Button onClick={() => void navigate({ to: '/login', replace: true })}>
            {L('SchollApp::LoginAgain', 'Tekrar giriş yap')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

