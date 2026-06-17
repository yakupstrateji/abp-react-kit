import { Link } from '@tanstack/react-router'
import { usePermission, useL } from '@yakupsogut/abp-react-core'
import { navigation, type NavEntry } from '@/app/navigation'

function SidebarLink({ to, label, exact }: { to: string; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: !!exact }}
      activeProps={{ className: 'block rounded-md px-3 py-2 text-sm font-medium transition-colors bg-sidebar-active text-sidebar-active-foreground' }}
      inactiveProps={{ className: 'block rounded-md px-3 py-2 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground' }}
    >
      {label}
    </Link>
  )
}

export function Sidebar() {
  const L = useL()
  return (
    <nav className="flex h-full w-56 flex-col gap-1 border-e border-sidebar-border bg-sidebar p-4">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
        {L('SchollApp::Menu', 'Menü')}
      </p>
      {navigation
        .filter((e) => e.showInMenu !== false)
        .map((e) => (
          <SidebarItem key={e.path} entry={e} L={L} />
        ))}
    </nav>
  )
}

function SidebarItem({ entry, L }: { entry: NavEntry; L: (k: string, f?: string) => string }) {
  // Hook called UNCONDITIONALLY (rules-of-hooks). Ignored when entry has no permission.
  const hasPerm = usePermission(entry.permission ?? '__none__')
  const granted = entry.permission ? hasPerm : true
  if (!granted) return null
  return <SidebarLink to={entry.path} label={L(entry.labelKey, entry.fallbackLabel)} exact={entry.exact} />
}
