import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AbpError } from '@strateji/abp-react-core'
import { useL } from '@strateji/abp-react-core'

export interface CrudService<TItem, TCreate, TUpdate> {
  getList: (params: { skip: number; take: number; filter?: string }) => Promise<{ items: TItem[]; totalCount: number }>
  create: (input: TCreate) => Promise<TItem>
  update: (id: string, input: TUpdate) => Promise<TItem>
  remove: (id: string) => Promise<void>
}

export function useCrud<TItem, TCreate, TUpdate>(
  key: string,
  service: CrudService<TItem, TCreate, TUpdate>,
  params: { skip: number; take: number; filter?: string },
) {
  const L = useL()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [key] })
  const onError = (e: unknown) => toast.error(e instanceof AbpError ? e.message : L('SchollApp::OperationFailed', 'İşlem başarısız'))

  const list = useQuery({
    queryKey: [key, params],
    queryFn: () => service.getList(params),
  })

  const create = useMutation({
    mutationFn: service.create,
    onSuccess: () => { invalidate(); toast.success(L('SchollApp::Created', 'Eklendi')) },
    onError,
  })

  const update = useMutation({
    mutationFn: (v: { id: string; input: TUpdate }) => service.update(v.id, v.input),
    onSuccess: () => { invalidate(); toast.success(L('SchollApp::Updated', 'Güncellendi')) },
    onError,
  })

  const remove = useMutation({
    mutationFn: service.remove,
    onSuccess: () => { invalidate(); toast.success(L('SchollApp::Deleted', 'Silindi')) },
    onError,
  })

  return { list, create, update, remove }
}
