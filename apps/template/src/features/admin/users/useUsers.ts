import {
  getApiIdentityUsers,
  postApiIdentityUsers,
  putApiIdentityUsersById,
  deleteApiIdentityUsersById,
  getApiIdentityUsersAssignableRoles,
  getApiIdentityUsersByIdRoles,
} from '@/api/generated/sdk.gen'
import type { CrudService } from '@/lib/crud'
import { useCrud } from '@/lib/crud'
import type {
  VoloAbpIdentityIdentityUserDto,
  VoloAbpIdentityIdentityRoleDto,
  VoloAbpIdentityIdentityUserCreateDtoWritable,
  VoloAbpIdentityIdentityUserUpdateDtoWritable,
} from '@/api/generated/types.gen'

export const userService: CrudService<
  VoloAbpIdentityIdentityUserDto,
  VoloAbpIdentityIdentityUserCreateDtoWritable,
  VoloAbpIdentityIdentityUserUpdateDtoWritable
> = {
  async getList({ skip, take, filter }) {
    const res = await getApiIdentityUsers({
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
    const res = await postApiIdentityUsers({ body: input, throwOnError: true })
    return res.data
  },

  async update(id, input) {
    const res = await putApiIdentityUsersById({ path: { id }, body: input, throwOnError: true })
    return res.data
  },

  async remove(id) {
    await deleteApiIdentityUsersById({ path: { id }, throwOnError: true })
  },
}

export async function getAssignableRoles(): Promise<VoloAbpIdentityIdentityRoleDto[]> {
  const res = await getApiIdentityUsersAssignableRoles({ throwOnError: true })
  return res.data.items ?? []
}

export async function getUserRoles(id: string): Promise<string[]> {
  const res = await getApiIdentityUsersByIdRoles({ path: { id }, throwOnError: true })
  return (res.data.items ?? []).map((r) => r.name ?? '').filter(Boolean)
}

export function useUsers(params: { skip: number; take: number; filter?: string }) {
  return useCrud<
    VoloAbpIdentityIdentityUserDto,
    VoloAbpIdentityIdentityUserCreateDtoWritable,
    VoloAbpIdentityIdentityUserUpdateDtoWritable
  >('users', userService, params)
}
