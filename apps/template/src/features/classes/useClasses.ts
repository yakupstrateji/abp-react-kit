import {
  getApiAppClass,
  postApiAppClass,
  putApiAppClassById,
  deleteApiAppClassById,
} from '@/api/generated/sdk.gen'
import type { CrudService } from '@/lib/crud'
import { useCrud } from '@/lib/crud'
import { useLookupOptions } from '@/components/crud/useLookupOptions'
import type {
  StratejiSchollAppClassesClassDto,
  StratejiSchollAppClassesCreateUpdateClassDto,
} from '@/api/generated/types.gen'

export const classService: CrudService<
  StratejiSchollAppClassesClassDto,
  StratejiSchollAppClassesCreateUpdateClassDto,
  StratejiSchollAppClassesCreateUpdateClassDto
> = {
  async getList({ skip, take, filter }) {
    const res = await getApiAppClass({
      query: {
        SkipCount: skip,
        MaxResultCount: take,
        ...(filter ? { Filter: filter } : {}),
      },
      throwOnError: true,
    })
    return {
      items: res.data.items ?? [],
      totalCount: res.data.totalCount ?? 0,
    }
  },

  async create(input) {
    const res = await postApiAppClass({ body: input, throwOnError: true })
    return res.data
  },

  async update(id, input) {
    const res = await putApiAppClassById({ path: { id }, body: input, throwOnError: true })
    return res.data
  },

  async remove(id) {
    await deleteApiAppClassById({ path: { id }, throwOnError: true })
  },
}

export function useClasses(params: { skip: number; take: number; filter?: string }) {
  return useCrud<
    StratejiSchollAppClassesClassDto,
    StratejiSchollAppClassesCreateUpdateClassDto,
    StratejiSchollAppClassesCreateUpdateClassDto
  >('classes', classService, params)
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
    const res = await getApiAppClass({
      query: { MaxResultCount: 1000 },
      throwOnError: true,
    })
    return (res.data.items ?? []).map((c) => ({
      id: c.id ?? '',
      name: c.name ?? '',
    }))
  })
}
