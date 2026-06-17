import type { ComponentType } from 'react'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { UsersPage } from '@/features/admin/users/UsersPage'
import { RolesPage } from '@/features/admin/roles/RolesPage'
import { TenantsPage } from '@/features/admin/tenants/TenantsPage'
import { SettingsPage } from '@/features/admin/settings/SettingsPage'
import { ProfilePage } from '@/features/account/ProfilePage'
import { StudentsPage } from '@/features/students/StudentsPage'
import { ClassesPage } from '@/features/classes/ClassesPage'

export interface NavEntry {
  path: string
  labelKey: string
  fallbackLabel: string
  permission?: string
  component: ComponentType
  showInMenu?: boolean // varsayılan true
  exact?: boolean
}

export const navigation: NavEntry[] = [
  { path: '/', labelKey: 'SchollApp::Menu:Dashboard', fallbackLabel: 'Dashboard', component: DashboardPage, exact: true },
  { path: '/students', labelKey: 'SchollApp::Menu:Students', fallbackLabel: 'Öğrenciler', component: StudentsPage },
  { path: '/classes', labelKey: 'SchollApp::Menu:Classes', fallbackLabel: 'Sınıflar', component: ClassesPage },
  { path: '/admin/users', labelKey: 'SchollApp::Menu:Users', fallbackLabel: 'Kullanıcılar', permission: 'AbpIdentity.Users', component: UsersPage },
  { path: '/admin/roles', labelKey: 'SchollApp::Menu:Roles', fallbackLabel: 'Roller', permission: 'AbpIdentity.Roles', component: RolesPage },
  { path: '/admin/tenants', labelKey: 'SchollApp::Menu:Tenants', fallbackLabel: 'Kiracılar', permission: 'AbpTenantManagement.Tenants', component: TenantsPage },
  { path: '/admin/settings', labelKey: 'SchollApp::Menu:Settings', fallbackLabel: 'Ayarlar', permission: 'SettingManagement.Emailing', component: SettingsPage },
  { path: '/profile', labelKey: 'SchollApp::MyProfile', fallbackLabel: 'Profil', component: ProfilePage, showInMenu: false },
]
