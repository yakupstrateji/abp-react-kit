import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/Table'
import { useL } from '@/i18n/i18n'

interface CrudPageProps<T extends Record<string, unknown>> {
  title: string
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  empty?: string
  onCreate?: () => void
  toolbar?: ReactNode
  rowKey?: (row: T) => string
}

export function CrudPage<T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  loading = false,
  empty,
  onCreate,
  toolbar,
  rowKey,
}: CrudPageProps<T>) {
  const L = useL()

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        <div className="flex items-center gap-2">
          {toolbar}
          {onCreate && (
            <Button variant="primary" onClick={onCreate}>
              {L('AbpUi::New', 'Yeni')}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        empty={empty}
        rowKey={rowKey}
      />
    </div>
  )
}
