import { Link } from '@tanstack/react-router'
import { usePermission } from '@strateji/abp-react-core'
import { useL } from '@strateji/abp-react-core'

interface NavItem {
  to: string
  label: string
  show: boolean
}

function SidebarLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === '/' }}
      activeProps={{ className: 'block rounded-md px-3 py-2 text-sm font-medium transition-colors bg-sidebar-active text-sidebar-active-foreground' }}
      inactiveProps={{ className: 'block rounded-md px-3 py-2 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground' }}
    >
      {label}
    </Link>
  )
}

export function Sidebar() {
  const L = useL()
  const canUsers = usePermission('AbpIdentity.Users')
  const canRoles = usePermission('AbpIdentity.Roles')
  const canTenants = usePermission('AbpTenantManagement.Tenants')
  const canSettings = usePermission('SettingManagement.Emailing')
  const canStudents = usePermission('SchollApp.Students')
  const canClasses = usePermission('SchollApp.Classes')

  const navItems: NavItem[] = [
    { to: '/', label: L('SchollApp::Menu:Dashboard', 'Dashboard'), show: true },
    { to: '/students', label: L('SchollApp::Menu:Students', 'Öğrenciler'), show: canStudents },
    { to: '/classes', label: L('SchollApp::Menu:Classes', 'Sınıflar'), show: canClasses },
    { to: '/admin/users', label: L('SchollApp::Menu:Users', 'Kullanıcılar'), show: canUsers },
    { to: '/admin/roles', label: L('SchollApp::Menu:Roles', 'Roller'), show: canRoles },
    { to: '/admin/tenants', label: L('SchollApp::Menu:Tenants', 'Kiracılar'), show: canTenants },
    { to: '/admin/settings', label: L('SchollApp::Menu:Settings', 'Ayarlar'), show: canSettings },
  ]

  return (
    <nav className="flex h-full w-56 flex-col gap-1 border-e border-sidebar-border bg-sidebar p-4">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
        {L('SchollApp::Menu', 'Menü')}
      </p>
      {navItems.filter((item) => item.show).map((item) => (
        <SidebarLink key={item.to} to={item.to} label={item.label} />
      ))}
    </nav>
  )
}
