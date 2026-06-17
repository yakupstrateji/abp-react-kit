import {
  getApiAppStudent,
  postApiAppStudent,
  putApiAppStudentById,
  deleteApiAppStudentById,
} from '@/api/generated/sdk.gen'
import type { CrudService } from '@/lib/crud'
import { useCrud } from '@/lib/crud'
import type {
  StratejiSchollAppStudentsStudentDto,
  StratejiSchollAppStudentsCreateUpdateStudentDto,
} from '@/api/generated/types.gen'

export const studentService: CrudService<
  StratejiSchollAppStudentsStudentDto,
  StratejiSchollAppStudentsCreateUpdateStudentDto,
  StratejiSchollAppStudentsCreateUpdateStudentDto
> = {
  async getList({ skip, take, filter }) {
    const res = await getApiAppStudent({
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
    const res = await postApiAppStudent({ body: input, throwOnError: true })
    return res.data
  },

  async update(id, input) {
    const res = await putApiAppStudentById({ path: { id }, body: input, throwOnError: true })
    return res.data
  },

  async remove(id) {
    await deleteApiAppStudentById({ path: { id }, throwOnError: true })
  },
}

export function useStudents(params: { skip: number; take: number; filter?: string }) {
  return useCrud<
    StratejiSchollAppStudentsStudentDto,
    StratejiSchollAppStudentsCreateUpdateStudentDto,
    StratejiSchollAppStudentsCreateUpdateStudentDto
  >('students', studentService, params)
}
