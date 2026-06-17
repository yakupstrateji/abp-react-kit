import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { userManager } from './userManager'
import { Spinner } from '@/components/ui/Spinner'
import { useL } from '@/i18n/i18n'

export function CallbackPage() {
  const navigate = useNavigate()
  const L = useL()
  useEffect(() => {
    userManager.signinRedirectCallback()
      .then(() => navigate({ to: '/', replace: true }))
      .catch(() => navigate({ to: '/', replace: true }))
  }, [navigate])
  return <Spinner label={L('SchollApp::SigningIn', 'Giriş tamamlanıyor…')} />
}
