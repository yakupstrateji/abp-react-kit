// EXAMPLE — replace with real service or delete
// Classes feature backed by an in-memory mock (works with no backend).
// For production: swap classService for a backend-wired CrudService (see admin/users/useUsers.ts).
// To remove: delete this feature folder + its entry in the app's navigation.ts.
import type { CrudService } from '@/lib/crud'
import { useCrud } from '@/lib/crud'
import { useLookupOptions } from '@/components/crud/useLookupOptions'
import { createInMemoryStore } from '@/features/_mock/inMemoryStore'
import type { SchoolClass, ClassInput } from './class'

export const classService: CrudService<SchoolClass, ClassInput, ClassInput> =
  createInMemoryStore<SchoolClass>([
    { id: '1', name: '5-A', level: '5', isActive: true },
    { id: '2', name: '6-B', level: '6', isActive: true },
    { id: '3', name: '7-C', level: '7', isActive: true },
  ])

export function useClasses(params: { skip: number; take: number; filter?: string }) {
  return useCrud<SchoolClass, ClassInput, ClassInput>('classes', classService, params)
}

/**
 * Options for the student form dropdown + students table class-name lookup.
 * useLookupOptions keys this under ['classes', 'options'] — the same prefix
 * useCrud('classes') invalidates — so adding/editing/deleting a class refreshes
 * this list automatically (no hard refresh). Keep the 'classes' key in sync with
 * useClasses above.
 */
export function useClassOptions() {
  return useLookupOptions('classes', async () => {
    const { items } = await classService.getList({ skip: 0, take: 100 })
    return items.map((c) => ({ id: c.id as string, name: c.name }))
  })
}
