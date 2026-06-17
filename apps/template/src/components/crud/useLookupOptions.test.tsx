import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useLookupOptions } from './useLookupOptions'

/**
 * Regression lock for the cache-key convention: a lookup must live under
 * [entityKey, 'options'] so that the CRUD mutation's invalidateQueries([entityKey])
 * also refreshes it. If someone keys it elsewhere (the old ['class-options'] bug),
 * this test fails because the fetcher is never re-invoked after invalidation.
 */
describe('useLookupOptions', () => {
  it('keys under [entityKey, "options"] so invalidateQueries([entityKey]) refetches it', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const fetcher = vi.fn().mockResolvedValue([{ id: '1', name: 'A' }])
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useLookupOptions('classes', fetcher), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Simulate a CRUD create/update/delete invalidating the entity prefix.
    await qc.invalidateQueries({ queryKey: ['classes'] })

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  })
})
