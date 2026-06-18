import { useCrud as useCoreCrud, useL, type CrudService } from '@yakupsogut/abp-react-core'
import { toast } from 'sonner'

export type { CrudService }

export function useCrud<TItem, TCreate, TUpdate>(
  key: string,
  service: CrudService<TItem, TCreate, TUpdate>,
  params: { skip: number; take: number; filter?: string },
) {
  const L = useL()
  return useCoreCrud(key, service, params, {
    notify: { success: (m) => toast.success(m), error: (m) => toast.error(m) },
    messages: {
      created: L('Created', 'Eklendi'),
      updated: L('Updated', 'Güncellendi'),
      deleted: L('Deleted', 'Silindi'),
      failed: L('OperationFailed', 'İşlem başarısız'),
    },
  })
}
