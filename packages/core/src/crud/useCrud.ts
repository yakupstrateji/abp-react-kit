import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AbpError } from '../api/abpError'

export interface CrudService<TItem, TCreate, TUpdate> {
  getList: (params: { skip: number; take: number; filter?: string }) => Promise<{ items: TItem[]; totalCount: number }>
  create: (input: TCreate) => Promise<TItem>
  update: (id: string, input: TUpdate) => Promise<TItem>
  remove: (id: string) => Promise<void>
}

export interface CrudNotify {
  success: (msg: string) => void
  error: (msg: string) => void
}
export interface CrudMessages {
  created: string
  updated: string
  deleted: string
  failed: string
}

const NOOP_NOTIFY: CrudNotify = { success: () => {}, error: () => {} }
const DEFAULT_MESSAGES: CrudMessages = { created: 'Created', updated: 'Updated', deleted: 'Deleted', failed: 'Operation failed' }

export function useCrud<TItem, TCreate, TUpdate>(
  key: string,
  service: CrudService<TItem, TCreate, TUpdate>,
  params: { skip: number; take: number; filter?: string },
  options?: { notify?: CrudNotify; messages?: Partial<CrudMessages> },
) {
  const notify = options?.notify ?? NOOP_NOTIFY
  const messages = { ...DEFAULT_MESSAGES, ...options?.messages }
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [key] })
  const onError = (e: unknown) => notify.error(e instanceof AbpError ? e.message : messages.failed)

  const list = useQuery({ queryKey: [key, params], queryFn: () => service.getList(params) })
  const create = useMutation({
    mutationFn: service.create,
    onSuccess: () => { invalidate(); notify.success(messages.created) },
    onError,
  })
  const update = useMutation({
    mutationFn: (v: { id: string; input: TUpdate }) => service.update(v.id, v.input),
    onSuccess: () => { invalidate(); notify.success(messages.updated) },
    onError,
  })
  const remove = useMutation({
    mutationFn: service.remove,
    onSuccess: () => { invalidate(); notify.success(messages.deleted) },
    onError,
  })
  return { list, create, update, remove }
}
