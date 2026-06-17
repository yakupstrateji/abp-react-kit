import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CrudPage } from '@/components/crud/CrudPage'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Input } from '@/components/ui/input'
import type { Column } from '@/components/ui/Table'
import { usePermission } from '@strateji/abp-react-core'
import type { VoloAbpTenantManagementTenantDto } from '@/api/generated/types.gen'
import { useTenants, getConnectionString, setConnectionString, deleteConnectionString } from './useTenants'
import { TenantForm } from './TenantForm'
import type { CreateTenantInput, UpdateTenantInput } from './tenantSchema'
import { FeatureEditor } from '@/features/admin/features/FeatureEditor'
import { useL } from '@/i18n/i18n'

type TenantRow = VoloAbpTenantManagementTenantDto & Record<string, unknown>

const PAGE_SIZE = 10

export function TenantsPage() {
  const L = useL()
  const [skip, setSkip] = useState(0)
  const [filter, setFilter] = useState('')
  const [filterInput, setFilterInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VoloAbpTenantManagementTenantDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VoloAbpTenantManagementTenantDto | null>(null)
  const [featureTarget, setFeatureTarget] = useState<VoloAbpTenantManagementTenantDto | null>(null)
  const [connStrTarget, setConnStrTarget] = useState<VoloAbpTenantManagementTenantDto | null>(null)
  const [connStrValue, setConnStrValue] = useState('')
  const [connStrSaving, setConnStrSaving] = useState(false)

  const canCreate = usePermission('AbpTenantManagement.Tenants.Create')
  const canUpdate = usePermission('AbpTenantManagement.Tenants.Update')
  const canDelete = usePermission('AbpTenantManagement.Tenants.Delete')
  const canManageFeatures = usePermission('AbpTenantManagement.Tenants.ManageFeatures')
  const canManageConnectionStrings = usePermission('AbpTenantManagement.Tenants.ManageConnectionStrings')

  const queryClient = useQueryClient()
  const { list, create, update, remove } = useTenants({ skip, take: PAGE_SIZE, filter })

  const connStrQuery = useQuery({
    queryKey: ['tenant-connection-string', connStrTarget?.id],
    queryFn: () => getConnectionString(connStrTarget!.id!),
    enabled: !!connStrTarget?.id,
  })

  // Populate input when connection string data loads
  useEffect(() => {
    if (connStrQuery.data !== undefined) {
      setConnStrValue(connStrQuery.data ?? '')
    }
  }, [connStrQuery.data])

  // Reset input when opening a new tenant
  useEffect(() => {
    if (!connStrTarget) {
      setConnStrValue('')
    }
  }, [connStrTarget])

  const tenants = (list.data?.items ?? []) as TenantRow[]
  const totalCount = list.data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  const columns: Column<TenantRow>[] = [
    {
      key: 'name',
      header: L('SchollApp::TenantName', 'Ad'),
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
          {canManageFeatures && (
            <Button
              variant="ghost"
              onClick={() => setFeatureTarget(row)}
            >
              {L('SchollApp::Features', 'Özellikler')}
            </Button>
          )}
          {canManageConnectionStrings && (
            <Button
              variant="ghost"
              onClick={() => setConnStrTarget(row)}
            >
              {L('SchollApp::ConnectionString', 'Bağlantı dizesi')}
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

  async function handleSubmit(data: CreateTenantInput | UpdateTenantInput) {
    try {
      if (editTarget?.id) {
        await update.mutateAsync({
          id: editTarget.id,
          input: {
            ...(data as UpdateTenantInput),
            concurrencyStamp: editTarget.concurrencyStamp ?? undefined,
          },
        })
      } else {
        await create.mutateAsync(data as CreateTenantInput)
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

  async function handleSaveConnectionString() {
    if (!connStrTarget?.id) return
    setConnStrSaving(true)
    try {
      if (connStrValue.trim()) {
        await setConnectionString(connStrTarget.id, connStrValue.trim())
      } else {
        await deleteConnectionString(connStrTarget.id)
      }
      toast.success(L('SchollApp::ConnectionStringSaved', 'Bağlantı dizesi kaydedildi'))
      await queryClient.invalidateQueries({ queryKey: ['tenant-connection-string', connStrTarget.id] })
      setConnStrTarget(null)
    } catch {
      // errors are handled by the caller / toast
    } finally {
      setConnStrSaving(false)
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
        title={L('SchollApp::Tenants', 'Kiracılar')}
        columns={columns}
        rows={tenants}
        loading={list.isLoading}
        empty={L('SchollApp::NoTenantsFound', 'Kiracı bulunamadı.')}
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
        title={editTarget ? L('SchollApp::EditTenant', 'Kiracıyı Düzenle') : L('SchollApp::NewTenant', 'Yeni Kiracı')}
      >
        <TenantForm
          key={editTarget?.id ?? 'new'}
          initialValues={
            editTarget
              ? {
                  id: editTarget.id,
                  name: editTarget.name ?? '',
                  concurrencyStamp: editTarget.concurrencyStamp ?? undefined,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          loading={create.isPending || update.isPending}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={L('SchollApp::DeleteTenant', 'Kiracıyı Sil')}
        message={`"${deleteTarget?.name ?? ''}" ${L('SchollApp::DeleteTenantConfirm', 'kiracısını silmek istediğinizden emin misiniz?')}`}
        loading={remove.isPending}
      />

      {/* Feature Management Modal */}
      {featureTarget && (
        <FeatureEditor
          tenantId={featureTarget.id ?? ''}
          tenantName={featureTarget.name ?? ''}
          open={!!featureTarget}
          onClose={() => setFeatureTarget(null)}
        />
      )}

      {/* Connection String Modal */}
      <Modal
        open={!!connStrTarget}
        onClose={() => setConnStrTarget(null)}
        title={`${L('SchollApp::ConnectionString', 'Bağlantı dizesi')} — ${connStrTarget?.name ?? ''}`}
      >
        {connStrQuery.isLoading ? (
          <Spinner label={L('SchollApp::Loading', 'Yükleniyor…')} />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              {L('SchollApp::ConnectionStringHint', 'Boş bırakırsanız kiracı host veritabanını kullanır.')}
            </p>
            <Input
              type="text"
              value={connStrValue}
              onChange={(e) => setConnStrValue(e.target.value)}
              placeholder={L('SchollApp::ConnectionStringPlaceholder', 'Bağlantı dizesini girin…')}
              disabled={connStrSaving}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setConnStrTarget(null)}
                disabled={connStrSaving}
              >
                {L('AbpUi::Cancel', 'İptal')}
              </Button>
              <Button
                variant="primary"
                loading={connStrSaving}
                onClick={handleSaveConnectionString}
              >
                {L('AbpUi::Save', 'Kaydet')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
