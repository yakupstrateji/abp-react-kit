import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CrudPage } from '@/components/crud/CrudPage'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/input'
import type { Column } from '@/components/ui/Table'
import { usePermission } from '@yakupsogut/abp-react-core'
import type { VoloAbpIdentityIdentityUserDto } from '@/api/generated/types.gen'
import { useUsers, getAssignableRoles, getUserRoles } from './useUsers'
import { UserForm } from './UserForm'
import type { CreateUserInput, UpdateUserInput } from './userSchema'
import { PermissionEditor } from '@/features/admin/roles/PermissionEditor'
import { getPermissions, updatePermissions } from '@/features/admin/roles/permissionService'
import { useL } from '@yakupsogut/abp-react-core'

type UserRow = VoloAbpIdentityIdentityUserDto & Record<string, unknown>

const PAGE_SIZE = 10

export function UsersPage() {
  const L = useL()
  const [skip, setSkip] = useState(0)
  const [filter, setFilter] = useState('')
  const [filterInput, setFilterInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VoloAbpIdentityIdentityUserDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VoloAbpIdentityIdentityUserDto | null>(null)
  const [permTarget, setPermTarget] = useState<VoloAbpIdentityIdentityUserDto | null>(null)

  const canCreate = usePermission('AbpIdentity.Users.Create')
  const canUpdate = usePermission('AbpIdentity.Users.Update')
  const canDelete = usePermission('AbpIdentity.Users.Delete')
  const canManagePermissions = usePermission('AbpIdentity.Users.ManagePermissions')

  const { list, create, update, remove } = useUsers({ skip, take: PAGE_SIZE, filter })

  const rolesQuery = useQuery({
    queryKey: ['assignable-roles'],
    queryFn: getAssignableRoles,
  })

  const userPermQuery = useQuery({
    queryKey: ['user-permissions', permTarget?.id],
    queryFn: () => getPermissions('U', permTarget!.id!),
    enabled: !!permTarget?.id,
  })

  const editRolesQuery = useQuery({
    queryKey: ['user-roles', editTarget?.id],
    queryFn: () => getUserRoles(editTarget!.id!),
    enabled: !!editTarget?.id,
  })

  const users = (list.data?.items ?? []) as UserRow[]
  const totalCount = list.data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  const columns: Column<UserRow>[] = [
    {
      key: 'userName',
      header: L('UserName', 'Kullanıcı Adı'),
    },
    {
      key: 'email',
      header: L('Email', 'E-posta'),
    },
    {
      key: 'name',
      header: L('FullName', 'Ad Soyad'),
      render: (row) => {
        const parts = [row.name, row.surname].filter(Boolean)
        return parts.length ? parts.join(' ') : '—'
      },
    },
    {
      key: 'isActive',
      header: L('Active', 'Aktif'),
      render: (row) => (row.isActive ? L('Yes', 'Evet') : L('No', 'Hayır')),
    },
    {
      key: 'actions',
      header: L('Actions', 'İşlemler'),
      render: (row) => (
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditTarget(row)
                setModalOpen(true)
              }}
            >
              {L('AbpUi::Edit', 'Düzenle')}
            </Button>
          )}
          {canManagePermissions && (
            <Button
              variant="ghost"
              onClick={() => setPermTarget(row)}
            >
              {L('Permissions', 'İzinler')}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              onClick={() => setDeleteTarget(row)}
            >
              {L('AbpUi::Delete', 'Sil')}
            </Button>
          )}
        </div>
      ),
    },
  ]

  function handleCloseModal() {
    setModalOpen(false)
    setEditTarget(null)
  }

  async function handleSubmit(data: CreateUserInput | UpdateUserInput) {
    try {
      if (editTarget?.id) {
        // Drop the password field when left blank so we don't send an empty
        // string (which would otherwise attempt to reset the password).
        const { password, ...rest } = data as UpdateUserInput
        const input: UpdateUserInput = password ? { ...rest, password } : rest
        await update.mutateAsync({ id: editTarget.id, input })
      } else {
        await create.mutateAsync(data as CreateUserInput)
      }
      handleCloseModal()
    } catch {
      // errors are handled by the mutation's onError / toast
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return
    await remove.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function handleSaveUserPermissions(changes: Array<{ name: string; isGranted: boolean }>) {
    if (!permTarget?.id) return
    try {
      await updatePermissions('U', permTarget.id, changes)
      toast.success(L('PermissionsUpdated', 'İzinler güncellendi'))
      setPermTarget(null)
    } catch {
      // errors are handled by the caller / toast
    }
  }

  function handleSearch() {
    setFilter(filterInput)
    setSkip(0)
  }

  const toolbar = (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={filterInput}
        onChange={(e) => setFilterInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder={L('AbpUi::Search', 'Ara...')}
        className="w-48"
      />
      <Button variant="ghost" onClick={handleSearch}>
        {L('AbpUi::Search', 'Ara')}
      </Button>
    </div>
  )

  return (
    <>
      <CrudPage
        title={L('Users', 'Kullanıcılar')}
        columns={columns}
        rows={users}
        loading={list.isLoading}
        empty={L('NoUsersFound', 'Kullanıcı bulunamadı.')}
        onCreate={canCreate ? () => { setEditTarget(null); setModalOpen(true) } : undefined}
        toolbar={toolbar}
        rowKey={(row) => row.id ?? ''}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-gray-600">
            {L('TotalRecords', 'Toplam')} {totalCount} {L('Records', 'kayıt')} — {L('Page', 'Sayfa')} {currentPage}/{totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={skip === 0}
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
            >
              {L('Previous', '‹ Önceki')}
            </Button>
            <Button
              variant="ghost"
              disabled={currentPage >= totalPages}
              onClick={() => setSkip(skip + PAGE_SIZE)}
            >
              {L('Next', 'Sonraki ›')}
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editTarget ? L('EditUser', 'Kullanıcıyı Düzenle') : L('NewUser', 'Yeni Kullanıcı')}
      >
        {editTarget && editRolesQuery.isLoading ? (
          // Wait for the user's current roles before mounting the form, otherwise
          // react-hook-form initializes roleNames to [] and a save would strip
          // every role (defaultValues are read once, at mount).
          <Spinner label={L('Loading', 'Yükleniyor…')} />
        ) : (
          <UserForm
            key={editTarget?.id ?? 'new'}
            initialValues={
              editTarget
                ? {
                    id: editTarget.id,
                    userName: editTarget.userName ?? '',
                    email: editTarget.email ?? '',
                    name: editTarget.name ?? '',
                    surname: editTarget.surname ?? '',
                    phoneNumber: editTarget.phoneNumber ?? '',
                    roleNames: editRolesQuery.data ?? [],
                    concurrencyStamp: editTarget.concurrencyStamp ?? undefined,
                  }
                : undefined
            }
            assignableRoles={rolesQuery.data ?? []}
            onSubmit={handleSubmit}
            loading={create.isPending || update.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={L('DeleteUser', 'Kullanıcıyı Sil')}
        message={`"${deleteTarget?.userName ?? ''}" ${L('DeleteUserConfirm', 'kullanıcısını silmek istediğinizden emin misiniz?')}`}
        loading={remove.isPending}
      />

      {/* User Permissions Modal */}
      <Modal
        open={!!permTarget}
        onClose={() => setPermTarget(null)}
        title={`${L('Permissions', 'İzinler')} — ${permTarget?.userName ?? ''}`}
      >
        {userPermQuery.isLoading ? (
          <Spinner label={L('Loading', 'Yükleniyor…')} />
        ) : (
          <PermissionEditor
            groups={userPermQuery.data?.groups ?? []}
            onSave={handleSaveUserPermissions}
          />
        )}
      </Modal>
    </>
  )
}
