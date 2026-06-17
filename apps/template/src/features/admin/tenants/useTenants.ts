import {
  getApiMultiTenancyTenants,
  postApiMultiTenancyTenants,
  putApiMultiTenancyTenantsById,
  deleteApiMultiTenancyTenantsById,
  getApiMultiTenancyTenantsByIdDefaultConnectionString,
  putApiMultiTenancyTenantsByIdDefaultConnectionString,
  deleteApiMultiTenancyTenantsByIdDefaultConnectionString,
} from '@/api/generated/sdk.gen'
import type { CrudService } from '@/lib/crud'
import { useCrud } from '@/lib/crud'
import type {
  VoloAbpTenantManagementTenantDto,
  VoloAbpTenantManagementTenantCreateDtoWritable,
  VoloAbpTenantManagementTenantUpdateDtoWritable,
} from '@/api/generated/types.gen'

// Connection string management — GET returns plain string, PUT uses query param, DELETE clears it
export async function getConnectionString(tenantId: string): Promise<string> {
  const res = await getApiMultiTenancyTenantsByIdDefaultConnectionString({
    path: { id: tenantId },
    throwOnError: true,
  })
  return res.data as string
}

export async function setConnectionString(tenantId: string, value: string): Promise<void> {
  await putApiMultiTenancyTenantsByIdDefaultConnectionString({
    path: { id: tenantId },
    query: { defaultConnectionString: value },
    throwOnError: true,
  })
}

export async function deleteConnectionString(tenantId: string): Promise<void> {
  await deleteApiMultiTenancyTenantsByIdDefaultConnectionString({
    path: { id: tenantId },
    throwOnError: true,
  })
}

export const tenantService: CrudService<
  VoloAbpTenantManagementTenantDto,
  VoloAbpTenantManagementTenantCreateDtoWritable,
  VoloAbpTenantManagementTenantUpdateDtoWritable
> = {
  async getList({ skip, take, filter }) {
    const res = await getApiMultiTenancyTenants({
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
    const res = await postApiMultiTenancyTenants({ body: input, throwOnError: true })
    return res.data
  },

  async update(id, input) {
    const res = await putApiMultiTenancyTenantsById({ path: { id }, body: input, throwOnError: true })
    return res.data
  },

  async remove(id) {
    await deleteApiMultiTenancyTenantsById({ path: { id }, throwOnError: true })
  },
}

export function useTenants(params: { skip: number; take: number; filter?: string }) {
  return useCrud<
    VoloAbpTenantManagementTenantDto,
    VoloAbpTenantManagementTenantCreateDtoWritable,
    VoloAbpTenantManagementTenantUpdateDtoWritable
  >('tenants', tenantService, params)
}
