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
import { usePermission } from '@strateji/abp-react-core'
import type { VoloAbpIdentityIdentityRoleDto } from '@/api/generated/types.gen'
import { useRoles } from './useRoles'
import { RoleForm } from './RoleForm'
import { PermissionEditor } from './PermissionEditor'
import { getPermissions, updatePermissions } from './permissionService'
import type { RoleInput } from './roleSchema'
import { useL } from '@strateji/abp-react-core'

type RoleRow = VoloAbpIdentityIdentityRoleDto & Record<string, unknown>

const PAGE_SIZE = 10

export function RolesPage() {
  const L = useL()
  const [skip, setSkip] = useState(0)
  const [filter, setFilter] = useState('')
  const [filterInput, setFilterInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VoloAbpIdentityIdentityRoleDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VoloAbpIdentityIdentityRoleDto | null>(null)
  const [permTarget, setPermTarget] = useState<VoloAbpIdentityIdentityRoleDto | null>(null)

  const canCreate = usePermission('AbpIdentity.Roles.Create')
  const canUpdate = usePermission('AbpIdentity.Roles.Update')
  const canDelete = usePermission('AbpIdentity.Roles.Delete')
  const canManagePermissions = usePermission('AbpIdentity.Roles.ManagePermissions')

  const { list, create, update, remove } = useRoles({ skip, take: PAGE_SIZE, filter })

  const permQuery = useQuery({
    queryKey: ['role-permissions', permTarget?.name],
    queryFn: () => getPermissions('R', permTarget!.name!),
    enabled: !!permTarget?.name,
  })

  const roles = (list.data?.items ?? []) as RoleRow[]
  const totalCount = list.data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  const columns: Column<RoleRow>[] = [
    {
      key: 'name',
      header: L('SchollApp::RoleName', 'Ad'),
    },
    {
      key: 'isDefault',
      header: L('SchollApp::IsDefault', 'Varsayılan'),
      render: (row) => (row.isDefault ? L('SchollApp::Yes', 'Evet') : L('SchollApp::No', 'Hayır')),
    },
    {
      key: 'isPublic',
      header: L('SchollApp::IsPublic', 'Genel'),
      render: (row) => (row.isPublic ? L('SchollApp::Yes', 'Evet') : L('SchollApp::No', 'Hayır')),
    },
    {
      key: 'actions',
      header: L('SchollApp::Actions', 'İşlemler'),
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
              {L('SchollApp::Permissions', 'İzinler')}
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

  async function handleSubmit(data: RoleInput) {
    try {
      if (editTarget?.id) {
        await update.mutateAsync({
          id: editTarget.id,
          input: {
            ...data,
            concurrencyStamp: editTarget.concurrencyStamp ?? undefined,
          },
        })
      } else {
        await create.mutateAsync(data)
      }
      handleCloseModal()
    } catch {
      // errors are handled by the mutation's onError / toast
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return
    try {
      await remove.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // onError in useCrud already shows toast
    }
  }

  async function handleSavePermissions(changes: Array<{ name: string; isGranted: boolean }>) {
    if (!permTarget?.name) return
    try {
      await updatePermissions('R', permTarget.name, changes)
      toast.success(L('SchollApp::PermissionsUpdated', 'İzinler güncellendi'))
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
        title={L('SchollApp::Roles', 'Roller')}
        columns={columns}
        rows={roles}
        loading={list.isLoading}
        empty={L('SchollApp::NoRolesFound', 'Rol bulunamadı.')}
        onCreate={canCreate ? () => { setEditTarget(null); setModalOpen(true) } : undefined}
        toolbar={toolbar}
        rowKey={(row) => row.id ?? ''}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-gray-600">
            {L('SchollApp::TotalRecords', 'Toplam')} {totalCount} {L('SchollApp::Records', 'kayıt')} — {L('SchollApp::Page', 'Sayfa')} {currentPage}/{totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={skip === 0}
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
            >
              {L('SchollApp::Previous', '‹ Önceki')}
            </Button>
            <Button
              variant="ghost"
              disabled={currentPage >= totalPages}
              onClick={() => setSkip(skip + PAGE_SIZE)}
            >
              {L('SchollApp::Next', 'Sonraki ›')}
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editTarget ? L('SchollApp::EditRole', 'Rolü Düzenle') : L('SchollApp::NewRole', 'Yeni Rol')}
      >
        <RoleForm
          key={editTarget?.id ?? 'new'}
          initialValues={
            editTarget
              ? {
                  name: editTarget.name ?? '',
                  isDefault: editTarget.isDefault ?? false,
                  isPublic: editTarget.isPublic ?? false,
                  concurrencyStamp: editTarget.concurrencyStamp ?? undefined,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          loading={create.isPending || update.isPending}
        />
      </Modal>

      {/* Permissions Modal */}
      <Modal
        open={!!permTarget}
        onClose={() => setPermTarget(null)}
        title={`${L('SchollApp::Permissions', 'İzinler')} — ${permTarget?.name ?? ''}`}
      >
        {permQuery.isLoading ? (
          <Spinner label={L('SchollApp::Loading', 'Yükleniyor…')} />
        ) : (
          <PermissionEditor
            groups={permQuery.data?.groups ?? []}
            onSave={handleSavePermissions}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={L('SchollApp::DeleteRole', 'Rolü Sil')}
        message={`"${deleteTarget?.name ?? ''}" ${L('SchollApp::DeleteRoleConfirm', 'rolünü silmek istediğinizden emin misiniz?')}`}
        loading={remove.isPending}
      />
    </>
  )
}
