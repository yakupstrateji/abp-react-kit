import type { CrudService } from '@/lib/crud'

/**
 * In-memory CrudService for EXAMPLE features (no backend required).
 * Replace with a real backend-wired service (see features/admin/users/useUsers.ts)
 * for production entities, or delete the example feature + its navigation entry.
 */
export function createInMemoryStore<T extends { id?: string }>(
  seed: T[],
): CrudService<T, Omit<T, 'id'>, Omit<T, 'id'>> {
  let items: T[] = seed.map((s, i) => ({ ...s, id: s.id ?? String(i + 1) }))
  let counter = items.length
  const delay = () => new Promise<void>((r) => setTimeout(r, 150))

  return {
    async getList({ skip, take, filter }) {
      await delay()
      const f = filter
        ? items.filter((i) => JSON.stringify(i).toLowerCase().includes(filter.toLowerCase()))
        : items
      return { items: f.slice(skip, skip + take), totalCount: f.length }
    },
    async create(input) {
      await delay()
      const item = { ...(input as object), id: String(++counter) } as T
      items = [item, ...items]
      return item
    },
    async update(id, input) {
      await delay()
      items = items.map((i) => (i.id === id ? ({ ...i, ...(input as object), id } as T) : i))
      return items.find((i) => i.id === id) as T
    },
    async remove(id) {
      await delay()
      items = items.filter((i) => i.id !== id)
    },
  }
}
