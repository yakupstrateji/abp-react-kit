import { useQuery } from '@tanstack/react-query'

/**
 * Shared hook for "lookup" data (dropdowns, table id→name maps) that mirror a
 * CRUD entity's list. It ALWAYS keys the query under `[entityKey, 'options']` —
 * the SAME prefix `useCrud(entityKey)` invalidates after create/update/delete —
 * so the lookup refreshes automatically when the entity changes, with no hard
 * page refresh and no call site having to remember the key shape.
 *
 * Pass the SAME `entityKey` string you pass to `useCrud(entityKey, ...)`. The
 * `fetcher` returns whatever option shape the call site needs (e.g. `{id,name}[]`).
 *
 * @example
 *   export function useClassOptions() {
 *     return useLookupOptions('classes', async () => {
 *       const res = await getApiAppClass({ query: { MaxResultCount: 1000 }, throwOnError: true })
 *       return (res.data.items ?? []).map((c) => ({ id: c.id ?? '', name: c.name ?? '' }))
 *     })
 *   }
 */
export function useLookupOptions<T>(entityKey: string, fetcher: () => Promise<T>) {
  return useQuery({
    queryKey: [entityKey, 'options'],
    queryFn: fetcher,
  })
}
