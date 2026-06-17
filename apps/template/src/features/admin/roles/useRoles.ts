import {
  getApiIdentityRoles,
  postApiIdentityRoles,
  putApiIdentityRolesById,
  deleteApiIdentityRolesById,
} from '@/api/generated/sdk.gen'
import type { CrudService } from '@/components/crud/useCrud'
import { useCrud } from '@/components/crud/useCrud'
import type {
  VoloAbpIdentityIdentityRoleDto,
  VoloAbpIdentityIdentityRoleCreateDtoWritable,
  VoloAbpIdentityIdentityRoleUpdateDtoWritable,
} from '@/api/generated/types.gen'

export const roleService: CrudService<
  VoloAbpIdentityIdentityRoleDto,
  VoloAbpIdentityIdentityRoleCreateDtoWritable,
  VoloAbpIdentityIdentityRoleUpdateDtoWritable
> = {
  async getList({ skip, take, filter }) {
    const res = await getApiIdentityRoles({
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
    const res = await postApiIdentityRoles({ body: input, throwOnError: true })
    return res.data
  },

  async update(id, input) {
    const res = await putApiIdentityRolesById({ path: { id }, body: input, throwOnError: true })
    return res.data
  },

  async remove(id) {
    await deleteApiIdentityRolesById({ path: { id }, throwOnError: true })
  },
}

export function useRoles(params: { skip: number; take: number; filter?: string }) {
  return useCrud<
    VoloAbpIdentityIdentityRoleDto,
    VoloAbpIdentityIdentityRoleCreateDtoWritable,
    VoloAbpIdentityIdentityRoleUpdateDtoWritable
  >('roles', roleService, params)
}
