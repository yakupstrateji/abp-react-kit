import { useState } from 'react'
import { CrudPage } from '@/components/crud/CrudPage'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import type { Column } from '@/components/ui/Table'
import { usePermission } from '@/app-config/usePermission'
import type { StratejiSchollAppClassesClassDto } from '@/api/generated/types.gen'
import { useClasses } from './useClasses'
import { ClassForm } from './ClassForm'
import type { ClassFormInput } from './classSchema'
import { useL } from '@/i18n/i18n'

type ClassRow = StratejiSchollAppClassesClassDto & Record<string, unknown>

const PAGE_SIZE = 10

export function ClassesPage() {
  const L = useL()
  const [skip, setSkip] = useState(0)
  const [filter, setFilter] = useState('')
  const [filterInput, setFilterInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StratejiSchollAppClassesClassDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StratejiSchollAppClassesClassDto | null>(null)

  const canCreate = usePermission('SchollApp.Classes.Create')
  const canEdit = usePermission('SchollApp.Classes.Edit')
  const canDelete = usePermission('SchollApp.Classes.Delete')

  const { list, create, update, remove } = useClasses({ skip, take: PAGE_SIZE, filter })

  const classes = (list.data?.items ?? []) as ClassRow[]
  const totalCount = list.data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1

  const columns: Column<ClassRow>[] = [
    {
      key: 'name',
      header: L('SchollApp::Class', 'Sınıf Adı'),
    },
    {
      key: 'level',
      header: L('SchollApp::Level', 'Seviye'),
      render: (row) => <span>{row.level ?? '—'}</span>,
    },
    {
      key: 'isActive',
      header: L('SchollApp::IsActive', 'Aktif'),
      render: (row) => (
        <span className={row.isActive ? 'text-green-600' : 'text-gray-400'}>
          {row.isActive ? '✓' : '✗'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: L('SchollApp::Actions', 'İşlemler'),
      render: (row) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditTarget(row as StratejiSchollAppClassesClassDto)
                setModalOpen(true)
              }}
            >
              {L('AbpUi::Edit', 'Düzenle')}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              onClick={() => setDeleteTarget(row as StratejiSchollAppClassesClassDto)}
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

  async function handleSubmit(data: ClassFormInput) {
    try {
      const payload = {
        name: data.name,
        level: data.level || null,
        isActive: data.isActive,
      }
      if (editTarget?.id) {
        await update.mutateAsync({ id: editTarget.id, input: payload })
      } else {
        await create.mutateAsync(payload)
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
        title={L('SchollApp::Classes', 'Sınıflar')}
        columns={columns}
        rows={classes}
        loading={list.isLoading}
        empty={L('SchollApp::NoClassesFound', 'Sınıf bulunamadı.')}
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
        title={
          editTarget
            ? L('SchollApp::EditClass', 'Sınıfı Düzenle')
            : L('SchollApp::NewClass', 'Yeni Sınıf')
        }
      >
        <ClassForm
          key={editTarget?.id ?? 'new'}
          initialValues={editTarget ?? undefined}
          onSubmit={handleSubmit}
          loading={create.isPending || update.isPending}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={L('SchollApp::DeleteClass', 'Sınıfı Sil')}
        message={`"${deleteTarget?.name ?? ''}" ${L('SchollApp::DeleteClassConfirm', 'sınıfını silmek istediğinizden emin misiniz?')}`}
        loading={remove.isPending}
      />
    </>
  )
}
