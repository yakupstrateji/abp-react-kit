import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@yakupsogut/abp-react-core'
import { useCurrentUser, useCurrentTenant } from '@yakupsogut/abp-react-core'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import { useL } from '@yakupsogut/abp-react-core'
import { branding } from '@/app/branding'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/Button'

export function Header() {
  const { logout } = useAuth()
  const currentUser = useCurrentUser()
  const currentTenant = useCurrentTenant()
  const L = useL()
  const navigate = useNavigate()

  const tenantLabel = currentTenant?.name
    ? `${L('SchollApp::Tenant', 'Kiracı')}: ${currentTenant.name}`
    : L('SchollApp::Host', 'Host')

  const displayName = currentUser?.name ?? currentUser?.userName ?? ''

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6 shadow-sm">
      {branding.logo ?? (
        <span className="text-lg font-semibold text-foreground">{branding.appName}</span>
      )}
      <div className="flex items-center gap-4">
        {/* Language switcher */}
        <LanguageSwitcher />
        {/* Current tenant — read-only; resolved at login time */}
        <span className="text-xs text-muted-foreground">{tenantLabel}</span>
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {displayName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void navigate({ to: '/profile' as string })}>
                {L('SchollApp::MyProfile', 'Profil')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => void logout()}
                className="text-destructive focus:text-destructive"
              >
                {L('SchollApp::Logout', 'Çıkış')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

