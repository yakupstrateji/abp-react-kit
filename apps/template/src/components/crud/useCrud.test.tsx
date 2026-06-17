import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCrud } from '@/lib/crud'
import type { CrudService } from '@/lib/crud'

// Prevent sonner from erroring in jsdom
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useL from core — keep all other core exports intact via importOriginal
vi.mock('@strateji/abp-react-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@strateji/abp-react-core')>()
  return {
    ...actual,
    useL: () => (key: string, fallback?: string) => fallback ?? key,
  }
})

// Types for the fake items used in tests
interface FakeItem {
  id: string
  name: string
}
interface FakeCreate {
  name: string
}
interface FakeUpdate {
  name: string
}

// Helper: build a fresh QueryClient with retries disabled
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

// Helper: build a wrapper with a fresh QueryClient
function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

// Helper: build a fully-typed fake CrudService
function makeFakeService(overrides: Partial<CrudService<FakeItem, FakeCreate, FakeUpdate>> = {}): CrudService<FakeItem, FakeCreate, FakeUpdate> {
  return {
    getList: vi.fn().mockResolvedValue({ items: [{ id: '1', name: 'Alice' }], totalCount: 1 }),
    create: vi.fn().mockResolvedValue({ id: '2', name: 'Bob' }),
    update: vi.fn().mockResolvedValue({ id: '1', name: 'Alice Updated' }),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const PARAMS = { skip: 0, take: 10 }

describe('useCrud', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls service.getList and exposes returned items in list.data', async () => {
    const service = makeFakeService()
    const qc = makeQueryClient()

    const { result } = renderHook(
      () => useCrud<FakeItem, FakeCreate, FakeUpdate>('items', service, PARAMS),
      { wrapper: makeWrapper(qc) },
    )

    // Wait for the query to succeed
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    expect(service.getList).toHaveBeenCalledTimes(1)
    expect(service.getList).toHaveBeenCalledWith(PARAMS)
    expect(result.current.list.data?.items).toHaveLength(1)
    expect(result.current.list.data?.items[0].name).toBe('Alice')
    expect(result.current.list.data?.totalCount).toBe(1)
  })

  it('calling create.mutate calls service.create and triggers list invalidation / refetch', async () => {
    const service = makeFakeService()
    const qc = makeQueryClient()

    const { result } = renderHook(
      () => useCrud<FakeItem, FakeCreate, FakeUpdate>('items', service, PARAMS),
      { wrapper: makeWrapper(qc) },
    )

    // Wait for initial list load
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    const callsBefore = (service.getList as ReturnType<typeof vi.fn>).mock.calls.length

    // Trigger create mutation
    await act(async () => {
      result.current.create.mutate({ name: 'Bob' })
    })

    // Wait for the mutation to succeed and the list to have been re-fetched
    await waitFor(() => expect(result.current.create.isSuccess).toBe(true))

    expect(service.create).toHaveBeenCalledWith({ name: 'Bob' }, expect.any(Object))

    // After invalidation the list query should have been refetched (getList called again)
    await waitFor(() =>
      expect((service.getList as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(callsBefore)
    )

    // toast.success should have been called with the localised "created" message (fallback)
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('Eklendi')
  })

  it('calls service.update when update.mutate is called', async () => {
    const service = makeFakeService()
    const qc = makeQueryClient()

    const { result } = renderHook(
      () => useCrud<FakeItem, FakeCreate, FakeUpdate>('items', service, PARAMS),
      { wrapper: makeWrapper(qc) },
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    await act(async () => {
      result.current.update.mutate({ id: '1', input: { name: 'Updated' } })
    })

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true))
    expect(service.update).toHaveBeenCalledWith('1', { name: 'Updated' })

    // toast.success should have been called with the localised "updated" message (fallback)
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('Güncellendi')
  })

  it('calls service.remove when remove.mutate is called', async () => {
    const service = makeFakeService()
    const qc = makeQueryClient()

    const { result } = renderHook(
      () => useCrud<FakeItem, FakeCreate, FakeUpdate>('items', service, PARAMS),
      { wrapper: makeWrapper(qc) },
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    await act(async () => {
      result.current.remove.mutate('1')
    })

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true))
    expect(service.remove).toHaveBeenCalledWith('1', expect.any(Object))

    // toast.success should have been called with the localised "deleted" message (fallback)
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('Silindi')
  })

  it('toasts an AbpError message on create error', async () => {
    const { toast } = await import('sonner')
    const { AbpError } = await import('@strateji/abp-react-core')

    const abpErr = new AbpError(422, 'Geçersiz giriş')
    const service = makeFakeService({
      create: vi.fn().mockRejectedValue(abpErr),
    })
    const qc = makeQueryClient()

    const { result } = renderHook(
      () => useCrud<FakeItem, FakeCreate, FakeUpdate>('items', service, PARAMS),
      { wrapper: makeWrapper(qc) },
    )

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    await act(async () => {
      result.current.create.mutate({ name: 'Bad' })
    })

    await waitFor(() => expect(result.current.create.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Geçersiz giriş')
  })
})
